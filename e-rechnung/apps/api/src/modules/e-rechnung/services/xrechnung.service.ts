import { XMLBuilder } from 'fast-xml-parser'
import { Invoice, Customer, InvoiceItem, Tenant } from '@handwerkos/database'
import { format } from 'date-fns'

interface XRechnungData {
  invoice: Invoice & {
    customer: Customer
    items: InvoiceItem[]
    tenant: Tenant
  }
  leitwegId?: string
  buyerReference?: string
}

export class XRechnungService {
  private xmlBuilder: XMLBuilder

  constructor() {
    this.xmlBuilder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
      indentBy: '  ',
      suppressEmptyNode: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    })
  }

  generateXRechnung(data: XRechnungData): string {
    const { invoice, leitwegId, buyerReference } = data
    
    const xmlData = {
      '?xml': {
        '@_version': '1.0',
        '@_encoding': 'UTF-8',
      },
      'ubl:Invoice': {
        '@_xmlns:ubl': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
        '@_xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
        '@_xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
        'cbc:CustomizationID': 'urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung_3.0',
        'cbc:ProfileID': 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0',
        'cbc:ID': invoice.invoiceNumber,
        'cbc:IssueDate': format(invoice.date, 'yyyy-MM-dd'),
        'cbc:DueDate': format(invoice.dueDate, 'yyyy-MM-dd'),
        'cbc:InvoiceTypeCode': '380', // Commercial invoice
        'cbc:Note': invoice.notes || '',
        'cbc:DocumentCurrencyCode': 'EUR',
        'cbc:BuyerReference': buyerReference || invoice.customer.customerNumber,
        
        // Accounting Supplier Party (Seller)
        'cac:AccountingSupplierParty': {
          'cac:Party': {
            'cbc:EndpointID': {
              '@_schemeID': 'EM',
              '#text': invoice.tenant.email,
            },
            'cac:PartyIdentification': {
              'cbc:ID': invoice.tenant.taxNumber || '',
            },
            'cac:PartyName': {
              'cbc:Name': invoice.tenant.name,
            },
            'cac:PostalAddress': {
              'cbc:StreetName': invoice.tenant.street,
              'cbc:CityName': invoice.tenant.city,
              'cbc:PostalZone': invoice.tenant.postalCode,
              'cac:Country': {
                'cbc:IdentificationCode': invoice.tenant.country || 'DE',
              },
            },
            'cac:PartyTaxScheme': {
              'cbc:CompanyID': invoice.tenant.vatId || invoice.tenant.taxNumber || '',
              'cac:TaxScheme': {
                'cbc:ID': 'VAT',
              },
            },
            'cac:PartyLegalEntity': {
              'cbc:RegistrationName': invoice.tenant.name,
              'cbc:CompanyID': invoice.tenant.commercialRegister || '',
            },
            'cac:Contact': {
              'cbc:Name': invoice.tenant.contactPerson || invoice.tenant.name,
              'cbc:Telephone': invoice.tenant.phone || '',
              'cbc:ElectronicMail': invoice.tenant.email,
            },
          },
        },
        
        // Accounting Customer Party (Buyer)
        'cac:AccountingCustomerParty': {
          'cac:Party': {
            'cbc:EndpointID': {
              '@_schemeID': leitwegId ? 'LEITWEG-ID' : 'EM',
              '#text': leitwegId || invoice.customer.email || '',
            },
            'cac:PartyIdentification': {
              'cbc:ID': invoice.customer.customerNumber,
            },
            'cac:PartyName': {
              'cbc:Name': invoice.customer.name,
            },
            'cac:PostalAddress': {
              'cbc:StreetName': invoice.customer.street || '',
              'cbc:CityName': invoice.customer.city || '',
              'cbc:PostalZone': invoice.customer.postalCode || '',
              'cac:Country': {
                'cbc:IdentificationCode': invoice.customer.country || 'DE',
              },
            },
            'cac:PartyTaxScheme': {
              'cbc:CompanyID': invoice.customer.vatId || '',
              'cac:TaxScheme': {
                'cbc:ID': 'VAT',
              },
            },
            'cac:PartyLegalEntity': {
              'cbc:RegistrationName': invoice.customer.name,
            },
            'cac:Contact': {
              'cbc:Name': invoice.customer.contactPerson || invoice.customer.name,
              'cbc:Telephone': invoice.customer.phone || '',
              'cbc:ElectronicMail': invoice.customer.email || '',
            },
          },
        },
        
        // Payment Means
        'cac:PaymentMeans': {
          'cbc:PaymentMeansCode': this.getPaymentMeansCode(invoice.paymentMethod),
          'cbc:PaymentID': invoice.invoiceNumber,
          ...(invoice.tenant.bankAccount && {
            'cac:PayeeFinancialAccount': {
              'cbc:ID': invoice.tenant.iban || '',
              'cbc:Name': invoice.tenant.bankAccountHolder || invoice.tenant.name,
              'cac:FinancialInstitutionBranch': {
                'cbc:ID': invoice.tenant.bic || '',
              },
            },
          }),
        },
        
        // Payment Terms
        'cac:PaymentTerms': {
          'cbc:Note': invoice.paymentTerms || `Zahlbar bis ${format(invoice.dueDate, 'dd.MM.yyyy')}`,
        },
        
        // Tax Total
        'cac:TaxTotal': {
          'cbc:TaxAmount': {
            '@_currencyID': 'EUR',
            '#text': this.calculateTaxAmount(invoice).toFixed(2),
          },
          'cac:TaxSubtotal': this.getTaxSubtotals(invoice),
        },
        
        // Legal Monetary Total
        'cac:LegalMonetaryTotal': {
          'cbc:LineExtensionAmount': {
            '@_currencyID': 'EUR',
            '#text': invoice.subtotal.toFixed(2),
          },
          'cbc:TaxExclusiveAmount': {
            '@_currencyID': 'EUR',
            '#text': invoice.subtotal.toFixed(2),
          },
          'cbc:TaxInclusiveAmount': {
            '@_currencyID': 'EUR',
            '#text': invoice.total.toFixed(2),
          },
          'cbc:PayableAmount': {
            '@_currencyID': 'EUR',
            '#text': invoice.total.toFixed(2),
          },
        },
        
        // Invoice Lines
        'cac:InvoiceLine': invoice.items.map((item, index) => ({
          'cbc:ID': (index + 1).toString(),
          'cbc:InvoicedQuantity': {
            '@_unitCode': item.unit || 'C62', // C62 = piece
            '#text': item.quantity.toString(),
          },
          'cbc:LineExtensionAmount': {
            '@_currencyID': 'EUR',
            '#text': item.total.toFixed(2),
          },
          'cac:Item': {
            'cbc:Description': item.description,
            'cbc:Name': item.description,
            'cac:ClassifiedTaxCategory': {
              'cbc:ID': this.getTaxCategoryCode(item.taxRate),
              'cbc:Percent': item.taxRate.toString(),
              'cac:TaxScheme': {
                'cbc:ID': 'VAT',
              },
            },
          },
          'cac:Price': {
            'cbc:PriceAmount': {
              '@_currencyID': 'EUR',
              '#text': item.price.toFixed(2),
            },
          },
        })),
      },
    }
    
    return this.xmlBuilder.build(xmlData)
  }
  
  private calculateTaxAmount(invoice: Invoice): number {
    return invoice.total - invoice.subtotal
  }
  
  private getTaxSubtotals(invoice: Invoice & { items: InvoiceItem[] }) {
    const taxGroups = new Map<number, { base: number; tax: number }>()
    
    invoice.items.forEach(item => {
      const current = taxGroups.get(item.taxRate) || { base: 0, tax: 0 }
      current.base += item.total
      current.tax += item.total * (item.taxRate / 100)
      taxGroups.set(item.taxRate, current)
    })
    
    return Array.from(taxGroups.entries()).map(([rate, amounts]) => ({
      'cbc:TaxableAmount': {
        '@_currencyID': 'EUR',
        '#text': amounts.base.toFixed(2),
      },
      'cbc:TaxAmount': {
        '@_currencyID': 'EUR',
        '#text': amounts.tax.toFixed(2),
      },
      'cac:TaxCategory': {
        'cbc:ID': this.getTaxCategoryCode(rate),
        'cbc:Percent': rate.toString(),
        'cac:TaxScheme': {
          'cbc:ID': 'VAT',
        },
      },
    }))
  }
  
  private getTaxCategoryCode(taxRate: number): string {
    if (taxRate === 0) return 'Z' // Zero rated
    if (taxRate === 7) return 'S' // Standard rate (reduced)
    if (taxRate === 19) return 'S' // Standard rate
    return 'S' // Default to standard
  }
  
  private getPaymentMeansCode(paymentMethod?: string | null): string {
    const methodMap: Record<string, string> = {
      'bank_transfer': '30', // Credit transfer
      'sepa': '58', // SEPA credit transfer
      'cash': '10', // Cash
      'card': '48', // Bank card
      'paypal': '68', // Online payment service
      'direct_debit': '59', // SEPA direct debit
    }
    
    return methodMap[paymentMethod || ''] || '30' // Default to credit transfer
  }
  
  validateXRechnung(xml: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Basic validation checks
    if (!xml.includes('urn:xoev-de:kosit:standard:xrechnung_3.0')) {
      errors.push('Missing XRechnung 3.0 customization ID')
    }
    
    if (!xml.includes('<cbc:ID>') || !xml.includes('<cbc:IssueDate>')) {
      errors.push('Missing required invoice fields (ID or IssueDate)')
    }
    
    if (!xml.includes('<cac:AccountingSupplierParty>')) {
      errors.push('Missing supplier information')
    }
    
    if (!xml.includes('<cac:AccountingCustomerParty>')) {
      errors.push('Missing customer information')
    }
    
    if (!xml.includes('<cac:InvoiceLine>')) {
      errors.push('Missing invoice lines')
    }
    
    return {
      valid: errors.length === 0,
      errors,
    }
  }
}