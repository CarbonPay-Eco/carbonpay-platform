import { Request, Response, NextFunction } from "express";
import { createError } from "../utils/errorHandler";

/**
 * Interface for validation rules
 */
interface ValidationRules {
  [key: string]: {
    required?: boolean | ((body: any) => boolean);
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
      let isRequired = false;
      if (typeof rule.required === "function") {
        isRequired = rule.required(req.body);
      } else {
        isRequired = !!rule.required;
      }
      if (
        isRequired &&
        (value === undefined || value === null || value === "")
      ) {
        errors.push(rule.message || `The field '${field}' is required`);
        return;
      }

      // If the value does not exist and is not required, skip validations
      if (value === undefined || value === null || value === "") {
        return;
      }

      // Check the type
      if (rule.type && typeof value !== rule.type) {
        errors.push(
          rule.message || `The field '${field}' must be of type ${rule.type}`
        );
      }

      // Check minimum length
      if (
        rule.minLength &&
        typeof value === "string" &&
        value.length < rule.minLength
      ) {
        errors.push(
          rule.message ||
            `The field '${field}' must have at least ${rule.minLength} characters`
        );
      }

      // Check maximum length
      if (
        rule.maxLength &&
        typeof value === "string" &&
        value.length > rule.maxLength
      ) {
        errors.push(
          rule.message ||
            `The field '${field}' must have at most ${rule.maxLength} characters`
        );
      }

      // Check pattern (regex)
      if (
        rule.pattern &&
        typeof value === "string" &&
        !rule.pattern.test(value)
      ) {
        errors.push(
          rule.message || `The field '${field}' has an invalid format`
        );
      }

      // Custom validation
      if (rule.custom && !rule.custom(value)) {
        errors.push(rule.message || `The field '${field}' is invalid`);
      }
    });

    // If there are errors, return 400 Bad Request
    if (errors.length > 0) {
      next(createError(errors.join(". "), 400));
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
    message: "Invalid email",
  },
};

/**
 * Auth validations
 */
export const authValidations = {
  login: validate({
    email: {
      required: true,
      type: "string",
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Valid email is required",
    },
    password: {
      required: true,
      type: "string",
      minLength: 6,
      message: "Password is required and must be at least 6 characters",
    },
  }),

  verifySignature: validate({
    address: {
      required: true,
      type: "string",
      message: "Wallet address is required",
    },
    message: {
      required: true,
      type: "string",
      message: "Signature message is required",
    },
    signature: {
      required: true,
      type: "string",
      message: "Signature is required",
    },
  }),
};

/**
 * User validations
 */
export const userValidations = {
  register: validate({
    email: {
      required: true,
      type: "string",
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Valid email is required",
    },
    password: {
      required: true,
      type: "string",
      minLength: 6,
      message: "Password is required and must be at least 6 characters",
    },
    draft: {
      type: "boolean",
      message: "Draft flag must be boolean",
    },
    // The rest of the fields are only required if draft is false
    fullName: {
      required: (body) => !body.draft,
      type: "string",
      minLength: 2,
      maxLength: 100,
      message: "Full name is required and must be between 2 and 100 characters",
    },
    companyName: {
      required: (body) => !body.draft,
      type: "string",
      minLength: 2,
      maxLength: 100,
      message:
        "Company name is required and must be between 2 and 100 characters",
    },
    country: {
      required: (body) => !body.draft,
      type: "string",
      minLength: 2,
      maxLength: 50,
      message: "Country is required and must be between 2 and 50 characters",
    },
    acceptedTerms: {
      required: (body) => !body.draft,
      type: "boolean",
      custom: (value) => value === true,
      message: "You must accept the terms and conditions",
    },
  }),

  addBalance: validate({
    amount: {
      required: true,
      type: "number",
      custom: (value) => value > 0,
      message: "Amount must be a positive number",
    },
    paymentMethod: {
      type: "string",
      maxLength: 50,
      message: "Payment method must not exceed 50 characters",
    },
  }),

  purchaseCredits: validate({
    projectId: {
      required: true,
      type: "string",
      message: "Project ID is required",
    },
    quantity: {
      required: true,
      type: "number",
      custom: (value) => value > 0,
      message: "Quantity must be a positive number",
    },
  }),
};

/**
 * Organization validations
 */
export const organizationValidations = {
  createOrganization: validate({
    companyName: {
      required: true,
      type: "string",
      minLength: 2,
      maxLength: 100,
      message:
        "Organization name is required and must be between 2 and 100 characters",
    },
    description: {
      type: "string",
      maxLength: 1000,
      message: "Description must not exceed 1000 characters",
    },
  }),

  updateOrganization: validate({
    companyName: {
      type: "string",
      minLength: 2,
      maxLength: 100,
      message: "Organization name must be between 2 and 100 characters",
    },
    description: {
      type: "string",
      maxLength: 1000,
      message: "Description must not exceed 1000 characters",
    },
  }),
};

/**
 * Project validations
 */
export const projectValidations = {
  createProject: validate({
    projectName: {
      required: true,
      type: "string",
      minLength: 3,
      maxLength: 100,
      message:
        "Project name is required and must be between 3 and 100 characters",
    },
    description: {
      required: true,
      type: "string",
      minLength: 10,
      maxLength: 2000,
      message:
        "Project description is required and must be between 10 and 2000 characters",
    },
    location: {
      required: true,
      type: "string",
      minLength: 2,
      maxLength: 100,
      message:
        "Project location is required and must be between 2 and 100 characters",
    },
    vintageYear: {
      required: true,
      type: "number",
      message: "Project vintage (year) is required",
    },
    methodology: {
      required: true,
      type: "string",
      message: "Project methodology is required",
    },
    certificationBody: {
      required: true,
      type: "string",
      message: "Certification body is required",
    },
    totalIssued: {
      required: true,
      type: "number",
      custom: (value) => value > 0,
      message: "Total issued must be a positive number",
    },
    pricePerCredit: {
      required: true,
      type: "number",
      custom: (value) => value > 0,
      message: "Price per credit must be a positive number",
    },
  }),
};

/**
 * Retirement validations
 */
export const retirementValidations = {
  retireCredits: validate({
    projectId: {
      required: true,
      type: "string",
      message: "Project ID is required",
    },
    quantity: {
      required: true,
      type: "number",
      custom: (value) => value > 0,
      message: "Quantity must be a positive number",
    },
    beneficiary: {
      type: "string",
      maxLength: 200,
      message: "Beneficiary must not exceed 200 characters",
    },
    retirementMessage: {
      type: "string",
      maxLength: 1000,
      message: "Retirement message must not exceed 1000 characters",
    },
  }),
};
