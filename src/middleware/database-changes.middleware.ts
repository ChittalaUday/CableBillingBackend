import { Prisma } from '@prisma/client';
import { Logger } from '@/utils/logger.util';

// Map Prisma action to operation type
const actionToOperation = (action: string): string => {
  switch (action) {
    case 'create':
      return 'CREATE';
    case 'update':
      return 'UPDATE';
    case 'delete':
      return 'DELETE';
    case 'findUnique':
    case 'findFirst':
    case 'findMany':
      return 'READ';
    default:
      return action.toUpperCase();
  }
};

// Map Prisma model to table name
const modelToTable = (model: string): string => {
  // Convert camelCase to snake_case for table names
  return model
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .substring(1);
};

// Prisma middleware to log database changes
export const databaseChangesMiddleware = async (
  params: Prisma.MiddlewareParams,
  next: (params: Prisma.MiddlewareParams) => Promise<any>
) => {
  const { action, model, args } = params;

  // Skip logging for read operations to reduce noise
  if (!['create', 'update', 'delete'].includes(action)) {
    return next(params);
  }

  // Get the start time for performance tracking
  const startTime = Date.now();

  try {
    // Execute the database operation
    const result = await next(params);

    // Calculate execution time
    const executionTime = Date.now() - startTime;

    // Log the database change to Firebase if enabled
    // Note: Skipping Firebase logging in middleware to avoid circular dependencies

    // Also log to local logger
    Logger.dbOperation(action, model, {
      executionTime: `${executionTime}ms`,
    });

    return result;
  } catch (error) {
    // Log database errors
    Logger.dbError(action, error, { model });

    // Re-throw the error
    throw error;
  }
};
