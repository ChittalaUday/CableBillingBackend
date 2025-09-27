import Joi from 'joi';

// Create customer validation schema
export const createCustomerSchema = Joi.object({
  accountNo: Joi.string().required().messages({
    'any.required': 'Account number is required',
    'string.empty': 'Account number cannot be empty',
  }),
  customerNumber: Joi.string().optional(),
  lcoCustomerId: Joi.string().optional().allow(''),
  serialNumber: Joi.string().optional().allow(''),
  vcNumber: Joi.string().optional().allow(''),
  firstName: Joi.string().min(2).max(50).required().messages({
    'any.required': 'First name is required',
    'string.min': 'First name must be at least 2 characters',
    'string.max': 'First name must not exceed 50 characters',
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'any.required': 'Last name is required',
    'string.min': 'Last name must be at least 2 characters',
    'string.max': 'Last name must not exceed 50 characters',
  }),
  email: Joi.string().email().optional().allow(''),
  password: Joi.string().min(6).optional().messages({
    'string.min': 'Password must be at least 6 characters',
  }),
  phone: Joi.string()
    .pattern(/^[+]?[0-9\s\-()]{10,15}$/)
    .required()
    .messages({
      'any.required': 'Phone number is required',
      'string.pattern.base': 'Phone number must be a valid format',
    }),
  address: Joi.string().min(5).max(200).required().messages({
    'any.required': 'Address is required',
    'string.min': 'Address must be at least 5 characters',
    'string.max': 'Address must not exceed 200 characters',
  }),
  city: Joi.string().min(2).max(50).required().messages({
    'any.required': 'City is required',
    'string.min': 'City must be at least 2 characters',
    'string.max': 'City must not exceed 50 characters',
  }),
  state: Joi.string().min(2).max(50).required().messages({
    'any.required': 'State is required',
    'string.min': 'State must be at least 2 characters',
    'string.max': 'State must not exceed 50 characters',
  }),
  zipCode: Joi.string()
    .pattern(/^[0-9]{5,10}$/)
    .required()
    .messages({
      'any.required': 'ZIP code is required',
      'string.pattern.base': 'ZIP code must be 5-10 digits',
    }),
  connectionType: Joi.string()
    .valid('CABLE_TV', 'INTERNET', 'PHONE', 'BUNDLE')
    .required()
    .messages({
      'any.required': 'Connection type is required',
      'any.only': 'Connection type must be one of: CABLE_TV, INTERNET, PHONE, BUNDLE',
    }),
  packageType: Joi.string()
    .valid('BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE')
    .required()
    .messages({
      'any.required': 'Package type is required',
      'any.only': 'Package type must be one of: BASIC, STANDARD, PREMIUM, ENTERPRISE',
    }),
  monthlyRate: Joi.number().positive().precision(2).required().messages({
    'any.required': 'Monthly rate is required',
    'number.positive': 'Monthly rate must be positive',
  }),
  installationDate: Joi.date().max('now').required().messages({
    'any.required': 'Installation date is required',
    'date.max': 'Installation date cannot be in the future',
  }),
  msoShareDue: Joi.number().precision(2).optional(),
  notes: Joi.string().max(500).optional().allow(''),
});

// Update customer validation schema
export const updateCustomerSchema = Joi.object({
  accountNo: Joi.string().optional(),
  lcoCustomerId: Joi.string().optional().allow(''),
  serialNumber: Joi.string().optional().allow(''),
  vcNumber: Joi.string().optional().allow(''),
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional().allow(''),
  password: Joi.string().min(6).optional(),
  phone: Joi.string()
    .pattern(/^[+]?[0-9\s\-()]{10,15}$/)
    .optional(),
  address: Joi.string().min(5).max(200).optional(),
  city: Joi.string().min(2).max(50).optional(),
  state: Joi.string().min(2).max(50).optional(),
  zipCode: Joi.string()
    .pattern(/^[0-9]{5,10}$/)
    .optional(),
  connectionType: Joi.string().valid('CABLE_TV', 'INTERNET', 'PHONE', 'BUNDLE').optional(),
  packageType: Joi.string().valid('BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE').optional(),
  monthlyRate: Joi.number().positive().precision(2).optional(),
  installationDate: Joi.date().max('now').optional(),
  status: Joi.string().valid('ACTIVE', 'SUSPENDED', 'DISCONNECTED', 'PENDING').optional(),
  msoShareDue: Joi.number().precision(2).optional(),
  notes: Joi.string().max(500).optional().allow(''),
});

// Customer query validation schema
export const getCustomersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().min(1).max(100).optional(),
  status: Joi.string().valid('ACTIVE', 'SUSPENDED', 'DISCONNECTED', 'PENDING').optional(),
  connectionType: Joi.string().valid('CABLE_TV', 'INTERNET', 'PHONE', 'BUNDLE').optional(),
  packageType: Joi.string().valid('BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE').optional(),
  city: Joi.string().optional(),
  state: Joi.string().optional(),
  sortBy: Joi.string()
    .valid('firstName', 'lastName', 'accountNo', 'installationDate', 'monthlyRate', 'createdAt')
    .default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

// Customer ID parameter validation
export const customerIdParamSchema = Joi.object({
  id: Joi.string().required().messages({
    'any.required': 'Customer ID is required',
    'string.empty': 'Customer ID cannot be empty',
  }),
});

// Customer phone parameter validation
export const customerPhoneParamSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[+]?[0-9\s\-()]{10,15}$/)
    .required()
    .messages({
      'any.required': 'Phone number is required',
      'string.empty': 'Phone number cannot be empty',
      'string.pattern.base': 'Phone number must be a valid format',
    }),
});

// Customer login validation schema
export const customerLoginSchema = Joi.object({
  accountNo: Joi.string().required().messages({
    'any.required': 'Account number is required',
    'string.empty': 'Account number cannot be empty',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
    'string.empty': 'Password cannot be empty',
  }),
});

// Change customer password validation schema
export const changeCustomerPasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
    'string.empty': 'Current password cannot be empty',
  }),
  newPassword: Joi.string().min(6).required().messages({
    'any.required': 'New password is required',
    'string.min': 'New password must be at least 6 characters',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.required': 'Password confirmation is required',
    'any.only': 'Password confirmation must match new password',
  }),
});
