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

/**
 * Auth validations
 */
export const authValidations = {
  verifySignature: validate({
    address: {
      required: true,
      type: 'string',
      message: 'Wallet address is required'
    },
    message: {
      required: true,
      type: 'string',
      message: 'Signature message is required'
    },
    signature: {
      required: true,
      type: 'string',
      message: 'Signature is required'
    }
  })
};

/**
 * Organization validations
 */
export const organizationValidations = {
  createOrganization: validate({
    name: {
      required: true,
      type: 'string',
      minLength: 2,
      maxLength: 100,
      message: 'Organization name is required and must be between 2 and 100 characters'
    },
    description: {
      type: 'string',
      maxLength: 1000,
      message: 'Description must not exceed 1000 characters'
    },
    logo: {
      type: 'string',
      maxLength: 500,
      message: 'Logo URL must not exceed 500 characters'
    }
  }),
  
  updateOrganization: validate({
    name: {
      type: 'string',
      minLength: 2,
      maxLength: 100,
      message: 'Organization name must be between 2 and 100 characters'
    },
    description: {
      type: 'string',
      maxLength: 1000,
      message: 'Description must not exceed 1000 characters'
    },
    logo: {
      type: 'string',
      maxLength: 500,
      message: 'Logo URL must not exceed 500 characters'
    }
  })
};

/**
 * Project validations
 */
export const projectValidations = {
  createProject: validate({
    name: {
      required: true,
      type: 'string',
      minLength: 3,
      maxLength: 100,
      message: 'Project name is required and must be between 3 and 100 characters'
    },
    description: {
      required: true,
      type: 'string',
      minLength: 10,
      maxLength: 2000,
      message: 'Project description is required and must be between 10 and 2000 characters'
    },
    location: {
      required: true,
      type: 'string',
      minLength: 2,
      maxLength: 100,
      message: 'Project location is required and must be between 2 and 100 characters'
    },
    vintage: {
      required: true,
      type: 'string',
      message: 'Project vintage (year) is required'
    },
    standard: {
      required: true,
      type: 'string',
      message: 'Carbon standard is required (e.g., VCS, Gold Standard)'
    },
    totalSupply: {
      required: true,
      type: 'number',
      custom: (value) => value > 0,
      message: 'Total supply must be a positive number'
    },
    certificationUrl: {
      type: 'string',
      maxLength: 500,
      message: 'Certification URL must not exceed 500 characters'
    },
    imageUrl: {
      type: 'string',
      maxLength: 500,
      message: 'Image URL must not exceed 500 characters'
    }
  })
};

/**
 * Retirement validations
 */
export const retirementValidations = {
  retireCredits: validate({
    projectId: {
      required: true,
      type: 'string',
      message: 'Project ID is required'
    },
    amount: {
      required: true,
      type: 'number',
      custom: (value) => value > 0,
      message: 'Amount must be a positive number'
    },
    beneficiary: {
      type: 'string',
      maxLength: 200,
      message: 'Beneficiary must not exceed 200 characters'
    },
    retirementMessage: {
      type: 'string',
      maxLength: 1000,
      message: 'Retirement message must not exceed 1000 characters'
    }
  })
}; 
