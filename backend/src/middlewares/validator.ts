import { Request, Response, NextFunction } from 'express';
import { createError } from '../utils/erroHandler';

/**
 * Interface for validation rules
 */
interface ValidationRules {
  [key: string]: {
    required?: boolean;
    type?: string;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean;
    message?: string;
  };
}

/**
 * Data validation middleware
 * @param rules Validation rules for the fields
 * @returns Validation middleware
 */
export const validate = (rules: ValidationRules) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];
    
    // Check each field according to the rules
    Object.entries(rules).forEach(([field, rule]) => {
      const value = req.body[field];
      
      // Check if the field is required
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(rule.message || `The field '${field}' is required`);
        return;
      }
      
      // If the value does not exist and is not required, skip validations
      if (value === undefined || value === null || value === '') {
        return;
      }
      
      // Check the type
      if (rule.type && typeof value !== rule.type) {
        errors.push(rule.message || `The field '${field}' must be of type ${rule.type}`);
      }
      
      // Check minimum length
      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        errors.push(rule.message || `The field '${field}' must have at least ${rule.minLength} characters`);
      }
      
      // Check maximum length
      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        errors.push(rule.message || `The field '${field}' must have at most ${rule.maxLength} characters`);
      }
      
      // Check pattern (regex)
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push(rule.message || `The field '${field}' has an invalid format`);
      }
      
      // Custom validation
      if (rule.custom && !rule.custom(value)) {
        errors.push(rule.message || `The field '${field}' is invalid`);
      }
    });
    
    // If there are errors, return 400 Bad Request
    if (errors.length > 0) {
      next(createError(errors.join('. '), 400));
      return;
    }
    
    next();
  };
};

/**
 * Common predefined validations
 */
export const commonValidations = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Invalid email'
  },
  

}; 
