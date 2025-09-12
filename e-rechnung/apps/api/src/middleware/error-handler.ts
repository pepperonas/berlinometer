import { FastifyPluginAsync } from 'fastify'

export const globalErrorHandler: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler(async (error, request, reply) => {
    // Log the error
    request.log.error({
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      request: {
        method: request.method,
        url: request.url,
        headers: request.headers,
        body: request.body,
      },
    }, 'Unhandled error')

    // Handle specific error types
    if (error.name === 'ValidationError') {
      return reply.status(400).send({
        error: 'Validation Error',
        message: error.message,
      })
    }

    if (error.name === 'UnauthorizedError') {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      })
    }

    if (error.name === 'ForbiddenError') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      })
    }

    // Prisma errors
    if (error.name === 'PrismaClientKnownRequestError') {
      const prismaError = error as any
      
      if (prismaError.code === 'P2002') {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'A record with this data already exists',
        })
      }
      
      if (prismaError.code === 'P2025') {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'The requested record was not found',
        })
      }
    }

    // Rate limiting error
    if (error.statusCode === 429) {
      return reply.status(429).send({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
      })
    }

    // Default server error
    const statusCode = error.statusCode || 500
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : error.message

    return reply.status(statusCode).send({
      error: 'Internal Server Error',
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
      }),
    })
  })
}