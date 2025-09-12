import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  companyName: z.string().min(1),
})

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Login
  fastify.post('/login', {
    schema: {
      description: 'User login',
      tags: ['Authentication'],
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 },
        },
        required: ['email', 'password'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                role: { type: 'string' },
              },
            },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { email, password } = loginSchema.parse(request.body)
    
    // Find user with tenant
    const user = await fastify.prisma.user.findUnique({
      where: { email },
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
        error: 'Invalid credentials',
      })
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return reply.status(401).send({
        error: 'Invalid credentials',
      })
    }
    
    // Generate tokens
    const accessToken = await reply.jwtSign(
      {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      },
      { expiresIn: '15m' }
    )
    
    const refreshToken = await reply.jwtSign(
      {
        id: user.id,
        type: 'refresh',
      },
      { expiresIn: '7d' }
    )
    
    // Update last login
    await fastify.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })
    
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    }
  })
  
  // Register
  fastify.post('/register', {
    schema: {
      description: 'User registration',
      tags: ['Authentication'],
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          firstName: { type: 'string', minLength: 1 },
          lastName: { type: 'string', minLength: 1 },
          companyName: { type: 'string', minLength: 1 },
        },
        required: ['email', 'password', 'firstName', 'lastName', 'companyName'],
      },
    },
  }, async (request, reply) => {
    const data = registerSchema.parse(request.body)
    
    // Check if user already exists
    const existingUser = await fastify.prisma.user.findUnique({
      where: { email: data.email },
    })
    
    if (existingUser) {
      return reply.status(400).send({
        error: 'User already exists',
      })
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)
    
    // Create tenant and user
    const tenant = await fastify.prisma.tenant.create({
      data: {
        name: data.companyName,
        email: data.email,
        plan: 'STARTER',
        isActive: true,
        users: {
          create: {
            email: data.email,
            password: hashedPassword,
            firstName: data.firstName,
            lastName: data.lastName,
            role: 'ADMIN',
            isActive: true,
          },
        },
      },
      include: {
        users: true,
      },
    })
    
    const user = tenant.users[0]
    
    return {
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    }
  })
  
  // Refresh token
  fastify.post('/refresh', {
    schema: {
      description: 'Refresh access token',
      tags: ['Authentication'],
      body: {
        type: 'object',
        properties: {
          refreshToken: { type: 'string' },
        },
        required: ['refreshToken'],
      },
    },
  }, async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string }
    
    try {
      const payload = await fastify.jwt.verify(refreshToken) as any
      
      if (payload.type !== 'refresh') {
        return reply.status(401).send({ error: 'Invalid token type' })
      }
      
      // Find user
      const user = await fastify.prisma.user.findUnique({
        where: { id: payload.id },
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
        return reply.status(401).send({ error: 'User not found or inactive' })
      }
      
      // Generate new access token
      const accessToken = await reply.jwtSign(
        {
          id: user.id,
          email: user.email,
          tenantId: user.tenantId,
          role: user.role,
        },
        { expiresIn: '15m' }
      )
      
      return { accessToken }
    } catch (error) {
      return reply.status(401).send({ error: 'Invalid refresh token' })
    }
  })
  
  // Logout
  fastify.post('/logout', async (request, reply) => {
    // In a real implementation, you might want to blacklist the token
    return { message: 'Logged out successfully' }
  })
}