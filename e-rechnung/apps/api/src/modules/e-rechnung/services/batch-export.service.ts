import { XRechnungService } from './xrechnung.service'
import { ZugferdService } from './zugferd.service'
import { Invoice, Customer, InvoiceItem, Tenant } from '@handwerkos/database'
import JSZip from 'jszip'

interface BatchExportOptions {
  format: 'xrechnung' | 'zugferd' | 'both'
  profile?: 'BASIC' | 'COMFORT' | 'EXTENDED'
  includeMetadata?: boolean
  separateFolders?: boolean
  dateRange?: {
    from: Date
    to: Date
  }
  customerIds?: string[]
  invoiceStatuses?: string[]
}

interface BatchExportResult {
  success: boolean
  totalInvoices: number
  processedInvoices: number
  failedInvoices: number
  zipBuffer?: Buffer
  errors: Array<{
    invoiceId: string
    invoiceNumber: string
    error: string
  }>
  summary: {
    xrechnungCount: number
    zugferdCount: number
    totalSize: number
    processingTime: number
  }
}

export class BatchExportService {
  private xrechnungService: XRechnungService
  private zugferdService: ZugferdService

  constructor() {
    this.xrechnungService = new XRechnungService()
    this.zugferdService = new ZugferdService()
  }

  async exportInvoicesBatch(
    invoices: Array<Invoice & {
      customer: Customer
      items: InvoiceItem[]
      tenant: Tenant
    }>,
    options: BatchExportOptions
  ): Promise<BatchExportResult> {
    const startTime = Date.now()
    const zip = new JSZip()
    const errors: BatchExportResult['errors'] = []
    
    let processedInvoices = 0
    let xrechnungCount = 0
    let zugferdCount = 0
    let totalSize = 0

    // Create folder structure if requested
    if (options.separateFolders) {
      if (options.format === 'xrechnung' || options.format === 'both') {
        zip.folder('xrechnung')
      }
      if (options.format === 'zugferd' || options.format === 'both') {
        zip.folder('zugferd')
      }
      if (options.includeMetadata) {
        zip.folder('metadata')
      }
    }

    // Process each invoice
    for (const invoice of invoices) {
      try {
        // Generate XRechnung
        if (options.format === 'xrechnung' || options.format === 'both') {
          try {
            const xmlContent = this.xrechnungService.generateXRechnung({
              invoice,
              buyerReference: invoice.customer.customerNumber,
            })
            
            const fileName = `${invoice.invoiceNumber}_xrechnung.xml`
            const filePath = options.separateFolders ? `xrechnung/${fileName}` : fileName
            
            zip.file(filePath, xmlContent)
            xrechnungCount++
            totalSize += xmlContent.length
          } catch (error) {
            errors.push({
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              error: `XRechnung generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            })
          }
        }

        // Generate ZUGFeRD
        if (options.format === 'zugferd' || options.format === 'both') {
          try {
            const pdfBuffer = await this.zugferdService.generateZugferdPDF({
              invoice,
              profile: options.profile || 'COMFORT',
            })
            
            const fileName = `${invoice.invoiceNumber}_zugferd.pdf`
            const filePath = options.separateFolders ? `zugferd/${fileName}` : fileName
            
            zip.file(filePath, pdfBuffer)
            zugferdCount++
            totalSize += pdfBuffer.length
          } catch (error) {
            errors.push({
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              error: `ZUGFeRD generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            })
          }
        }

        // Add metadata if requested
        if (options.includeMetadata) {
          const metadata = {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            customerName: invoice.customer.name,
            date: invoice.date.toISOString(),
            total: invoice.total,
            status: invoice.status,
            exportedAt: new Date().toISOString(),
            formats: {
              xrechnung: options.format === 'xrechnung' || options.format === 'both',
              zugferd: options.format === 'zugferd' || options.format === 'both',
            },
          }
          
          const metadataFileName = `${invoice.invoiceNumber}_metadata.json`
          const metadataPath = options.separateFolders 
            ? `metadata/${metadataFileName}` 
            : metadataFileName
          
          zip.file(metadataPath, JSON.stringify(metadata, null, 2))
        }

        processedInvoices++
      } catch (error) {
        errors.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          error: `General processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      }
    }

    // Add batch summary
    const batchSummary = {
      exportDate: new Date().toISOString(),
      totalInvoices: invoices.length,
      processedInvoices,
      failedInvoices: errors.length,
      formats: {
        xrechnungGenerated: xrechnungCount,
        zugferdGenerated: zugferdCount,
      },
      options,
      errors: errors.length > 0 ? errors : undefined,
    }

    zip.file('batch_summary.json', JSON.stringify(batchSummary, null, 2))

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })

    const processingTime = Date.now() - startTime

    return {
      success: errors.length < invoices.length,
      totalInvoices: invoices.length,
      processedInvoices,
      failedInvoices: errors.length,
      zipBuffer,
      errors,
      summary: {
        xrechnungCount,
        zugferdCount,
        totalSize: totalSize + zipBuffer.length,
        processingTime,
      },
    }
  }

  async validateBatchExport(
    invoices: Array<Invoice & {
      customer: Customer
      items: InvoiceItem[]
      tenant: Tenant
    }>,
    options: BatchExportOptions
  ): Promise<{
    canExport: boolean
    issues: Array<{
      invoiceId: string
      invoiceNumber: string
      severity: 'error' | 'warning'
      message: string
    }>
    estimatedSize: number
    estimatedTime: number
  }> {
    const issues: Array<{
      invoiceId: string
      invoiceNumber: string
      severity: 'error' | 'warning'
      message: string
    }> = []
    
    let estimatedSize = 0
    let canExport = true

    for (const invoice of invoices) {
      // Check required fields
      if (!invoice.customer.name) {
        issues.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          severity: 'error',
          message: 'Customer name is required for E-Rechnung',
        })
        canExport = false
      }

      if (!invoice.tenant.vatId && !invoice.tenant.taxNumber) {
        issues.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          severity: 'error',
          message: 'Tenant VAT ID or tax number is required',
        })
        canExport = false
      }

      if (invoice.items.length === 0) {
        issues.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          severity: 'error',
          message: 'Invoice must have at least one item',
        })
        canExport = false
      }

      // Check for warnings
      if (!invoice.customer.email && !invoice.customer.street) {
        issues.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          severity: 'warning',
          message: 'Customer contact information incomplete',
        })
      }

      if (invoice.status === 'DRAFT') {
        issues.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          severity: 'warning',
          message: 'Invoice is still in draft status',
        })
      }

      // Estimate file size
      if (options.format === 'xrechnung' || options.format === 'both') {
        estimatedSize += 50000 // ~50KB per XRechnung XML
      }
      if (options.format === 'zugferd' || options.format === 'both') {
        estimatedSize += 200000 // ~200KB per ZUGFeRD PDF
      }
    }

    // Estimate processing time (2 seconds per invoice)
    const estimatedTime = invoices.length * 2000

    return {
      canExport: canExport && issues.filter(i => i.severity === 'error').length === 0,
      issues,
      estimatedSize,
      estimatedTime,
    }
  }

  async getExportProgress(jobId: string): Promise<{
    jobId: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress: number
    currentInvoice?: string
    processedCount: number
    totalCount: number
    errors: string[]
    estimatedTimeRemaining?: number
  }> {
    // This would integrate with BullMQ to track job progress
    // For now, return a placeholder
    return {
      jobId,
      status: 'pending',
      progress: 0,
      processedCount: 0,
      totalCount: 0,
      errors: [],
    }
  }
}