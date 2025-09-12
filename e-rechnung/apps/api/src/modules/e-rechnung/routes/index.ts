import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { XRechnungService } from '../services/xrechnung.service'
import { ZugferdService } from '../services/zugferd.service'
import { BatchExportService } from '../services/batch-export.service'
import { TemplateService } from '../services/template.service'
import { ComplianceValidatorService } from '../services/compliance-validator.service'
import { AnalyticsService } from '../services/analytics.service'
import { DeliveryService } from '../services/delivery.service'

const exportSchema = z.object({
  invoiceId: z.string().uuid(),
  format: z.enum(['xrechnung', 'zugferd']),
  leitwegId: z.string().optional(),
  buyerReference: z.string().optional(),
  profile: z.enum(['BASIC', 'COMFORT', 'EXTENDED']).optional().default('COMFORT'),
})

const validateSchema = z.object({
  format: z.enum(['xrechnung', 'zugferd']),
  content: z.string(),
})

export const eRechnungRoutes: FastifyPluginAsync = async (fastify) => {
  const xrechnungService = new XRechnungService()
  const zugferdService = new ZugferdService()
  const batchExportService = new BatchExportService()
  // const templateService = new TemplateService()
  const complianceService = new ComplianceValidatorService()
  const analyticsService = new AnalyticsService()
  // const deliveryService = new DeliveryService()
  
  // Export invoice as E-Rechnung
  fastify.post('/export', {
    schema: {
      description: 'Export invoice as E-Rechnung (XRechnung or ZUGFeRD)',
      tags: ['E-Rechnung'],
      body: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string', format: 'uuid' },
          format: { type: 'string', enum: ['xrechnung', 'zugferd'] },
          leitwegId: { type: 'string' },
          buyerReference: { type: 'string' },
          profile: { type: 'string', enum: ['BASIC', 'COMFORT', 'EXTENDED'] },
        },
        required: ['invoiceId', 'format'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            format: { type: 'string' },
            fileName: { type: 'string' },
            content: { type: 'string' },
            contentType: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { invoiceId, format, leitwegId, buyerReference, profile } = exportSchema.parse(request.body)
    
    // Fetch invoice with all relations
    const invoice = await fastify.prisma.invoice.findUnique({
      where: { 
        id: invoiceId,
        tenantId: request.user.tenantId,
      },
      include: {
        customer: true,
        items: true,
        tenant: true,
      },
    })
    
    if (!invoice) {
      return reply.status(404).send({
        error: 'Invoice not found',
      })
    }
    
    try {
      if (format === 'xrechnung') {
        const xmlContent = xrechnungService.generateXRechnung({
          invoice,
          leitwegId,
          buyerReference,
        })
        
        const fileName = `${invoice.invoiceNumber}_xrechnung.xml`
        
        return {
          success: true,
          format: 'xrechnung',
          fileName,
          content: Buffer.from(xmlContent).toString('base64'),
          contentType: 'application/xml',
        }
      } else if (format === 'zugferd') {
        const pdfBuffer = await zugferdService.generateZugferdPDF({
          invoice,
          profile: profile as 'BASIC' | 'COMFORT' | 'EXTENDED',
        })
        
        const fileName = `${invoice.invoiceNumber}_zugferd.pdf`
        
        return {
          success: true,
          format: 'zugferd',
          fileName,
          content: pdfBuffer.toString('base64'),
          contentType: 'application/pdf',
        }
      }
    } catch (error) {
      fastify.log.error('E-Rechnung export error:', error)
      return reply.status(500).send({
        error: 'Failed to generate E-Rechnung',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })
  
  // Validate E-Rechnung content
  fastify.post('/validate', {
    schema: {
      description: 'Validate E-Rechnung content',
      tags: ['E-Rechnung'],
      body: {
        type: 'object',
        properties: {
          format: { type: 'string', enum: ['xrechnung', 'zugferd'] },
          content: { type: 'string', description: 'Base64 encoded content' },
        },
        required: ['format', 'content'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            errors: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { format, content } = validateSchema.parse(request.body)
    
    try {
      const buffer = Buffer.from(content, 'base64')
      
      if (format === 'xrechnung') {
        const xmlContent = buffer.toString('utf-8')
        const validation = xrechnungService.validateXRechnung(xmlContent)
        return validation
      } else if (format === 'zugferd') {
        const validation = zugferdService.validateZugferdPDF(buffer)
        return validation
      }
    } catch (error) {
      fastify.log.error('E-Rechnung validation error:', error)
      return reply.status(400).send({
        valid: false,
        errors: ['Invalid content format'],
      })
    }
  })
  
  // Get E-Rechnung export status for an invoice
  fastify.get('/status/:invoiceId', {
    schema: {
      description: 'Get E-Rechnung export status for an invoice',
      tags: ['E-Rechnung'],
      params: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string', format: 'uuid' },
        },
        required: ['invoiceId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            hasXRechnung: { type: 'boolean' },
            hasZugferd: { type: 'boolean' },
            lastExportDate: { type: 'string', format: 'date-time', nullable: true },
            exportCount: { type: 'number' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { invoiceId } = request.params as { invoiceId: string }
    
    // Check if invoice exists and belongs to tenant
    const invoice = await fastify.prisma.invoice.findUnique({
      where: { 
        id: invoiceId,
        tenantId: request.user.tenantId,
      },
      select: {
        id: true,
        metadata: true,
      },
    })
    
    if (!invoice) {
      return reply.status(404).send({
        error: 'Invoice not found',
      })
    }
    
    // Extract export information from metadata
    const metadata = invoice.metadata as any || {}
    const exports = metadata.exports || {}
    
    return {
      hasXRechnung: !!exports.xrechnung,
      hasZugferd: !!exports.zugferd,
      lastExportDate: exports.lastExportDate || null,
      exportCount: exports.count || 0,
    }
  })
  
  // Download E-Rechnung file
  fastify.get('/download/:invoiceId/:format', {
    schema: {
      description: 'Download E-Rechnung file',
      tags: ['E-Rechnung'],
      params: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string', format: 'uuid' },
          format: { type: 'string', enum: ['xrechnung', 'zugferd'] },
        },
        required: ['invoiceId', 'format'],
      },
    },
  }, async (request, reply) => {
    const { invoiceId, format } = request.params as { invoiceId: string; format: 'xrechnung' | 'zugferd' }
    
    // Fetch invoice with all relations
    const invoice = await fastify.prisma.invoice.findUnique({
      where: { 
        id: invoiceId,
        tenantId: request.user.tenantId,
      },
      include: {
        customer: true,
        items: true,
        tenant: true,
      },
    })
    
    if (!invoice) {
      return reply.status(404).send({
        error: 'Invoice not found',
      })
    }
    
    try {
      if (format === 'xrechnung') {
        const xmlContent = xrechnungService.generateXRechnung({
          invoice,
        })
        
        reply.header('Content-Type', 'application/xml')
        reply.header('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}_xrechnung.xml"`)
        return reply.send(xmlContent)
      } else if (format === 'zugferd') {
        const pdfBuffer = await zugferdService.generateZugferdPDF({
          invoice,
          profile: 'COMFORT',
        })
        
        reply.header('Content-Type', 'application/pdf')
        reply.header('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}_zugferd.pdf"`)
        return reply.send(pdfBuffer)
      }
    } catch (error) {
      fastify.log.error('E-Rechnung download error:', error)
      return reply.status(500).send({
        error: 'Failed to generate E-Rechnung',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // ===== BATCH EXPORT ENDPOINTS =====
  
  // Batch export multiple invoices
  fastify.post('/batch/export', {
    schema: {
      description: 'Export multiple invoices as E-Rechnung batch',
      tags: ['E-Rechnung', 'Batch'],
      body: {
        type: 'object',
        properties: {
          invoiceIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
          format: { type: 'string', enum: ['xrechnung', 'zugferd', 'both'] },
          profile: { type: 'string', enum: ['BASIC', 'COMFORT', 'EXTENDED'] },
          options: {
            type: 'object',
            properties: {
              includeMetadata: { type: 'boolean' },
              separateFolders: { type: 'boolean' },
            },
          },
        },
        required: ['invoiceIds', 'format'],
      },
    },
  }, async (request, reply) => {
    const { invoiceIds, format, profile, options = {} } = request.body as any

    // Load invoices
    const invoices = await fastify.prisma.invoice.findMany({
      where: {
        id: { in: invoiceIds },
        tenantId: request.user.tenantId,
      },
      include: {
        customer: true,
        items: true,
        tenant: true,
      },
    })

    if (invoices.length === 0) {
      return reply.status(404).send({ error: 'No invoices found' })
    }

    try {
      const result = await batchExportService.exportInvoicesBatch(invoices, {
        format,
        profile,
        ...options,
      })

      return {
        success: result.success,
        totalInvoices: result.totalInvoices,
        processedInvoices: result.processedInvoices,
        failedInvoices: result.failedInvoices,
        zipContent: result.zipBuffer?.toString('base64'),
        errors: result.errors,
        summary: result.summary,
      }
    } catch (error) {
      return reply.status(500).send({
        error: 'Batch export failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // Validate batch export before processing
  fastify.post('/batch/validate', {
    schema: {
      description: 'Validate invoices before batch export',
      tags: ['E-Rechnung', 'Batch', 'Validation'],
    },
  }, async (request, reply) => {
    const { invoiceIds, format } = request.body as any

    const invoices = await fastify.prisma.invoice.findMany({
      where: {
        id: { in: invoiceIds },
        tenantId: request.user.tenantId,
      },
      include: {
        customer: true,
        items: true,
        tenant: true,
      },
    })

    const validation = await batchExportService.validateBatchExport(invoices, { format })
    return validation
  })

  // ===== TEMPLATE ENDPOINTS =====

  // Get all templates for tenant
  fastify.get('/templates', {
    schema: {
      description: 'Get all E-Rechnung templates',
      tags: ['E-Rechnung', 'Templates'],
    },
  }, async (request, reply) => {
    const templates = await templateService.getTemplatesByTenant(request.user.tenantId)
    return { templates }
  })

  // Get specific template
  fastify.get('/templates/:id', {
    schema: {
      description: 'Get template by ID',
      tags: ['E-Rechnung', 'Templates'],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const template = await templateService.getTemplate(id)
    
    if (!template) {
      return reply.status(404).send({ error: 'Template not found' })
    }
    
    return template
  })

  // Create custom template
  fastify.post('/templates', {
    schema: {
      description: 'Create custom E-Rechnung template',
      tags: ['E-Rechnung', 'Templates'],
    },
  }, async (request, reply) => {
    const templateData = {
      ...request.body as any,
      tenantId: request.user.tenantId,
    }
    
    const template = await templateService.createCustomTemplate(templateData)
    return template
  })

  // Update template
  fastify.patch('/templates/:id', {
    schema: {
      description: 'Update E-Rechnung template',
      tags: ['E-Rechnung', 'Templates'],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const updates = request.body as any
    
    const template = await templateService.updateTemplate(id, updates)
    
    if (!template) {
      return reply.status(404).send({ error: 'Template not found' })
    }
    
    return template
  })

  // Render template with data
  fastify.post('/templates/:id/render', {
    schema: {
      description: 'Render template with invoice data',
      tags: ['E-Rechnung', 'Templates'],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { invoiceId, customData } = request.body as any

    const invoice = await fastify.prisma.invoice.findUnique({
      where: {
        id: invoiceId,
        tenantId: request.user.tenantId,
      },
      include: {
        customer: true,
        items: true,
        tenant: true,
      },
    })

    if (!invoice) {
      return reply.status(404).send({ error: 'Invoice not found' })
    }

    try {
      const rendered = await templateService.renderTemplate(id, {
        invoice,
        customData,
      })

      return {
        rendered,
        templateId: id,
        invoiceId,
      }
    } catch (error) {
      return reply.status(400).send({
        error: 'Template rendering failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // ===== COMPLIANCE ENDPOINTS =====

  // Validate invoice compliance
  fastify.post('/compliance/validate', {
    schema: {
      description: 'Validate invoice compliance',
      tags: ['E-Rechnung', 'Compliance'],
    },
  }, async (request, reply) => {
    const { invoiceId, standard } = request.body as any

    const invoice = await fastify.prisma.invoice.findUnique({
      where: {
        id: invoiceId,
        tenantId: request.user.tenantId,
      },
      include: {
        customer: true,
        items: true,
        tenant: true,
      },
    })

    if (!invoice) {
      return reply.status(404).send({ error: 'Invoice not found' })
    }

    const report = await complianceService.validateInvoice(invoice, standard)
    return report
  })

  // Validate XML content
  fastify.post('/compliance/validate-xml', {
    schema: {
      description: 'Validate XRechnung XML content',
      tags: ['E-Rechnung', 'Compliance'],
    },
  }, async (request, reply) => {
    const { xmlContent } = request.body as any
    
    try {
      const xmlData = Buffer.from(xmlContent, 'base64').toString('utf-8')
      const report = await complianceService.validateXML(xmlData)
      return report
    } catch (error) {
      return reply.status(400).send({
        error: 'XML validation failed',
        details: error instanceof Error ? error.message : 'Invalid XML data',
      })
    }
  })

  // Get validation rules
  fastify.get('/compliance/rules', {
    schema: {
      description: 'Get compliance validation rules',
      tags: ['E-Rechnung', 'Compliance'],
    },
  }, async (request, reply) => {
    const { standard } = request.query as any
    const rules = await complianceService.getValidationRules(standard)
    return { rules }
  })

  // ===== ANALYTICS ENDPOINTS =====

  // Get E-Rechnung metrics
  fastify.get('/analytics/metrics', {
    schema: {
      description: 'Get E-Rechnung analytics metrics',
      tags: ['E-Rechnung', 'Analytics'],
    },
  }, async (request, reply) => {
    const { from, to, customers, statuses } = request.query as any
    
    const query = {
      tenantId: request.user.tenantId,
      ...(from && to && { dateRange: { from: new Date(from), to: new Date(to) } }),
      ...(customers && { customers: customers.split(',') }),
      ...(statuses && { statuses: statuses.split(',') }),
    }

    const metrics = await analyticsService.getEInvoiceMetrics(query)
    return metrics
  })

  // Get compliance analytics
  fastify.get('/analytics/compliance', {
    schema: {
      description: 'Get compliance analytics',
      tags: ['E-Rechnung', 'Analytics'],
    },
  }, async (request, reply) => {
    const { from, to } = request.query as any
    
    const query = {
      tenantId: request.user.tenantId,
      ...(from && to && { dateRange: { from: new Date(from), to: new Date(to) } }),
    }

    const analytics = await analyticsService.getComplianceAnalytics(query)
    return analytics
  })

  // Get export analytics
  fastify.get('/analytics/exports', {
    schema: {
      description: 'Get export analytics',
      tags: ['E-Rechnung', 'Analytics'],
    },
  }, async (request, reply) => {
    const { from, to } = request.query as any
    
    const query = {
      tenantId: request.user.tenantId,
      ...(from && to && { dateRange: { from: new Date(from), to: new Date(to) } }),
    }

    const analytics = await analyticsService.getExportAnalytics(query)
    return analytics
  })

  // Generate custom report
  fastify.post('/analytics/reports', {
    schema: {
      description: 'Generate custom analytics report',
      tags: ['E-Rechnung', 'Analytics', 'Reports'],
    },
  }, async (request, reply) => {
    const { reportType, dateRange, format, options } = request.body as any
    
    const query = {
      tenantId: request.user.tenantId,
      dateRange,
    }

    try {
      const report = await analyticsService.generateCustomReport(reportType, query, {
        format: format || 'json',
        ...options,
      })

      if (format === 'json') {
        return report
      } else {
        // For non-JSON formats, return download info
        return {
          reportId: report.reportId,
          format: report.format,
          downloadUrl: report.downloadUrl,
          generatedAt: report.generatedAt,
        }
      }
    } catch (error) {
      return reply.status(400).send({
        error: 'Report generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // ===== DELIVERY ENDPOINTS =====

  // Deliver invoice automatically
  fastify.post('/delivery/send', {
    schema: {
      description: 'Send invoice via configured delivery channels',
      tags: ['E-Rechnung', 'Delivery'],
    },
  }, async (request, reply) => {
    const { invoiceId, options } = request.body as any

    const invoice = await fastify.prisma.invoice.findUnique({
      where: {
        id: invoiceId,
        tenantId: request.user.tenantId,
      },
      include: {
        customer: true,
        items: true,
        tenant: true,
      },
    })

    if (!invoice) {
      return reply.status(404).send({ error: 'Invoice not found' })
    }

    try {
      const attempts = await deliveryService.deliverInvoice(invoice, options)
      
      return {
        success: true,
        deliveryAttempts: attempts.length,
        attempts: attempts.map(attempt => ({
          id: attempt.id,
          channelId: attempt.channelId,
          format: attempt.format,
          status: attempt.status,
          scheduledAt: attempt.scheduledAt,
        })),
      }
    } catch (error) {
      return reply.status(400).send({
        error: 'Delivery failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // Get delivery channels
  fastify.get('/delivery/channels', {
    schema: {
      description: 'Get available delivery channels',
      tags: ['E-Rechnung', 'Delivery'],
    },
  }, async (request, reply) => {
    const channels = await deliveryService.getDeliveryChannels()
    return { channels }
  })

  // Get delivery rules
  fastify.get('/delivery/rules', {
    schema: {
      description: 'Get delivery rules for tenant',
      tags: ['E-Rechnung', 'Delivery'],
    },
  }, async (request, reply) => {
    const rules = await deliveryService.getDeliveryRules(request.user.tenantId)
    return { rules }
  })

  // Create delivery rule
  fastify.post('/delivery/rules', {
    schema: {
      description: 'Create new delivery rule',
      tags: ['E-Rechnung', 'Delivery'],
    },
  }, async (request, reply) => {
    const ruleData = {
      ...request.body as any,
      tenantId: request.user.tenantId,
    }

    const rule = await deliveryService.createDeliveryRule(ruleData)
    return rule
  })

  // Update delivery channel configuration
  fastify.patch('/delivery/channels/:id', {
    schema: {
      description: 'Update delivery channel configuration',
      tags: ['E-Rechnung', 'Delivery'],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const updates = request.body as any

    const channel = await deliveryService.updateDeliveryChannel(id, updates)
    
    if (!channel) {
      return reply.status(404).send({ error: 'Delivery channel not found' })
    }

    return channel
  })

  // ===== WORKFLOW ENDPOINTS =====

  // Get E-Rechnung workflow status for invoice
  fastify.get('/workflow/:invoiceId', {
    schema: {
      description: 'Get E-Rechnung workflow status',
      tags: ['E-Rechnung', 'Workflow'],
    },
  }, async (request, reply) => {
    const { invoiceId } = request.params as { invoiceId: string }

    // Mock workflow status
    return {
      invoiceId,
      status: 'completed',
      steps: [
        { name: 'Validation', status: 'completed', completedAt: new Date() },
        { name: 'Generation', status: 'completed', completedAt: new Date() },
        { name: 'Delivery', status: 'completed', completedAt: new Date() },
        { name: 'Confirmation', status: 'pending', scheduledAt: new Date() },
      ],
      currentStep: 'Confirmation',
      progress: 75,
      nextAction: 'Wait for delivery confirmation',
    }
  })

  // Trigger workflow step manually
  fastify.post('/workflow/:invoiceId/trigger', {
    schema: {
      description: 'Manually trigger workflow step',
      tags: ['E-Rechnung', 'Workflow'],
    },
  }, async (request, reply) => {
    const { invoiceId } = request.params as { invoiceId: string }
    const { step, action } = request.body as any

    // Mock workflow trigger
    return {
      success: true,
      message: `Workflow step '${step}' triggered for invoice ${invoiceId}`,
      nextStep: 'Processing',
    }
  })
}