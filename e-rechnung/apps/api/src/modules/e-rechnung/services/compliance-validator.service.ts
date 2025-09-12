import { Invoice, Customer, InvoiceItem, Tenant } from '@handwerkos/database'
import { XMLParser } from 'fast-xml-parser'

interface ValidationRule {
  id: string
  name: string
  description: string
  type: 'error' | 'warning' | 'info'
  category: 'structure' | 'content' | 'tax' | 'format' | 'business'
  standard: 'xrechnung' | 'zugferd' | 'both'
  validator: (data: any) => ValidationResult
}

interface ValidationResult {
  valid: boolean
  message: string
  details?: string
  suggestedFix?: string
  location?: string
}

interface ComplianceReport {
  overall: {
    valid: boolean
    score: number
    standard: string
    version: string
  }
  summary: {
    errors: number
    warnings: number
    infos: number
    totalRules: number
  }
  issues: Array<{
    ruleId: string
    ruleName: string
    type: 'error' | 'warning' | 'info'
    category: string
    message: string
    details?: string
    location?: string
    suggestedFix?: string
  }>
  recommendations: string[]
  certification: {
    xrechnungCompliant: boolean
    zugferdCompliant: boolean
    peppolReady: boolean
  }
}

export class ComplianceValidatorService {
  private rules: Map<string, ValidationRule> = new Map()
  private xmlParser: XMLParser

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseTagValue: false,
      parseAttributeValue: false,
    })
    
    this.loadValidationRules()
  }

  private loadValidationRules(): void {
    // XRechnung Structure Rules
    this.addRule({
      id: 'XR-01',
      name: 'CustomizationID Required',
      description: 'Invoice must contain XRechnung CustomizationID',
      type: 'error',
      category: 'structure',
      standard: 'xrechnung',
      validator: (xml: string) => {
        const required = 'urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung_3.0'
        if (!xml.includes(required)) {
          return {
            valid: false,
            message: 'Missing or incorrect XRechnung 3.0 CustomizationID',
            details: `Expected: ${required}`,
            suggestedFix: `Add <cbc:CustomizationID>${required}</cbc:CustomizationID>`,
            location: 'Invoice/CustomizationID',
          }
        }
        return { valid: true, message: 'CustomizationID is valid' }
      },
    })

    this.addRule({
      id: 'XR-02',
      name: 'ProfileID Required',
      description: 'Invoice must contain valid ProfileID',
      type: 'error',
      category: 'structure',
      standard: 'xrechnung',
      validator: (xml: string) => {
        const required = 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0'
        if (!xml.includes(required)) {
          return {
            valid: false,
            message: 'Missing or incorrect ProfileID',
            details: `Expected: ${required}`,
            suggestedFix: `Add <cbc:ProfileID>${required}</cbc:ProfileID>`,
            location: 'Invoice/ProfileID',
          }
        }
        return { valid: true, message: 'ProfileID is valid' }
      },
    })

    // Content Validation Rules
    this.addRule({
      id: 'XR-10',
      name: 'Invoice Number Required',
      description: 'Invoice must have a unique invoice number',
      type: 'error',
      category: 'content',
      standard: 'both',
      validator: (data: any) => {
        const invoice = data.invoice || data
        if (!invoice.invoiceNumber || invoice.invoiceNumber.trim() === '') {
          return {
            valid: false,
            message: 'Invoice number is required',
            suggestedFix: 'Assign a unique invoice number',
            location: 'Invoice/ID',
          }
        }
        if (invoice.invoiceNumber.length > 30) {
          return {
            valid: false,
            message: 'Invoice number too long (max 30 characters)',
            suggestedFix: 'Shorten the invoice number',
            location: 'Invoice/ID',
          }
        }
        return { valid: true, message: 'Invoice number is valid' }
      },
    })

    this.addRule({
      id: 'XR-11',
      name: 'Invoice Date Required',
      description: 'Invoice must have a valid issue date',
      type: 'error',
      category: 'content',
      standard: 'both',
      validator: (data: any) => {
        const invoice = data.invoice || data
        if (!invoice.date) {
          return {
            valid: false,
            message: 'Invoice date is required',
            suggestedFix: 'Set the invoice date',
            location: 'Invoice/IssueDate',
          }
        }
        
        const invoiceDate = new Date(invoice.date)
        const today = new Date()
        const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
        
        if (invoiceDate > today) {
          return {
            valid: false,
            message: 'Invoice date cannot be in the future',
            suggestedFix: 'Set a valid invoice date',
            location: 'Invoice/IssueDate',
          }
        }
        
        if (invoiceDate < oneYearAgo) {
          return {
            valid: false,
            message: 'Invoice date is more than one year old',
            type: 'warning',
            suggestedFix: 'Verify the invoice date is correct',
            location: 'Invoice/IssueDate',
          }
        }
        
        return { valid: true, message: 'Invoice date is valid' }
      },
    })

    // Supplier Validation Rules
    this.addRule({
      id: 'XR-20',
      name: 'Supplier Name Required',
      description: 'Supplier must have a valid name',
      type: 'error',
      category: 'content',
      standard: 'both',
      validator: (data: any) => {
        const tenant = data.invoice?.tenant || data.tenant
        if (!tenant?.name || tenant.name.trim() === '') {
          return {
            valid: false,
            message: 'Supplier name is required',
            suggestedFix: 'Set the company name in tenant settings',
            location: 'AccountingSupplierParty/PartyName',
          }
        }
        return { valid: true, message: 'Supplier name is valid' }
      },
    })

    this.addRule({
      id: 'XR-21',
      name: 'Supplier Tax ID Required',
      description: 'Supplier must have VAT ID or tax number',
      type: 'error',
      category: 'tax',
      standard: 'both',
      validator: (data: any) => {
        const tenant = data.invoice?.tenant || data.tenant
        if (!tenant?.vatId && !tenant?.taxNumber) {
          return {
            valid: false,
            message: 'Supplier must have VAT ID or tax number',
            suggestedFix: 'Add VAT ID or tax number in tenant settings',
            location: 'AccountingSupplierParty/PartyTaxScheme',
          }
        }
        
        // Validate German VAT ID format
        if (tenant?.vatId) {
          const vatIdRegex = /^DE\d{9}$/
          if (!vatIdRegex.test(tenant.vatId)) {
            return {
              valid: false,
              message: 'Invalid German VAT ID format',
              details: 'German VAT ID must be in format DE123456789',
              suggestedFix: 'Correct the VAT ID format (DE + 9 digits)',
              location: 'AccountingSupplierParty/PartyTaxScheme/CompanyID',
            }
          }
        }
        
        return { valid: true, message: 'Supplier tax information is valid' }
      },
    })

    // Customer Validation Rules
    this.addRule({
      id: 'XR-30',
      name: 'Customer Name Required',
      description: 'Customer must have a valid name',
      type: 'error',
      category: 'content',
      standard: 'both',
      validator: (data: any) => {
        const customer = data.invoice?.customer || data.customer
        if (!customer?.name || customer.name.trim() === '') {
          return {
            valid: false,
            message: 'Customer name is required',
            suggestedFix: 'Set the customer name',
            location: 'AccountingCustomerParty/PartyName',
          }
        }
        return { valid: true, message: 'Customer name is valid' }
      },
    })

    // Line Items Validation
    this.addRule({
      id: 'XR-40',
      name: 'Invoice Lines Required',
      description: 'Invoice must contain at least one line item',
      type: 'error',
      category: 'content',
      standard: 'both',
      validator: (data: any) => {
        const items = data.invoice?.items || data.items || []
        if (!items || items.length === 0) {
          return {
            valid: false,
            message: 'Invoice must contain at least one line item',
            suggestedFix: 'Add invoice line items',
            location: 'InvoiceLine',
          }
        }
        return { valid: true, message: 'Invoice lines are present' }
      },
    })

    this.addRule({
      id: 'XR-41',
      name: 'Line Item Description Required',
      description: 'Each line item must have a description',
      type: 'error',
      category: 'content',
      standard: 'both',
      validator: (data: any) => {
        const items = data.invoice?.items || data.items || []
        for (let i = 0; i < items.length; i++) {
          if (!items[i].description || items[i].description.trim() === '') {
            return {
              valid: false,
              message: `Line item ${i + 1} missing description`,
              suggestedFix: 'Add description to all line items',
              location: `InvoiceLine[${i + 1}]/Item/Description`,
            }
          }
        }
        return { valid: true, message: 'All line items have descriptions' }
      },
    })

    // Tax Validation Rules
    this.addRule({
      id: 'XR-50',
      name: 'Valid Tax Rates',
      description: 'Tax rates must be valid German VAT rates',
      type: 'warning',
      category: 'tax',
      standard: 'both',
      validator: (data: any) => {
        const validRates = [0, 7, 19]
        const items = data.invoice?.items || data.items || []
        
        for (let i = 0; i < items.length; i++) {
          if (!validRates.includes(items[i].taxRate)) {
            return {
              valid: false,
              message: `Line item ${i + 1} has invalid tax rate: ${items[i].taxRate}%`,
              details: 'Valid German VAT rates: 0%, 7%, 19%',
              suggestedFix: 'Use valid German VAT rates',
              location: `InvoiceLine[${i + 1}]/Item/ClassifiedTaxCategory/Percent`,
            }
          }
        }
        return { valid: true, message: 'All tax rates are valid' }
      },
    })

    // Calculation Validation
    this.addRule({
      id: 'XR-60',
      name: 'Correct Total Calculation',
      description: 'Invoice total must match sum of line items plus tax',
      type: 'error',
      category: 'content',
      standard: 'both',
      validator: (data: any) => {
        const invoice = data.invoice || data
        const items = invoice.items || []
        
        let calculatedSubtotal = 0
        let calculatedTax = 0
        
        items.forEach((item: any) => {
          const itemTotal = item.quantity * item.price
          calculatedSubtotal += itemTotal
          calculatedTax += itemTotal * (item.taxRate / 100)
        })
        
        const calculatedTotal = calculatedSubtotal + calculatedTax
        
        // Allow for small rounding differences
        const tolerance = 0.01
        
        if (Math.abs(invoice.subtotal - calculatedSubtotal) > tolerance) {
          return {
            valid: false,
            message: 'Subtotal calculation error',
            details: `Expected: ${calculatedSubtotal.toFixed(2)}, Got: ${invoice.subtotal.toFixed(2)}`,
            suggestedFix: 'Recalculate invoice subtotal',
            location: 'LegalMonetaryTotal/LineExtensionAmount',
          }
        }
        
        if (Math.abs(invoice.total - calculatedTotal) > tolerance) {
          return {
            valid: false,
            message: 'Total calculation error',
            details: `Expected: ${calculatedTotal.toFixed(2)}, Got: ${invoice.total.toFixed(2)}`,
            suggestedFix: 'Recalculate invoice total',
            location: 'LegalMonetaryTotal/TaxInclusiveAmount',
          }
        }
        
        return { valid: true, message: 'Invoice calculations are correct' }
      },
    })

    // Format Validation Rules
    this.addRule({
      id: 'XR-70',
      name: 'Valid Currency Code',
      description: 'Currency code must be valid ISO 4217',
      type: 'error',
      category: 'format',
      standard: 'both',
      validator: (data: any) => {
        // For German E-Rechnung, EUR is typically required
        const invoice = data.invoice || data
        const currency = invoice.currency || 'EUR'
        
        if (currency !== 'EUR') {
          return {
            valid: false,
            message: `Invalid currency code: ${currency}`,
            details: 'German E-Rechnung typically requires EUR',
            suggestedFix: 'Use EUR as currency',
            location: 'DocumentCurrencyCode',
          }
        }
        return { valid: true, message: 'Currency code is valid' }
      },
    })

    // Business Rules
    this.addRule({
      id: 'BR-01',
      name: 'Due Date After Invoice Date',
      description: 'Due date should be after invoice date',
      type: 'warning',
      category: 'business',
      standard: 'both',
      validator: (data: any) => {
        const invoice = data.invoice || data
        if (!invoice.date || !invoice.dueDate) return { valid: true, message: 'Dates not set' }
        
        const invoiceDate = new Date(invoice.date)
        const dueDate = new Date(invoice.dueDate)
        
        if (dueDate <= invoiceDate) {
          return {
            valid: false,
            message: 'Due date should be after invoice date',
            suggestedFix: 'Set due date after invoice date',
            location: 'DueDate',
          }
        }
        
        // Warn if due date is more than 90 days in the future
        const ninetyDays = 90 * 24 * 60 * 60 * 1000
        if (dueDate.getTime() - invoiceDate.getTime() > ninetyDays) {
          return {
            valid: false,
            message: 'Due date is more than 90 days after invoice date',
            type: 'warning',
            suggestedFix: 'Consider shorter payment terms',
            location: 'DueDate',
          }
        }
        
        return { valid: true, message: 'Due date is appropriate' }
      },
    })
  }

  private addRule(rule: ValidationRule): void {
    this.rules.set(rule.id, rule)
  }

  async validateInvoice(
    invoice: Invoice & {
      customer: Customer
      items: InvoiceItem[]
      tenant: Tenant
    },
    standard: 'xrechnung' | 'zugferd' | 'both' = 'both'
  ): Promise<ComplianceReport> {
    const issues: ComplianceReport['issues'] = []
    const recommendations: string[] = []
    
    let errors = 0
    let warnings = 0
    let infos = 0

    // Run validation rules
    for (const rule of this.rules.values()) {
      if (rule.standard !== standard && rule.standard !== 'both' && standard !== 'both') {
        continue
      }

      try {
        const result = rule.validator({ invoice })
        
        if (!result.valid) {
          issues.push({
            ruleId: rule.id,
            ruleName: rule.name,
            type: result.type || rule.type,
            category: rule.category,
            message: result.message,
            details: result.details,
            location: result.location,
            suggestedFix: result.suggestedFix,
          })

          switch (result.type || rule.type) {
            case 'error':
              errors++
              break
            case 'warning':
              warnings++
              break
            case 'info':
              infos++
              break
          }
        }
      } catch (error) {
        issues.push({
          ruleId: rule.id,
          ruleName: rule.name,
          type: 'error',
          category: 'system',
          message: `Validation rule failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
        errors++
      }
    }

    // Generate recommendations
    if (errors === 0 && warnings === 0) {
      recommendations.push('✅ Invoice fully compliant - ready for E-Rechnung export')
    } else {
      if (errors > 0) {
        recommendations.push(`⚠️ Fix ${errors} error(s) before exporting`)
      }
      if (warnings > 0) {
        recommendations.push(`💡 Consider addressing ${warnings} warning(s) for better compliance`)
      }
    }

    // Check specific compliance standards
    const xrechnungErrors = issues.filter(i => 
      i.type === 'error' && (i.ruleId.startsWith('XR-') || i.ruleId.startsWith('BR-'))
    ).length
    
    const zugferdErrors = issues.filter(i => 
      i.type === 'error' && i.category !== 'structure'
    ).length

    // Calculate compliance score
    const totalRules = Array.from(this.rules.values()).filter(r => 
      r.standard === standard || r.standard === 'both' || standard === 'both'
    ).length
    
    const passedRules = totalRules - errors - warnings
    const score = Math.max(0, Math.round((passedRules / totalRules) * 100))

    return {
      overall: {
        valid: errors === 0,
        score,
        standard: standard === 'both' ? 'XRechnung/ZUGFeRD' : standard,
        version: standard === 'xrechnung' ? '3.0.1' : '2.3',
      },
      summary: {
        errors,
        warnings,
        infos,
        totalRules,
      },
      issues,
      recommendations,
      certification: {
        xrechnungCompliant: xrechnungErrors === 0,
        zugferdCompliant: zugferdErrors === 0,
        peppolReady: errors === 0 && warnings === 0,
      },
    }
  }

  async validateXML(xmlContent: string): Promise<ComplianceReport> {
    try {
      // Parse XML
      const parsed = this.xmlParser.parse(xmlContent)
      
      // Extract invoice data from parsed XML
      const ubl = parsed['ubl:Invoice'] || parsed.Invoice
      if (!ubl) {
        return {
          overall: { valid: false, score: 0, standard: 'XRechnung', version: '3.0.1' },
          summary: { errors: 1, warnings: 0, infos: 0, totalRules: 1 },
          issues: [{
            ruleId: 'XML-01',
            ruleName: 'Valid XML Structure',
            type: 'error',
            category: 'structure',
            message: 'Invalid XML structure - missing Invoice element',
            location: 'Root',
          }],
          recommendations: ['Fix XML structure'],
          certification: { xrechnungCompliant: false, zugferdCompliant: false, peppolReady: false },
        }
      }

      // Run XML-specific validations
      const issues: ComplianceReport['issues'] = []
      
      // Check CustomizationID
      const customizationId = ubl['cbc:CustomizationID'] || ubl.CustomizationID
      if (!customizationId || !customizationId.includes('xrechnung_3.0')) {
        issues.push({
          ruleId: 'XR-01',
          ruleName: 'CustomizationID Required',
          type: 'error',
          category: 'structure',
          message: 'Missing or incorrect XRechnung 3.0 CustomizationID',
          location: 'Invoice/CustomizationID',
        })
      }

      // Additional XML validations would go here...

      const errors = issues.filter(i => i.type === 'error').length
      const warnings = issues.filter(i => i.type === 'warning').length
      
      return {
        overall: {
          valid: errors === 0,
          score: errors === 0 ? 100 : Math.max(0, 100 - (errors * 20)),
          standard: 'XRechnung',
          version: '3.0.1',
        },
        summary: {
          errors,
          warnings,
          infos: 0,
          totalRules: issues.length || 1,
        },
        issues,
        recommendations: errors === 0 ? ['XML is valid'] : ['Fix XML structure errors'],
        certification: {
          xrechnungCompliant: errors === 0,
          zugferdCompliant: false, // XML validation doesn't check ZUGFeRD
          peppolReady: errors === 0,
        },
      }
    } catch (error) {
      return {
        overall: { valid: false, score: 0, standard: 'XRechnung', version: '3.0.1' },
        summary: { errors: 1, warnings: 0, infos: 0, totalRules: 1 },
        issues: [{
          ruleId: 'XML-00',
          ruleName: 'XML Parsing',
          type: 'error',
          category: 'format',
          message: `XML parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          location: 'Root',
        }],
        recommendations: ['Fix XML syntax errors'],
        certification: { xrechnungCompliant: false, zugferdCompliant: false, peppolReady: false },
      }
    }
  }

  async getValidationRules(standard?: 'xrechnung' | 'zugferd' | 'both'): Promise<ValidationRule[]> {
    return Array.from(this.rules.values()).filter(rule => 
      !standard || rule.standard === standard || rule.standard === 'both'
    )
  }

  async addCustomRule(rule: Omit<ValidationRule, 'id'>): Promise<string> {
    const id = `CUSTOM-${Date.now()}`
    this.addRule({ ...rule, id })
    return id
  }
}