import { FastifyPluginAsync } from 'fastify'
import { FastifyRequest } from 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string
      tenantId: string
      email: string
      role: string
    }
  }
}

export const authMiddleware: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request: FastifyRequest, reply) => {
    try {
      // Skip auth for health check and public routes
      if (request.url === '/health' || request.url.startsWith('/api/v1/auth/')) {
        return
      }

      await request.jwtVerify()
      
      // Verify user exists and is active
      const user = await fastify.prisma.user.findUnique({
        where: { id: request.user.id },
        include: {
          tenant: {
            select: {
              id: true,
              isActive: true,
            },
          },
        },
      })

      if (!user || !user.isActive || !user.tenant?.isActive) {
        return reply.status(401).send({ 
          error: 'Unauthorized',
          message: 'User or tenant is not active',
        })
      }

      // Add user info to request
      request.user = {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role,
      }
    } catch (error) {
      return reply.status(401).send({ 
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      })
    }
  })
}