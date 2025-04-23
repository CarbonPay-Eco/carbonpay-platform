import { Request, Response, NextFunction } from 'express';
import EnvManager from "../classes/envManager";
/**
 * Interface for custom errors with HTTP status code
 */
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Creates an error with additional information
 * @param message Error message
 * @param statusCode HTTP status code
 * @returns Custom error
 */
export const createError = (message: string, statusCode = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

/**
 * Centralized error handling middleware
 * Formats the error response consistently
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const isDev = EnvManager.getEnvOrThrow("NODE_ENV") !== 'production';
  
  // Log the error
  console.error('\x1b[31m%s\x1b[0m', `[ERRO] ${err.message}`);
  if (isDev) {
    console.error(err.stack);
  }
  
  // Formatted response
  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal server error' : err.message,
    details: isDev ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
}; 