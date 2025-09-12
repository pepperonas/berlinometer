import { FastifyPluginAsync } from 'fastify'

export const projectRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all projects
  fastify.get('/', async (request, reply) => {
    // TODO: Implement projects listing
    return { projects: [], total: 0, page: 1, totalPages: 0 }
  })
  
  // Get single project
  fastify.get('/:id', async (request, reply) => {
    // TODO: Implement project detail
    return reply.status(404).send({ error: 'Project not found' })
  })
  
  // Create project
  fastify.post('/', async (request, reply) => {
    // TODO: Implement project creation
    return reply.status(501).send({ error: 'Not implemented yet' })
  })
  
  // Update project
  fastify.patch('/:id', async (request, reply) => {
    // TODO: Implement project update
    return reply.status(501).send({ error: 'Not implemented yet' })
  })
  
  // Delete project
  fastify.delete('/:id', async (request, reply) => {
    // TODO: Implement project deletion
    return reply.status(501).send({ error: 'Not implemented yet' })
  })
}