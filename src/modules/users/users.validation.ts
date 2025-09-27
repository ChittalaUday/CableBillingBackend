import Joi from 'joi';

// User Role Enum for validation
const USER_ROLES = ['ADMIN', 'MANAGER', 'STAFF', 'TECHNICIAN'] as const;

/**
 * User Registration Validation Schema
 */
export const registerUserSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),

  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.alphanum': 'Username must contain only alphanumeric characters',
    'string.min': 'Username must be at least 3 characters long',
    'string.max': 'Username cannot be longer than 30 characters',
    'any.required': 'Username is required',
  }),

  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required',
    }),

  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Password confirmation is required',
  }),

  firstName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot be longer than 50 characters',
      'string.pattern.base': 'First name must contain only letters and spaces',
      'any.required': 'First name is required',
    }),

  lastName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot be longer than 50 characters',
      'string.pattern.base': 'Last name must contain only letters and spaces',
      'any.required': 'Last name is required',
    }),

  phone: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
    }),

  role: Joi.string()
    .valid(...USER_ROLES)
    .default('STAFF')
    .messages({
      'any.only': `Role must be one of: ${USER_ROLES.join(', ')}`,
    }),
});

/**
 * User Login Validation Schema
 */
export const loginUserSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),

  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

/**
 * Update User Validation Schema
 */
export const updateUserSchema = Joi.object({
  email: Joi.string().email().optional().messages({
    'string.email': 'Please provide a valid email address',
  }),

  username: Joi.string().alphanum().min(3).max(30).optional().messages({
    'string.alphanum': 'Username must contain only alphanumeric characters',
    'string.min': 'Username must be at least 3 characters long',
    'string.max': 'Username cannot be longer than 30 characters',
  }),

  firstName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .optional()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot be longer than 50 characters',
      'string.pattern.base': 'First name must contain only letters and spaces',
    }),

  lastName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .optional()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot be longer than 50 characters',
      'string.pattern.base': 'Last name must contain only letters and spaces',
    }),

  phone: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
    }),

  avatar: Joi.string().uri().optional().allow(null, '').messages({
    'string.uri': 'Avatar must be a valid URL',
  }),

  role: Joi.string()
    .valid(...USER_ROLES)
    .optional()
    .messages({
      'any.only': `Role must be one of: ${USER_ROLES.join(', ')}`,
    }),

  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive must be a boolean value',
  }),

  isVerified: Joi.boolean().optional().messages({
    'boolean.base': 'isVerified must be a boolean value',
  }),
});

/**
 * Change Password Validation Schema
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
  }),

  newPassword: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base':
        'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'New password is required',
    }),

  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Password confirmation does not match new password',
    'any.required': 'Password confirmation is required',
  }),
});

/**
 * User Query Parameters Validation Schema
 */
export const getUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),

  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot be more than 100',
  }),

  search: Joi.string().min(1).max(100).optional().messages({
    'string.min': 'Search term must be at least 1 character long',
    'string.max': 'Search term cannot be longer than 100 characters',
  }),

  role: Joi.string()
    .valid(...USER_ROLES)
    .optional()
    .messages({
      'any.only': `Role filter must be one of: ${USER_ROLES.join(', ')}`,
    }),

  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'isActive filter must be a boolean value',
  }),

  isVerified: Joi.boolean().optional().messages({
    'boolean.base': 'isVerified filter must be a boolean value',
  }),

  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'firstName', 'lastName', 'email', 'username')
    .default('createdAt')
    .messages({
      'any.only':
        'sortBy must be one of: createdAt, updatedAt, firstName, lastName, email, username',
    }),

  sortOrder: Joi.string().valid('asc', 'desc').default('desc').messages({
    'any.only': 'sortOrder must be either asc or desc',
  }),
});

/**
 * User ID Parameter Validation Schema
 */
export const userIdParamSchema = Joi.object({
  id: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required()
    .messages({
      'string.guid': 'User ID must be a valid UUID',
      'any.required': 'User ID is required',
    }),
});
