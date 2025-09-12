import { Invoice, Customer, InvoiceItem, Tenant } from '@handwerkos/database'
import { XRechnungService } from './xrechnung.service'
import { ZugferdService } from './zugferd.service'
import nodemailer from 'nodemailer'
import axios from 'axios'
import FormData from 'form-data'

interface DeliveryChannel {
  id: string
  name: string
  type: 'email' | 'peppol' | 'api' | 'ftp' | 'web_portal'
  config: Record<string, any>
  isActive: boolean
  priority: number
}

interface DeliveryRule {
  id: string
  tenantId: string
  name: string
  conditions: {
    customerIds?: string[]
    customerTypes?: string[]
    invoiceAmountMin?: number
    invoiceAmountMax?: number
    hasLeitwegId?: boolean
    hasVatId?: boolean
  }
  actions: {
    channels: string[]
    format: 'xrechnung' | 'zugferd' | 'both'
    priority: 'low' | 'normal' | 'high' | 'urgent'
    retryAttempts: number
    retryDelay: number // minutes
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface DeliveryAttempt {
  id: string
  invoiceId: string
  ruleId: string
  channelId: string
  format: 'xrechnung' | 'zugferd'
  status: 'pending' | 'processing' | 'success' | 'failed' | 'retry'
  attempt: number
  maxAttempts: number
  scheduledAt: Date
  processedAt?: Date
  completedAt?: Date
  error?: string
  metadata: Record<string, any>
}

interface DeliveryResult {
  success: boolean
  channelId: string
  format: string
  deliveryId?: string
  trackingId?: string
  error?: string
  metadata?: Record<string, any>
  nextRetry?: Date
}

export class DeliveryService {
  private xrechnungService: XRechnungService
  private zugferdService: ZugferdService
  private channels: Map<string, DeliveryChannel> = new Map()
  private rules: Map<string, DeliveryRule> = new Map()
  private emailTransporter: nodemailer.Transporter | null = null

  constructor() {
    this.xrechnungService = new XRechnungService()
    this.zugferdService = new ZugferdService()
    this.initializeEmailTransporter()
    this.loadDefaultChannels()
  }

  private initializeEmailTransporter(): void {
    if (process.env.SMTP_HOST) {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    }
  }

  private loadDefaultChannels(): void {
    // Email delivery channel
    this.channels.set('email', {
      id: 'email',
      name: 'E-Mail Delivery',
      type: 'email',
      config: {
        from: process.env.SMTP_FROM || 'noreply@handwerkos.de',
        subject: 'E-Rechnung: {{invoiceNumber}}',
        template: 'default_email',
        attachmentName: '{{invoiceNumber}}_{{format}}.{{extension}}',
      },
      isActive: true,
      priority: 1,
    })

    // PEPPOL delivery channel
    this.channels.set('peppol', {
      id: 'peppol',
      name: 'PEPPOL Network',
      type: 'peppol',
      config: {
        accessPointUrl: process.env.PEPPOL_ACCESS_POINT_URL,
        certificatePath: process.env.PEPPOL_CERTIFICATE_PATH,
        privateKeyPath: process.env.PEPPOL_PRIVATE_KEY_PATH,
        senderId: process.env.PEPPOL_SENDER_ID,
      },
      isActive: false, // Requires PEPPOL certification
      priority: 2,
    })

    // API delivery channel (for government portals)
    this.channels.set('government_api', {
      id: 'government_api',
      name: 'Government API',
      type: 'api',
      config: {
        endpoints: {
          'bund': 'https://e-rechnung.bund.de/api/v1/invoices',
          'bayern': 'https://e-rechnung.bayern.de/api/v1/submit',
        },
        authentication: {
          type: 'oauth2',
          tokenUrl: 'https://e-rechnung.bund.de/oauth/token',
        },
      },
      isActive: false, // Requires API credentials
      priority: 3,
    })

    // Web Portal upload
    this.channels.set('web_portal', {
      id: 'web_portal',
      name: 'Web Portal Upload',
      type: 'web_portal',
      config: {
        portals: {
          'bund': {
            url: 'https://e-rechnung.bund.de',
            username: process.env.BUND_PORTAL_USERNAME,
            password: process.env.BUND_PORTAL_PASSWORD,
          },
        },
      },
      isActive: false, // Requires manual configuration
      priority: 4,
    })
  }

  async deliverInvoice(
    invoice: Invoice & {
      customer: Customer
      items: InvoiceItem[]
      tenant: Tenant
    },
    options?: {
      forceChannels?: string[]
      format?: 'xrechnung' | 'zugferd' | 'both'
      priority?: 'low' | 'normal' | 'high' | 'urgent'
    }
  ): Promise<DeliveryAttempt[]> {
    // Find applicable delivery rules
    const applicableRules = await this.findApplicableRules(invoice)
    
    if (applicableRules.length === 0 && !options?.forceChannels) {
      throw new Error('No delivery rules found for this invoice')
    }

    const deliveryAttempts: DeliveryAttempt[] = []

    // Process each rule or forced channels
    if (options?.forceChannels) {
      // Use forced channels
      for (const channelId of options.forceChannels) {
        const formats = options.format === 'both' ? ['xrechnung', 'zugferd'] : [options.format || 'xrechnung']
        
        for (const format of formats) {
          const attempt = await this.createDeliveryAttempt({
            invoice,
            channelId,
            format: format as 'xrechnung' | 'zugferd',
            priority: options.priority || 'normal',
            retryAttempts: 3,
            retryDelay: 5,
          })
          
          deliveryAttempts.push(attempt)
        }
      }
    } else {
      // Use delivery rules
      for (const rule of applicableRules) {
        for (const channelId of rule.actions.channels) {
          const formats = rule.actions.format === 'both' ? ['xrechnung', 'zugferd'] : [rule.actions.format]
          
          for (const format of formats) {
            const attempt = await this.createDeliveryAttempt({
              invoice,
              channelId,
              format: format as 'xrechnung' | 'zugferd',
              priority: rule.actions.priority,
              retryAttempts: rule.actions.retryAttempts,
              retryDelay: rule.actions.retryDelay,
              ruleId: rule.id,
            })
            
            deliveryAttempts.push(attempt)
          }
        }
      }
    }

    // Schedule delivery attempts
    for (const attempt of deliveryAttempts) {
      await this.scheduleDelivery(attempt)
    }

    return deliveryAttempts
  }

  private async createDeliveryAttempt(params: {
    invoice: Invoice & { customer: Customer; items: InvoiceItem[]; tenant: Tenant }
    channelId: string
    format: 'xrechnung' | 'zugferd'
    priority: 'low' | 'normal' | 'high' | 'urgent'
    retryAttempts: number
    retryDelay: number
    ruleId?: string
  }): Promise<DeliveryAttempt> {
    const attempt: DeliveryAttempt = {
      id: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      invoiceId: params.invoice.id,
      ruleId: params.ruleId || '',
      channelId: params.channelId,
      format: params.format,
      status: 'pending',
      attempt: 1,
      maxAttempts: params.retryAttempts,
      scheduledAt: new Date(),
      metadata: {
        priority: params.priority,
        retryDelay: params.retryDelay,
        customerName: params.invoice.customer.name,
        invoiceNumber: params.invoice.invoiceNumber,
        totalAmount: params.invoice.total,
      },
    }

    return attempt
  }

  async processDeliveryAttempt(attemptId: string): Promise<DeliveryResult> {
    // This would normally load the attempt from the database
    // For demo purposes, we'll simulate the process
    
    const attempt = { id: attemptId } // Mock attempt loading
    
    try {
      // Load invoice data (mock)
      const invoice = await this.loadInvoiceForDelivery(attemptId)
      const channel = this.channels.get(attempt.channelId)
      
      if (!channel) {
        throw new Error(`Delivery channel ${attempt.channelId} not found`)
      }

      if (!channel.isActive) {
        throw new Error(`Delivery channel ${channel.name} is not active`)
      }

      // Generate E-Rechnung file
      const fileData = await this.generateEInvoiceFile(invoice, attempt.format)
      
      // Deliver via appropriate channel
      const result = await this.deliverViaChannel(channel, fileData, invoice)
      
      if (result.success) {
        // Update attempt status to success
        await this.updateAttemptStatus(attemptId, 'success', result)
        return result
      } else {
        throw new Error(result.error || 'Delivery failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Update attempt status and schedule retry if needed
      const result = await this.handleDeliveryFailure(attemptId, errorMessage)
      return result
    }
  }

  private async deliverViaChannel(
    channel: DeliveryChannel,
    fileData: { content: Buffer | string; filename: string; mimeType: string },
    invoice: any
  ): Promise<DeliveryResult> {
    switch (channel.type) {
      case 'email':
        return await this.deliverViaEmail(channel, fileData, invoice)
      
      case 'peppol':
        return await this.deliverViaPeppol(channel, fileData, invoice)
      
      case 'api':
        return await this.deliverViaAPI(channel, fileData, invoice)
      
      case 'web_portal':
        return await this.deliverViaWebPortal(channel, fileData, invoice)
      
      case 'ftp':
        return await this.deliverViaFTP(channel, fileData, invoice)
      
      default:
        throw new Error(`Unsupported delivery channel type: ${channel.type}`)
    }
  }

  private async deliverViaEmail(
    channel: DeliveryChannel,
    fileData: { content: Buffer | string; filename: string; mimeType: string },
    invoice: any
  ): Promise<DeliveryResult> {
    if (!this.emailTransporter) {
      throw new Error('Email transporter not configured')
    }

    const customerEmail = invoice.customer.email || invoice.customer.contactEmail
    if (!customerEmail) {
      throw new Error('Customer email address not found')
    }

    const mailOptions = {
      from: channel.config.from,
      to: customerEmail,
      subject: this.interpolateTemplate(channel.config.subject, {
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customer.name,
      }),
      html: await this.renderEmailTemplate(channel.config.template, invoice),
      attachments: [
        {
          filename: fileData.filename,
          content: fileData.content,
          contentType: fileData.mimeType,
        },
      ],
    }

    try {
      const info = await this.emailTransporter.sendMail(mailOptions)
      
      return {
        success: true,
        channelId: channel.id,
        format: fileData.filename.includes('xrechnung') ? 'xrechnung' : 'zugferd',
        deliveryId: info.messageId,
        metadata: {
          recipient: customerEmail,
          messageId: info.messageId,
          response: info.response,
        },
      }
    } catch (error) {
      return {
        success: false,
        channelId: channel.id,
        format: fileData.filename.includes('xrechnung') ? 'xrechnung' : 'zugferd',
        error: error instanceof Error ? error.message : 'Email delivery failed',
      }
    }
  }

  private async deliverViaPeppol(
    channel: DeliveryChannel,
    fileData: { content: Buffer | string; filename: string; mimeType: string },
    invoice: any
  ): Promise<DeliveryResult> {
    // PEPPOL delivery implementation
    // This would integrate with a PEPPOL access point
    
    try {
      const peppolEndpoint = invoice.customer.peppolId || this.extractPeppolId(invoice.customer)
      
      if (!peppolEndpoint) {
        throw new Error('Customer PEPPOL endpoint not found')
      }

      // Mock PEPPOL delivery
      const deliveryId = `PEPPOL_${Date.now()}`
      
      return {
        success: true,
        channelId: channel.id,
        format: 'xrechnung', // PEPPOL typically uses XRechnung
        deliveryId,
        trackingId: deliveryId,
        metadata: {
          peppolEndpoint,
          documentType: 'Invoice',
          processId: 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0',
        },
      }
    } catch (error) {
      return {
        success: false,
        channelId: channel.id,
        format: 'xrechnung',
        error: error instanceof Error ? error.message : 'PEPPOL delivery failed',
      }
    }
  }

  private async deliverViaAPI(
    channel: DeliveryChannel,
    fileData: { content: Buffer | string; filename: string; mimeType: string },
    invoice: any
  ): Promise<DeliveryResult> {
    try {
      // Determine target endpoint
      const leitwegId = invoice.customer.leitwegId || this.extractLeitwegId(invoice.customer)
      const endpoint = this.selectAPIEndpoint(channel.config.endpoints, leitwegId)
      
      if (!endpoint) {
        throw new Error('No suitable API endpoint found for this customer')
      }

      // Get authentication token
      const token = await this.getAPIToken(channel.config.authentication)
      
      // Prepare form data
      const formData = new FormData()
      formData.append('invoice', fileData.content, {
        filename: fileData.filename,
        contentType: fileData.mimeType,
      })
      formData.append('leitwegId', leitwegId)
      formData.append('invoiceNumber', invoice.invoiceNumber)

      // Submit to API
      const response = await axios.post(endpoint, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`,
          'X-API-Version': '1.0',
        },
        timeout: 30000,
      })

      return {
        success: true,
        channelId: channel.id,
        format: fileData.filename.includes('xrechnung') ? 'xrechnung' : 'zugferd',
        deliveryId: response.data.id,
        trackingId: response.data.trackingId,
        metadata: {
          endpoint,
          responseStatus: response.status,
          responseData: response.data,
        },
      }
    } catch (error) {
      let errorMessage = 'API delivery failed'
      
      if (axios.isAxiosError(error)) {
        errorMessage = `API Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      return {
        success: false,
        channelId: channel.id,
        format: fileData.filename.includes('xrechnung') ? 'xrechnung' : 'zugferd',
        error: errorMessage,
      }
    }
  }

  private async deliverViaWebPortal(
    channel: DeliveryChannel,
    fileData: { content: Buffer | string; filename: string; mimeType: string },
    invoice: any
  ): Promise<DeliveryResult> {
    // Web portal delivery would typically use browser automation
    // This is a simplified mock implementation
    
    try {
      const portalConfig = this.selectPortalConfig(channel.config.portals, invoice.customer)
      
      if (!portalConfig) {
        throw new Error('No suitable web portal found for this customer')
      }

      // Mock web portal upload
      const uploadId = `PORTAL_${Date.now()}`
      
      return {
        success: true,
        channelId: channel.id,
        format: fileData.filename.includes('xrechnung') ? 'xrechnung' : 'zugferd',
        deliveryId: uploadId,
        metadata: {
          portal: portalConfig.url,
          uploadId,
          filename: fileData.filename,
        },
      }
    } catch (error) {
      return {
        success: false,
        channelId: channel.id,
        format: fileData.filename.includes('xrechnung') ? 'xrechnung' : 'zugferd',
        error: error instanceof Error ? error.message : 'Web portal upload failed',
      }
    }
  }

  private async deliverViaFTP(
    channel: DeliveryChannel,
    fileData: { content: Buffer | string; filename: string; mimeType: string },
    invoice: any
  ): Promise<DeliveryResult> {
    // FTP delivery implementation would go here
    // This is a mock implementation
    
    return {
      success: false,
      channelId: channel.id,
      format: fileData.filename.includes('xrechnung') ? 'xrechnung' : 'zugferd',
      error: 'FTP delivery not implemented',
    }
  }

  private async generateEInvoiceFile(
    invoice: any,
    format: 'xrechnung' | 'zugferd'
  ): Promise<{ content: Buffer | string; filename: string; mimeType: string }> {
    if (format === 'xrechnung') {
      const xmlContent = this.xrechnungService.generateXRechnung({
        invoice,
        buyerReference: invoice.customer.customerNumber,
      })
      
      return {
        content: xmlContent,
        filename: `${invoice.invoiceNumber}_xrechnung.xml`,
        mimeType: 'application/xml',
      }
    } else {
      const pdfBuffer = await this.zugferdService.generateZugferdPDF({
        invoice,
        profile: 'COMFORT',
      })
      
      return {
        content: pdfBuffer,
        filename: `${invoice.invoiceNumber}_zugferd.pdf`,
        mimeType: 'application/pdf',
      }
    }
  }

  // Helper methods
  private async findApplicableRules(invoice: any): Promise<DeliveryRule[]> {
    // Mock rule matching logic
    return Array.from(this.rules.values()).filter(rule => {
      if (!rule.isActive) return false
      
      // Check customer conditions
      if (rule.conditions.customerIds?.length && 
          !rule.conditions.customerIds.includes(invoice.customer.id)) {
        return false
      }
      
      // Check amount conditions
      if (rule.conditions.invoiceAmountMin && invoice.total < rule.conditions.invoiceAmountMin) {
        return false
      }
      
      if (rule.conditions.invoiceAmountMax && invoice.total > rule.conditions.invoiceAmountMax) {
        return false
      }
      
      // Check Leitweg-ID condition
      if (rule.conditions.hasLeitwegId && !invoice.customer.leitwegId) {
        return false
      }
      
      // Check VAT ID condition
      if (rule.conditions.hasVatId && !invoice.customer.vatId) {
        return false
      }
      
      return true
    })
  }

  private async loadInvoiceForDelivery(attemptId: string): Promise<any> {
    // Mock invoice loading
    return {
      id: '123',
      invoiceNumber: 'INV-2024-001',
      total: 1250.00,
      customer: {
        id: '456',
        name: 'Test Customer',
        email: 'customer@example.com',
        leitwegId: '991-12345-67',
        vatId: 'DE123456789',
      },
      tenant: {
        name: 'Test Company',
        email: 'info@testcompany.de',
      },
      items: [],
    }
  }

  private interpolateTemplate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match
    })
  }

  private async renderEmailTemplate(templateName: string, invoice: any): Promise<string> {
    // Mock email template rendering
    return `
      <h2>E-Rechnung ${invoice.invoiceNumber}</h2>
      <p>Sehr geehrte Damen und Herren,</p>
      <p>anbei erhalten Sie die E-Rechnung ${invoice.invoiceNumber} im Anhang.</p>
      <p>Bei Rückfragen stehen wir Ihnen gerne zur Verfügung.</p>
      <p>Mit freundlichen Grüßen<br>${invoice.tenant.name}</p>
    `
  }

  private extractPeppolId(customer: any): string | null {
    // Extract PEPPOL ID from customer data
    return customer.peppolId || null
  }

  private extractLeitwegId(customer: any): string {
    // Extract Leitweg-ID from customer data
    return customer.leitwegId || '991-00000-00'
  }

  private selectAPIEndpoint(endpoints: Record<string, string>, leitwegId: string): string | null {
    // Select appropriate API endpoint based on Leitweg-ID
    if (leitwegId.startsWith('991-')) {
      return endpoints['bund']
    }
    if (leitwegId.startsWith('993-')) {
      return endpoints['bayern']
    }
    return endpoints['bund'] // Default
  }

  private selectPortalConfig(portals: Record<string, any>, customer: any): any | null {
    // Select appropriate portal based on customer
    return portals['bund'] // Default
  }

  private async getAPIToken(authConfig: any): Promise<string> {
    // Mock token retrieval
    return 'mock_api_token_' + Date.now()
  }

  private async scheduleDelivery(attempt: DeliveryAttempt): Promise<void> {
    // Schedule delivery attempt (would use job queue in production)
    setTimeout(() => {
      this.processDeliveryAttempt(attempt.id)
    }, 1000)
  }

  private async updateAttemptStatus(
    attemptId: string,
    status: DeliveryAttempt['status'],
    result?: DeliveryResult
  ): Promise<void> {
    // Update attempt status in database
    console.log(`Delivery attempt ${attemptId} status: ${status}`)
  }

  private async handleDeliveryFailure(
    attemptId: string,
    error: string
  ): Promise<DeliveryResult> {
    // Handle delivery failure and schedule retry if needed
    return {
      success: false,
      channelId: 'unknown',
      format: 'unknown',
      error,
      nextRetry: new Date(Date.now() + 5 * 60 * 1000), // Retry in 5 minutes
    }
  }

  // Public management methods
  async createDeliveryRule(rule: Omit<DeliveryRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<DeliveryRule> {
    const newRule: DeliveryRule = {
      ...rule,
      id: `rule_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    this.rules.set(newRule.id, newRule)
    return newRule
  }

  async getDeliveryRules(tenantId: string): Promise<DeliveryRule[]> {
    return Array.from(this.rules.values()).filter(rule => rule.tenantId === tenantId)
  }

  async getDeliveryChannels(): Promise<DeliveryChannel[]> {
    return Array.from(this.channels.values())
  }

  async updateDeliveryChannel(channelId: string, updates: Partial<DeliveryChannel>): Promise<DeliveryChannel | null> {
    const channel = this.channels.get(channelId)
    if (!channel) return null

    const updated = { ...channel, ...updates }
    this.channels.set(channelId, updated)
    return updated
  }
}