// Re-export Prisma client and types
export * from './generated/client'

// You can add custom database utilities here if needed
export const DATABASE_CONFIG = {
  provider: 'sqlite',
  url: process.env.DATABASE_URL || 'file:./dev.db',
}