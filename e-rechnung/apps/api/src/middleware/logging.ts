import { FastifyPluginAsync } from 'fastify'

export const loggingMiddleware: FastifyPluginAsync = async (fastify) => {
  // Request logging
  fastify.addHook('onRequest', async (request, reply) => {
    request.log.info({
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    }, 'Incoming request')
  })

  // Response logging
  fastify.addHook('onResponse', async (request, reply) => {
    request.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.getResponseTime(),
    }, 'Request completed')
  })

  // Error logging
  fastify.addHook('onError', async (request, reply, error) => {
    request.log.error({
      method: request.method,
      url: request.url,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
    }, 'Request error')
  })
}