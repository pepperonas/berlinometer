import { FastifyPluginAsync } from 'fastify'

export const tenantMiddleware: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    // Skip tenant middleware for health check and auth routes
    if (request.url === '/health' || request.url.startsWith('/api/v1/auth/')) {
      return
    }

    // Tenant context is set by auth middleware through request.user.tenantId
    // This middleware can be used for additional tenant-specific logic
    // such as feature flags, rate limiting per tenant, etc.
    
    // For now, we just ensure the user has a tenantId
    if (!request.user?.tenantId) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'No tenant context available',
      })
    }
    
    // Add tenant-specific logging context
    request.log = request.log.child({
      tenantId: request.user.tenantId,
    })
  })
}