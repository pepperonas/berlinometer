import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const createInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  invoiceNumber: z.string(),
  date: z.string().datetime(),
  dueDate: z.string().datetime(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    price: z.number(),
    taxRate: z.number(),
    unit: z.string().optional(),
  })),
  paymentTerms: z.string().optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
})

const updateInvoiceSchema = createInvoiceSchema.partial()

export const invoiceRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all invoices
  fastify.get('/', {
    schema: {
      description: 'Get all invoices for the tenant',
      tags: ['Invoices'],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] },
          customerId: { type: 'string', format: 'uuid' },
          from: { type: 'string', format: 'date' },
          to: { type: 'string', format: 'date' },
          search: { type: 'string' },
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            invoices: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  invoiceNumber: { type: 'string' },
                  date: { type: 'string' },
                  dueDate: { type: 'string' },
                  total: { type: 'number' },
                  status: { type: 'string' },
                  customer: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                    },
                  },
                },
              },
            },
            total: { type: 'number' },
            page: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { status, customerId, from, to, search, page = 1, limit = 20 } = request.query as any
    
    const where: any = {
      tenantId: request.user.tenantId,
    }
    
    if (status) where.status = status
    if (customerId) where.customerId = customerId
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = new Date(from)
      if (to) where.date.lte = new Date(to)
    }
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }
    
    const [invoices, total] = await Promise.all([
      fastify.prisma.invoice.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          date: 'desc',
        },
      }),
      fastify.prisma.invoice.count({ where }),
    ])
    
    return {
      invoices,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  })
  
  // Get single invoice
  fastify.get('/:id', {
    schema: {
      description: 'Get invoice by ID',
      tags: ['Invoices'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
        required: ['id'],
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    
    const invoice = await fastify.prisma.invoice.findUnique({
      where: {
        id,
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
    
    return invoice
  })
  
  // Create invoice
  fastify.post('/', {
    schema: {
      description: 'Create a new invoice',
      tags: ['Invoices'],
      body: {
        type: 'object',
        properties: {
          customerId: { type: 'string', format: 'uuid' },
          invoiceNumber: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          dueDate: { type: 'string', format: 'date-time' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                quantity: { type: 'number' },
                price: { type: 'number' },
                taxRate: { type: 'number' },
                unit: { type: 'string' },
              },
              required: ['description', 'quantity', 'price', 'taxRate'],
            },
          },
          paymentTerms: { type: 'string' },
          paymentMethod: { type: 'string' },
          notes: { type: 'string' },
          status: { type: 'string', enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] },
        },
        required: ['customerId', 'invoiceNumber', 'date', 'dueDate', 'items'],
      },
    },
  }, async (request, reply) => {
    const data = createInvoiceSchema.parse(request.body)
    
    // Verify customer belongs to tenant
    const customer = await fastify.prisma.customer.findFirst({
      where: {
        id: data.customerId,
        tenantId: request.user.tenantId,
      },
    })
    
    if (!customer) {
      return reply.status(404).send({
        error: 'Customer not found',
      })
    }
    
    // Calculate totals
    let subtotal = 0
    let total = 0
    
    const itemsWithTotals = data.items.map(item => {
      const itemTotal = item.quantity * item.price
      const itemTax = itemTotal * (item.taxRate / 100)
      subtotal += itemTotal
      total += itemTotal + itemTax
      
      return {
        ...item,
        total: itemTotal,
      }
    })
    
    const invoice = await fastify.prisma.invoice.create({
      data: {
        tenantId: request.user.tenantId,
        customerId: data.customerId,
        invoiceNumber: data.invoiceNumber,
        date: new Date(data.date),
        dueDate: new Date(data.dueDate),
        subtotal,
        total,
        paymentTerms: data.paymentTerms,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        status: data.status || 'DRAFT',
        items: {
          create: itemsWithTotals,
        },
      },
      include: {
        customer: true,
        items: true,
      },
    })
    
    // Add to processing queue if needed
    if (invoice.status === 'SENT') {
      await fastify.queues.invoice.add('process-invoice', {
        invoiceId: invoice.id,
        action: 'send',
      })
    }
    
    return invoice
  })
  
  // Update invoice
  fastify.patch('/:id', {
    schema: {
      description: 'Update an invoice',
      tags: ['Invoices'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
        required: ['id'],
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = updateInvoiceSchema.parse(request.body)
    
    // Check if invoice exists and belongs to tenant
    const existing = await fastify.prisma.invoice.findUnique({
      where: {
        id,
        tenantId: request.user.tenantId,
      },
    })
    
    if (!existing) {
      return reply.status(404).send({
        error: 'Invoice not found',
      })
    }
    
    // If items are being updated, recalculate totals
    let updateData: any = { ...data }
    
    if (data.items) {
      let subtotal = 0
      let total = 0
      
      const itemsWithTotals = data.items.map(item => {
        const itemTotal = item.quantity * item.price
        const itemTax = itemTotal * (item.taxRate / 100)
        subtotal += itemTotal
        total += itemTotal + itemTax
        
        return {
          ...item,
          total: itemTotal,
        }
      })
      
      updateData.subtotal = subtotal
      updateData.total = total
      
      // Delete existing items and create new ones
      await fastify.prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      })
      
      updateData.items = {
        create: itemsWithTotals,
      }
    }
    
    const invoice = await fastify.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        items: true,
      },
    })
    
    return invoice
  })
  
  // Delete invoice
  fastify.delete('/:id', {
    schema: {
      description: 'Delete an invoice',
      tags: ['Invoices'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
        required: ['id'],
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    
    // Check if invoice exists and belongs to tenant
    const existing = await fastify.prisma.invoice.findUnique({
      where: {
        id,
        tenantId: request.user.tenantId,
      },
    })
    
    if (!existing) {
      return reply.status(404).send({
        error: 'Invoice not found',
      })
    }
    
    // Don't allow deletion of paid invoices
    if (existing.status === 'PAID') {
      return reply.status(400).send({
        error: 'Cannot delete paid invoices',
      })
    }
    
    await fastify.prisma.invoice.delete({
      where: { id },
    })
    
    return { success: true }
  })
  
  // Send invoice via email
  fastify.post('/:id/send', {
    schema: {
      description: 'Send invoice via email',
      tags: ['Invoices'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          to: { type: 'string', format: 'email' },
          cc: { type: 'array', items: { type: 'string', format: 'email' } },
          subject: { type: 'string' },
          message: { type: 'string' },
        },
        required: ['to'],
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { to, cc, subject, message } = request.body as any
    
    const invoice = await fastify.prisma.invoice.findUnique({
      where: {
        id,
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
    
    // Add to email queue
    await fastify.queues.email.add('send-invoice', {
      invoiceId: invoice.id,
      to,
      cc,
      subject: subject || `Rechnung ${invoice.invoiceNumber}`,
      message: message || `Anbei erhalten Sie die Rechnung ${invoice.invoiceNumber}.`,
    })
    
    // Update invoice status
    await fastify.prisma.invoice.update({
      where: { id },
      data: { 
        status: 'SENT',
        sentAt: new Date(),
      },
    })
    
    return { success: true, message: 'Invoice queued for sending' }
  })
}