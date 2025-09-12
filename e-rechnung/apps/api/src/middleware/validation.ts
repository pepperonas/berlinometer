import { FastifyPluginAsync } from 'fastify'
import { ZodError } from 'zod'

export const validationMiddleware: FastifyPluginAsync = async (fastify) => {
  // Handle Zod validation errors
  fastify.setErrorHandler(async (error, request, reply) => {
    if (error instanceof ZodError) {
      const issues = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }))
      
      return reply.status(400).send({
        error: 'Validation Error',
        message: 'Invalid input data',
        issues,
      })
    }
    
    // Let other error handlers deal with non-validation errors
    throw error
  })
}