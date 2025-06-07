import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper function to handle Prisma errors
export function handlePrismaError(error: any) {
  if (error.code === 'P2002') {
    // Unique constraint violation
    const field = error.meta?.target?.[0] || 'field'
    return {
      success: false,
      error: `A record with this ${field} already exists.`,
      code: 'DUPLICATE_ENTRY'
    }
  }
  
  if (error.code === 'P2025') {
    // Record not found
    return {
      success: false,
      error: 'Record not found.',
      code: 'NOT_FOUND'
    }
  }
  
  if (error.code === 'P2003') {
    // Foreign key constraint violation
    return {
      success: false,
      error: 'Invalid reference to related record.',
      code: 'FOREIGN_KEY_VIOLATION'
    }
  }
  
  if (error.code === 'P2014') {
    // Required relation violation
    return {
      success: false,
      error: 'Required relation is missing.',
      code: 'REQUIRED_RELATION_VIOLATION'
    }
  }
  
  // Generic database error
  console.error('Database error:', error)
  return {
    success: false,
    error: 'A database error occurred.',
    code: 'DATABASE_ERROR'
  }
}

// Helper function for safe database operations
export async function safeDbOperation<T>(
  operation: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: string; code: string }> {
  try {
    const data = await operation()
    return { success: true, data }
  } catch (error) {
    return handlePrismaError(error)
  }
}

// Database connection test
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
}