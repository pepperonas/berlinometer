import Fastify from 'fastify'
import { PrismaClient } from '@handwerkos/database'
// import { createBullBoard } from '@bull-board/api'
// import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
// import { FastifyAdapter } from '@bull-board/fastify'
// import { Queue } from 'bullmq'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { envSchema } from './utils/env'
import { authRoutes } from './modules/auth/routes'
import { customerRoutes } from './modules/customers/routes'
import { invoiceRoutes } from './modules/invoices/routes'
import { eRechnungRoutes } from './modules/e-rechnung/routes'
import { quoteRoutes } from './modules/quotes/routes'
import { productRoutes } from './modules/products/routes'
import { projectRoutes } from './modules/projects/routes'
import { userRoutes } from './modules/users/routes'
import { tenantRoutes } from './modules/tenants/routes'
import { globalErrorHandler } from './middleware/error-handler'
import { tenantMiddleware } from './middleware/tenant'
import { authMiddleware } from './middleware/auth'
import { loggingMiddleware } from './middleware/logging'
import { validationMiddleware } from './middleware/validation'

// Environment validation
const env = envSchema.parse(process.env)

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
})

// Initialize Queues (mock for now - queues are disabled for simple local startup)
const emailQueue = null
const pdfQueue = null
const invoiceQueue = null

// Initialize Fastify
const fastify = Fastify({
  logger: {
    level: env.LOG_LEVEL || 'info',
    ...(env.NODE_ENV === 'production' && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: false,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
        },
      },
    }),
  },
})

// Declare types for Fastify instance
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
    queues: {
      email: Queue
      pdf: Queue
      invoice: Queue
    }
  }
}

// Register plugins
async function registerPlugins() {
  // Security
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Disable CSP for API
  })

  await fastify.register(cors, {
    origin: env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })

  await fastify.register(rateLimit, {
    max: parseInt(env.RATE_LIMIT_MAX || '1000'),
    timeWindow: env.RATE_LIMIT_WINDOW || '15 minutes',
  })

  // Authentication
  await fastify.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: 'token',
      signed: false,
    },
  })

  await fastify.register(cookie, {
    secret: env.SESSION_SECRET,
  })

  // File uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  })

  // Documentation
  if (env.NODE_ENV === 'development') {
    await fastify.register(swagger, {
      openapi: {
        openapi: '3.0.0',
        info: {
          title: 'HandwerkOS API',
          description: 'E-Rechnung compliant ERP API for small businesses',
          version: '1.0.0',
        },
        servers: [
          {
            url: `http://localhost:${env.API_PORT}`,
            description: 'Development server',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        security: [{ bearerAuth: [] }],
      },
    })

    await fastify.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
    })
  }

  // Bull Board for Queue Management (Development only) - DISABLED
  // if (env.NODE_ENV === 'development' && emailQueue && pdfQueue && invoiceQueue) {
  //   const serverAdapter = new FastifyAdapter()
  //   createBullBoard({
  //     queues: [
  //       new BullMQAdapter(emailQueue),
  //       new BullMQAdapter(pdfQueue),
  //       new BullMQAdapter(invoiceQueue),
  //     ],
  //     serverAdapter,
  //   })
  //   serverAdapter.setBasePath('/admin/queues')
  //   await fastify.register(serverAdapter.registerPlugin(), { prefix: '/admin/queues' })
  // }
}

// Register decorators
fastify.decorate('prisma', prisma)
fastify.decorate('queues', {
  email: emailQueue,
  pdf: pdfQueue,
  invoice: invoiceQueue,
})

// Global middleware
fastify.register(loggingMiddleware)
fastify.register(validationMiddleware)
fastify.register(globalErrorHandler)

// Health check
fastify.get('/health', {
  schema: {
    description: 'Health check endpoint',
    tags: ['System'],
    response: {
      200: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          timestamp: { type: 'string' },
          uptime: { type: 'number' },
          version: { type: 'string' },
          environment: { type: 'string' },
          database: { type: 'string' },
          redis: { type: 'string' },
        },
      },
    },
  },
}, async (request, reply) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    const dbStatus = 'connected'
    
    // Check Redis connection
    const redisStatus = 'connected' // TODO: Implement Redis health check
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: env.NODE_ENV,
      database: dbStatus,
      redis: redisStatus,
    }
  } catch (error) {
    reply.status(503)
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

// API Routes
const apiPrefix = env.API_PREFIX || '/api/v1'

// Public routes (no authentication required)
fastify.register(async function publicRoutes(fastify) {
  await fastify.register(authRoutes, { prefix: `${apiPrefix}/auth` })
}, { prefix: '' })

// Protected routes (authentication required)
fastify.register(async function protectedRoutes(fastify) {
  // Apply authentication middleware to all routes in this context
  await fastify.register(authMiddleware)
  
  // Apply tenant middleware for multi-tenancy
  await fastify.register(tenantMiddleware)
  
  // Register protected routes
  await fastify.register(customerRoutes, { prefix: `${apiPrefix}/customers` })
  await fastify.register(invoiceRoutes, { prefix: `${apiPrefix}/invoices` })
  // await fastify.register(eRechnungRoutes, { prefix: `${apiPrefix}/e-rechnung` })
  await fastify.register(quoteRoutes, { prefix: `${apiPrefix}/quotes` })
  await fastify.register(productRoutes, { prefix: `${apiPrefix}/products` })
  await fastify.register(projectRoutes, { prefix: `${apiPrefix}/projects` })
  await fastify.register(userRoutes, { prefix: `${apiPrefix}/users` })
  await fastify.register(tenantRoutes, { prefix: `${apiPrefix}/tenants` })
}, { prefix: '' })

// Start server
async function start() {
  try {
    await registerPlugins()
    
    const port = parseInt(env.API_PORT || '3001')
    const host = env.API_HOST || '0.0.0.0'
    
    await fastify.listen({ port, host })
    
    console.log(`🚀 HandwerkOS API Server running on http://${host}:${port}`)
    console.log(`📚 API Documentation: http://${host}:${port}/docs`)
    
    if (env.NODE_ENV === 'development') {
      console.log(`🔧 Queue Dashboard: http://${host}:${port}/admin/queues`)
    }
    
  } catch (error) {
    fastify.log.error(error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down HandwerkOS API Server...')
  
  try {
    if (emailQueue) await emailQueue.close()
    if (pdfQueue) await pdfQueue.close()
    if (invoiceQueue) await invoiceQueue.close()
    await prisma.$disconnect()
    await fastify.close()
    
    console.log('✅ Server shutdown complete')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error during shutdown:', error)
    process.exit(1)
  }
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Start the server
start()

export { fastify }