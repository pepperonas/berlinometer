import { Invoice, Customer, InvoiceItem, Tenant } from '@handwerkos/database'
import Handlebars from 'handlebars'

interface EInvoiceTemplate {
  id: string
  name: string
  type: 'xrechnung' | 'zugferd_pdf'
  tenantId: string
  isDefault: boolean
  template: string
  variables: Record<string, any>
  customFields: Array<{
    key: string
    label: string
    type: 'text' | 'number' | 'date' | 'boolean' | 'select'
    required: boolean
    options?: string[]
    defaultValue?: any
  }>
  createdAt: Date
  updatedAt: Date
}

interface TemplateContext {
  invoice: Invoice & {
    customer: Customer
    items: InvoiceItem[]
    tenant: Tenant
  }
  customData?: Record<string, any>
  helpers?: Record<string, any>
}

export class TemplateService {
  private templates: Map<string, EInvoiceTemplate> = new Map()

  constructor() {
    this.registerHandlebarsHelpers()
    this.loadDefaultTemplates()
  }

  private registerHandlebarsHelpers(): void {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (date: Date, format: string) => {
      if (!date) return ''
      
      const options: Intl.DateTimeFormatOptions = {}
      
      switch (format) {
        case 'short':
          options.year = 'numeric'
          options.month = '2-digit'
          options.day = '2-digit'
          break
        case 'long':
          options.year = 'numeric'
          options.month = 'long'
          options.day = 'numeric'
          break
        case 'iso':
          return date.toISOString().split('T')[0]
        default:
          return date.toLocaleDateString('de-DE')
      }
      
      return date.toLocaleDateString('de-DE', options)
    })

    // Currency formatting helper
    Handlebars.registerHelper('formatCurrency', (amount: number, currency = 'EUR') => {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency,
      }).format(amount)
    })

    // Number formatting helper
    Handlebars.registerHelper('formatNumber', (number: number, decimals = 2) => {
      return number.toFixed(decimals).replace('.', ',')
    })

    // Tax rate helper
    Handlebars.registerHelper('getTaxCategory', (taxRate: number) => {
      if (taxRate === 0) return 'Z' // Zero rated
      if (taxRate === 7) return 'S' // Reduced rate
      if (taxRate === 19) return 'S' // Standard rate
      return 'S' // Default
    })

    // Payment terms helper
    Handlebars.registerHelper('getPaymentMeansCode', (paymentMethod: string) => {
      const methodMap: Record<string, string> = {
        'bank_transfer': '30',
        'sepa': '58',
        'cash': '10',
        'card': '48',
        'paypal': '68',
        'direct_debit': '59',
      }
      return methodMap[paymentMethod] || '30'
    })

    // Conditional helper
    Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this)
    })

    // Math helpers
    Handlebars.registerHelper('add', (a: number, b: number) => a + b)
    Handlebars.registerHelper('subtract', (a: number, b: number) => a - b)
    Handlebars.registerHelper('multiply', (a: number, b: number) => a * b)
    Handlebars.registerHelper('divide', (a: number, b: number) => b !== 0 ? a / b : 0)

    // Array helpers
    Handlebars.registerHelper('length', (array: any[]) => array ? array.length : 0)
    Handlebars.registerHelper('first', (array: any[]) => array ? array[0] : null)
    Handlebars.registerHelper('last', (array: any[]) => array ? array[array.length - 1] : null)

    // String helpers
    Handlebars.registerHelper('uppercase', (str: string) => str ? str.toUpperCase() : '')
    Handlebars.registerHelper('lowercase', (str: string) => str ? str.toLowerCase() : '')
    Handlebars.registerHelper('truncate', (str: string, length: number) => {
      if (!str) return ''
      return str.length > length ? str.substring(0, length) + '...' : str
    })
  }

  private loadDefaultTemplates(): void {
    // Default XRechnung template
    const xrechnungTemplate: EInvoiceTemplate = {
      id: 'default-xrechnung',
      name: 'Standard XRechnung Template',
      type: 'xrechnung',
      tenantId: 'default',
      isDefault: true,
      template: this.getDefaultXRechnungTemplate(),
      variables: {},
      customFields: [
        {
          key: 'leitwegId',
          label: 'Leitweg-ID',
          type: 'text',
          required: false,
        },
        {
          key: 'buyerReference',
          label: 'Käufer-Referenz',
          type: 'text',
          required: false,
        },
        {
          key: 'projectReference',
          label: 'Projekt-Referenz',
          type: 'text',
          required: false,
        },
        {
          key: 'contractReference',
          label: 'Vertrag-Referenz',
          type: 'text',
          required: false,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.templates.set('default-xrechnung', xrechnungTemplate)

    // Default ZUGFeRD PDF template
    const zugferdTemplate: EInvoiceTemplate = {
      id: 'default-zugferd',
      name: 'Standard ZUGFeRD PDF Template',
      type: 'zugferd_pdf',
      tenantId: 'default',
      isDefault: true,
      template: this.getDefaultZugferdTemplate(),
      variables: {
        logoUrl: '',
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        fontFamily: 'Helvetica',
      },
      customFields: [
        {
          key: 'showLogo',
          label: 'Logo anzeigen',
          type: 'boolean',
          required: false,
          defaultValue: true,
        },
        {
          key: 'footerText',
          label: 'Fußzeilen-Text',
          type: 'text',
          required: false,
          defaultValue: 'Vielen Dank für Ihr Vertrauen!',
        },
        {
          key: 'watermark',
          label: 'Wasserzeichen',
          type: 'text',
          required: false,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.templates.set('default-zugferd', zugferdTemplate)
  }

  async renderTemplate(
    templateId: string,
    context: TemplateContext
  ): Promise<string> {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`)
    }

    // Merge custom data with template variables
    const mergedContext = {
      ...context,
      ...template.variables,
      customData: {
        ...template.variables,
        ...context.customData,
      },
    }

    // Compile and render template
    const compiledTemplate = Handlebars.compile(template.template)
    return compiledTemplate(mergedContext)
  }

  async validateTemplateData(
    templateId: string,
    data: Record<string, any>
  ): Promise<{
    valid: boolean
    errors: Array<{
      field: string
      message: string
    }>
  }> {
    const template = this.templates.get(templateId)
    if (!template) {
      return {
        valid: false,
        errors: [{ field: 'templateId', message: 'Template not found' }],
      }
    }

    const errors: Array<{ field: string; message: string }> = []

    // Validate custom fields
    for (const field of template.customFields) {
      const value = data[field.key]

      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: field.key,
          message: `${field.label} is required`,
        })
        continue
      }

      if (value !== undefined && value !== null) {
        // Type validation
        switch (field.type) {
          case 'number':
            if (isNaN(Number(value))) {
              errors.push({
                field: field.key,
                message: `${field.label} must be a number`,
              })
            }
            break
          case 'date':
            if (isNaN(Date.parse(value))) {
              errors.push({
                field: field.key,
                message: `${field.label} must be a valid date`,
              })
            }
            break
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push({
                field: field.key,
                message: `${field.label} must be true or false`,
              })
            }
            break
          case 'select':
            if (field.options && !field.options.includes(value)) {
              errors.push({
                field: field.key,
                message: `${field.label} must be one of: ${field.options.join(', ')}`,
              })
            }
            break
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  private getDefaultXRechnungTemplate(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<ubl:Invoice xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
             xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
             xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung_3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>{{invoice.invoiceNumber}}</cbc:ID>
  <cbc:IssueDate>{{formatDate invoice.date 'iso'}}</cbc:IssueDate>
  <cbc:DueDate>{{formatDate invoice.dueDate 'iso'}}</cbc:DueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  {{#if invoice.notes}}<cbc:Note>{{invoice.notes}}</cbc:Note>{{/if}}
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  
  {{#if customData.buyerReference}}
  <cbc:BuyerReference>{{customData.buyerReference}}</cbc:BuyerReference>
  {{else}}
  <cbc:BuyerReference>{{invoice.customer.customerNumber}}</cbc:BuyerReference>
  {{/if}}

  <!-- Supplier Party -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      {{#if customData.leitwegId}}
      <cbc:EndpointID schemeID="LEITWEG-ID">{{customData.leitwegId}}</cbc:EndpointID>
      {{else}}
      <cbc:EndpointID schemeID="EM">{{invoice.tenant.email}}</cbc:EndpointID>
      {{/if}}
      
      <cac:PartyName>
        <cbc:Name>{{invoice.tenant.name}}</cbc:Name>
      </cac:PartyName>
      
      <cac:PostalAddress>
        <cbc:StreetName>{{invoice.tenant.street}}</cbc:StreetName>
        <cbc:CityName>{{invoice.tenant.city}}</cbc:CityName>
        <cbc:PostalZone>{{invoice.tenant.postalCode}}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>{{#if invoice.tenant.country}}{{invoice.tenant.country}}{{else}}DE{{/if}}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      
      <cac:PartyTaxScheme>
        <cbc:CompanyID>{{#if invoice.tenant.vatId}}{{invoice.tenant.vatId}}{{else}}{{invoice.tenant.taxNumber}}{{/if}}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <!-- Customer Party -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cbc:EndpointID schemeID="EM">{{#if invoice.customer.email}}{{invoice.customer.email}}{{else}}noreply@example.com{{/if}}</cbc:EndpointID>
      
      <cac:PartyName>
        <cbc:Name>{{invoice.customer.name}}</cbc:Name>
      </cac:PartyName>
      
      {{#if invoice.customer.street}}
      <cac:PostalAddress>
        <cbc:StreetName>{{invoice.customer.street}}</cbc:StreetName>
        <cbc:CityName>{{invoice.customer.city}}</cbc:CityName>
        <cbc:PostalZone>{{invoice.customer.postalCode}}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>{{#if invoice.customer.country}}{{invoice.customer.country}}{{else}}DE{{/if}}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      {{/if}}
    </cac:Party>
  </cac:AccountingCustomerParty>

  <!-- Payment Means -->
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>{{getPaymentMeansCode invoice.paymentMethod}}</cbc:PaymentMeansCode>
    <cbc:PaymentID>{{invoice.invoiceNumber}}</cbc:PaymentID>
    {{#if invoice.tenant.iban}}
    <cac:PayeeFinancialAccount>
      <cbc:ID>{{invoice.tenant.iban}}</cbc:ID>
      <cbc:Name>{{#if invoice.tenant.bankAccountHolder}}{{invoice.tenant.bankAccountHolder}}{{else}}{{invoice.tenant.name}}{{/if}}</cbc:Name>
    </cac:PayeeFinancialAccount>
    {{/if}}
  </cac:PaymentMeans>

  <!-- Tax Total -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="EUR">{{formatNumber (subtract invoice.total invoice.subtotal)}}</cbc:TaxAmount>
  </cac:TaxTotal>

  <!-- Legal Monetary Total -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">{{formatNumber invoice.subtotal}}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">{{formatNumber invoice.subtotal}}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">{{formatNumber invoice.total}}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">{{formatNumber invoice.total}}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  <!-- Invoice Lines -->
  {{#each invoice.items}}
  <cac:InvoiceLine>
    <cbc:ID>{{add @index 1}}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="{{#if unit}}{{unit}}{{else}}C62{{/if}}">{{quantity}}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">{{formatNumber total}}</cbc:LineExtensionAmount>
    
    <cac:Item>
      <cbc:Description>{{description}}</cbc:Description>
      <cbc:Name>{{description}}</cbc:Name>
      
      <cac:ClassifiedTaxCategory>
        <cbc:ID>{{getTaxCategory taxRate}}</cbc:ID>
        <cbc:Percent>{{taxRate}}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    
    <cac:Price>
      <cbc:PriceAmount currencyID="EUR">{{formatNumber price}}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>
  {{/each}}
</ubl:Invoice>`
  }

  private getDefaultZugferdTemplate(): string {
    return `{
  "layout": {
    "pageSize": "A4",
    "margins": {
      "top": 50,
      "bottom": 50,
      "left": 50,
      "right": 50
    }
  },
  "header": {
    "showLogo": {{customData.showLogo}},
    "logoUrl": "{{customData.logoUrl}}",
    "companyName": "{{invoice.tenant.name}}",
    "companyAddress": {
      "street": "{{invoice.tenant.street}}",
      "city": "{{invoice.tenant.city}}",
      "postalCode": "{{invoice.tenant.postalCode}}",
      "country": "{{invoice.tenant.country}}"
    },
    "contact": {
      "phone": "{{invoice.tenant.phone}}",
      "email": "{{invoice.tenant.email}}",
      "website": "{{invoice.tenant.website}}"
    }
  },
  "invoice": {
    "title": "RECHNUNG",
    "number": "{{invoice.invoiceNumber}}",
    "date": "{{formatDate invoice.date 'short'}}",
    "dueDate": "{{formatDate invoice.dueDate 'short'}}",
    "customerReference": "{{invoice.customer.customerNumber}}"
  },
  "customer": {
    "name": "{{invoice.customer.name}}",
    "address": {
      "street": "{{invoice.customer.street}}",
      "city": "{{invoice.customer.city}}",
      "postalCode": "{{invoice.customer.postalCode}}",
      "country": "{{invoice.customer.country}}"
    }
  },
  "items": [
    {{#each invoice.items}}
    {
      "position": {{add @index 1}},
      "description": "{{description}}",
      "quantity": {{quantity}},
      "unit": "{{#if unit}}{{unit}}{{else}}Stk{{/if}}",
      "price": "{{formatCurrency price}}",
      "total": "{{formatCurrency total}}"
    }{{#unless @last}},{{/unless}}
    {{/each}}
  ],
  "totals": {
    "subtotal": "{{formatCurrency invoice.subtotal}}",
    "tax": "{{formatCurrency (subtract invoice.total invoice.subtotal)}}",
    "total": "{{formatCurrency invoice.total}}"
  },
  "footer": {
    "paymentTerms": "{{invoice.paymentTerms}}",
    "bankDetails": {
      "iban": "{{invoice.tenant.iban}}",
      "bic": "{{invoice.tenant.bic}}",
      "bankName": "{{invoice.tenant.bankName}}"
    },
    "taxInfo": {
      "vatId": "{{invoice.tenant.vatId}}",
      "taxNumber": "{{invoice.tenant.taxNumber}}"
    },
    "customText": "{{customData.footerText}}"
  },
  "styling": {
    "primaryColor": "{{#if variables.primaryColor}}{{variables.primaryColor}}{{else}}#2563eb{{/if}}",
    "secondaryColor": "{{#if variables.secondaryColor}}{{variables.secondaryColor}}{{else}}#64748b{{/if}}",
    "fontFamily": "{{#if variables.fontFamily}}{{variables.fontFamily}}{{else}}Helvetica{{/if}}"
  }
}`
  }

  async createCustomTemplate(
    template: Omit<EInvoiceTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<EInvoiceTemplate> {
    const newTemplate: EInvoiceTemplate = {
      ...template,
      id: `custom-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.templates.set(newTemplate.id, newTemplate)
    return newTemplate
  }

  async getTemplate(templateId: string): Promise<EInvoiceTemplate | null> {
    return this.templates.get(templateId) || null
  }

  async getTemplatesByTenant(tenantId: string): Promise<EInvoiceTemplate[]> {
    return Array.from(this.templates.values()).filter(
      t => t.tenantId === tenantId || t.tenantId === 'default'
    )
  }

  async updateTemplate(
    templateId: string,
    updates: Partial<EInvoiceTemplate>
  ): Promise<EInvoiceTemplate | null> {
    const existing = this.templates.get(templateId)
    if (!existing) return null

    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: new Date(),
    }

    this.templates.set(templateId, updated)
    return updated
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    return this.templates.delete(templateId)
  }
}