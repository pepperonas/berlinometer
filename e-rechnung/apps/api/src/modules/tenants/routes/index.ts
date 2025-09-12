import { FastifyPluginAsync } from 'fastify'

export const tenantRoutes: FastifyPluginAsync = async (fastify) => {
  // Get current tenant info
  fastify.get('/me', async (request, reply) => {
    const tenant = await fastify.prisma.tenant.findUnique({
      where: { id: request.user.tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        street: true,
        city: true,
        postalCode: true,
        country: true,
        vatId: true,
        taxNumber: true,
        commercialRegister: true,
        plan: true,
        isActive: true,
        iban: true,
        bic: true,
        bankName: true,
        bankAccountHolder: true,
        contactPerson: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            customers: true,
            invoices: true,
          },
        },
      },
    })
    
    if (!tenant) {
      return reply.status(404).send({ error: 'Tenant not found' })
    }
    
    return tenant
  })
  
  // Update tenant settings
  fastify.patch('/me', async (request, reply) => {
    // TODO: Implement tenant update with validation
    return reply.status(501).send({ error: 'Not implemented yet' })
  })
  
  // Get tenant statistics
  fastify.get('/stats', async (request, reply) => {
    const tenantId = request.user.tenantId
    
    const [
      customerCount,
      invoiceCount,
      totalRevenue,
      pendingInvoices,
    ] = await Promise.all([
      fastify.prisma.customer.count({
        where: { tenantId },
      }),
      fastify.prisma.invoice.count({
        where: { tenantId },
      }),
      fastify.prisma.invoice.aggregate({
        where: { 
          tenantId,
          status: 'PAID',
        },
        _sum: {
          total: true,
        },
      }),
      fastify.prisma.invoice.count({
        where: { 
          tenantId,
          status: 'SENT',
        },
      }),
    ])
    
    return {
      customers: customerCount,
      invoices: invoiceCount,
      totalRevenue: totalRevenue._sum.total || 0,
      pendingInvoices,
    }
  })
  
  // Get subscription usage
  fastify.get('/usage', async (request, reply) => {
    // TODO: Implement subscription usage tracking
    return reply.status(501).send({ error: 'Not implemented yet' })
  })
}