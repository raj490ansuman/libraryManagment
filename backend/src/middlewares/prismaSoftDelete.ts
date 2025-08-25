import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create or reuse the Prisma client
const prisma: PrismaClient = global.prisma || new PrismaClient();

// Create extended Prisma client with soft delete middleware
const prismaWithMiddleware = prisma.$extends({
  query: {
    async $allOperations({ operation, model, args, query }) {
      // Soft delete logic for models
      if (model === 'Suggestion' || model === 'Book') {
        // Handle delete operations
        if (operation === 'delete') {
          // Convert delete to update with deletedAt
          return (prisma as any)[model].update({
            ...args,
            data: { deletedAt: new Date() },
          });
        }
        
        // Handle deleteMany operations
        if (operation === 'deleteMany') {
          // Convert deleteMany to updateMany with deletedAt
          return (prisma as any)[model].updateMany({
            ...args,
            data: { deletedAt: new Date() },
          });
        }
        
        // Filter out deleted records from find operations
        if (['findUnique', 'findFirst', 'findMany'].includes(operation)) {
          if (args?.where) {
            // Only filter if deletedAt is not explicitly set
            if (args.where.deletedAt === undefined) {
              args.where.deletedAt = null;
            }
          } else {
            // If no where clause exists, add one to filter out deleted records
            args = { ...args, where: { deletedAt: null } };
          }
        }
      }
      
      // Execute the query with modified arguments
      return query(args);
    },
  },
});

// For development mode - enable hot reloading
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Export the extended client with soft delete middleware
export default prismaWithMiddleware;
