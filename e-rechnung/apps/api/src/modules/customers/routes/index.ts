import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  vatId: z.string().optional(),
  customerNumber: z.string().optional(),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
})

const updateCustomerSchema = createCustomerSchema.partial()

export const customerRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all customers
  fastify.get('/', {
    schema: {
      description: 'Get all customers for the tenant',
      tags: ['Customers'],
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            customers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string', nullable: true },
                  phone: { type: 'string', nullable: true },
                  city: { type: 'string', nullable: true },
                  customerNumber: { type: 'string', nullable: true },
                  createdAt: { type: 'string' },
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
    const { search, page = 1, limit = 20 } = request.query as any
    
    const where: any = {
      tenantId: request.user.tenantId,
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { customerNumber: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    const [customers, total] = await Promise.all([
      fastify.prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          name: 'asc',
        },
      }),
      fastify.prisma.customer.count({ where }),
    ])
    
    return {
      customers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  })
  
  // Get single customer
  fastify.get('/:id', {
    schema: {
      description: 'Get customer by ID',
      tags: ['Customers'],
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
    
    const customer = await fastify.prisma.customer.findUnique({
      where: {
        id,
        tenantId: request.user.tenantId,
      },
      include: {
        _count: {
          select: {
            invoices: true,
            quotes: true,
          },
        },
      },
    })
    
    if (!customer) {
      return reply.status(404).send({
        error: 'Customer not found',
      })
    }
    
    return customer
  })
  
  // Create customer
  fastify.post('/', {
    schema: {
      description: 'Create a new customer',
      tags: ['Customers'],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          street: { type: 'string' },
          city: { type: 'string' },
          postalCode: { type: 'string' },
          country: { type: 'string' },
          vatId: { type: 'string' },
          customerNumber: { type: 'string' },
          contactPerson: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['name'],
      },
    },
  }, async (request, reply) => {
    const data = createCustomerSchema.parse(request.body)
    
    // Generate customer number if not provided
    let customerNumber = data.customerNumber
    if (!customerNumber) {
      const count = await fastify.prisma.customer.count({
        where: { tenantId: request.user.tenantId },
      })
      customerNumber = `K${(count + 1).toString().padStart(4, '0')}`
    }
    
    const customer = await fastify.prisma.customer.create({
      data: {
        ...data,
        customerNumber,
        tenantId: request.user.tenantId,
      },
    })
    
    return customer
  })
  
  // Update customer
  fastify.patch('/:id', {
    schema: {
      description: 'Update a customer',
      tags: ['Customers'],
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
    const data = updateCustomerSchema.parse(request.body)
    
    // Check if customer exists and belongs to tenant
    const existing = await fastify.prisma.customer.findUnique({
      where: {
        id,
        tenantId: request.user.tenantId,
      },
    })
    
    if (!existing) {
      return reply.status(404).send({
        error: 'Customer not found',
      })
    }
    
    const customer = await fastify.prisma.customer.update({
      where: { id },
      data,
    })
    
    return customer
  })
  
  // Delete customer
  fastify.delete('/:id', {
    schema: {
      description: 'Delete a customer',
      tags: ['Customers'],
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
    
    // Check if customer exists and belongs to tenant
    const existing = await fastify.prisma.customer.findUnique({
      where: {
        id,
        tenantId: request.user.tenantId,
      },
      include: {
        _count: {
          select: {
            invoices: true,
            quotes: true,
          },
        },
      },
    })
    
    if (!existing) {
      return reply.status(404).send({
        error: 'Customer not found',
      })
    }
    
    // Don't allow deletion if customer has invoices or quotes
    if (existing._count.invoices > 0 || existing._count.quotes > 0) {
      return reply.status(400).send({
        error: 'Cannot delete customer with existing invoices or quotes',
      })
    }
    
    await fastify.prisma.customer.delete({
      where: { id },
    })
    
    return { success: true }
  })
  
  // Get customer's invoices
  fastify.get('/:id/invoices', {
    schema: {
      description: 'Get all invoices for a customer',
      tags: ['Customers'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
        required: ['id'],
      },
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] },
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { status, page = 1, limit = 20 } = request.query as any
    
    // Check if customer exists and belongs to tenant
    const customer = await fastify.prisma.customer.findUnique({
      where: {
        id,
        tenantId: request.user.tenantId,
      },
    })
    
    if (!customer) {
      return reply.status(404).send({
        error: 'Customer not found',
      })
    }
    
    const where: any = {
      customerId: id,
      tenantId: request.user.tenantId,
    }
    
    if (status) where.status = status
    
    const [invoices, total] = await Promise.all([
      fastify.prisma.invoice.findMany({
        where,
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
}