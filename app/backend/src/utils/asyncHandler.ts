import { Request, Response, NextFunction } from 'express';

/**
 * Type for Express controller functions
 */
type ControllerFn = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/**
 * Wrapper for asynchronous functions in controllers
 * Captures errors and passes them to the next middleware
 * @param fn Asynchronous function of the controller
 * @returns Function with error handling
 */
export const asyncHandler = (fn: ControllerFn) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 