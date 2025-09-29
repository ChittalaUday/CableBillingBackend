import Joi from 'joi';

// Validation schema for creating a complaint
export const createComplaintSchema = Joi.object({
  customerId: Joi.string().required().messages({
    'any.required': 'Customer ID is required',
    'string.empty': 'Customer ID cannot be empty',
  }),
  title: Joi.string().required().messages({
    'any.required': 'Title is required',
    'string.empty': 'Title cannot be empty',
  }),
  description: Joi.string().required().messages({
    'any.required': 'Description is required',
    'string.empty': 'Description cannot be empty',
  }),
  category: Joi.string()
    .valid('REPAIR', 'NEW_INSTALLATION', 'HOME_VISIT_COLLECTION', 'WIRE_CUT')
    .required()
    .messages({
      'any.required': 'Category is required',
      'any.only':
        'Category must be one of: REPAIR, NEW_INSTALLATION, HOME_VISIT_COLLECTION, WIRE_CUT',
    }),
  priority: Joi.string()
    .valid('LOW', 'MEDIUM', 'HIGH', 'URGENT')
    .optional()
    .default('MEDIUM')
    .messages({
      'any.only': 'Priority must be one of: LOW, MEDIUM, HIGH, URGENT',
    }),
  assignedTo: Joi.string().optional().allow(null),
});

// Validation schema for updating a complaint
export const updateComplaintSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  category: Joi.string()
    .valid('REPAIR', 'NEW_INSTALLATION', 'HOME_VISIT_COLLECTION', 'WIRE_CUT')
    .optional()
    .messages({
      'any.only':
        'Category must be one of: REPAIR, NEW_INSTALLATION, HOME_VISIT_COLLECTION, WIRE_CUT',
    }),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional().messages({
    'any.only': 'Priority must be one of: LOW, MEDIUM, HIGH, URGENT',
  }),
  status: Joi.string().valid('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED').optional().messages({
    'any.only': 'Status must be one of: OPEN, IN_PROGRESS, RESOLVED, CLOSED',
  }),
  assignedTo: Joi.string().optional().allow(null),
  resolution: Joi.string().optional().allow(null),
  resolvedAt: Joi.date().optional().allow(null),
});

// Validation schema for complaint ID parameter
export const complaintIdParamSchema = Joi.object({
  id: Joi.string().required().messages({
    'any.required': 'Complaint ID is required',
    'string.empty': 'Complaint ID cannot be empty',
  }),
});

// Validation schema for customer ID parameter
export const customerIdParamSchema = Joi.object({
  customerId: Joi.string().required().messages({
    'any.required': 'Customer ID is required',
    'string.empty': 'Customer ID cannot be empty',
  }),
});

// Validation schema for query parameters
export const getComplaintsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
  status: Joi.string().valid('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED').optional().messages({
    'any.only': 'Status must be one of: OPEN, IN_PROGRESS, RESOLVED, CLOSED',
  }),
  category: Joi.string()
    .valid('REPAIR', 'NEW_INSTALLATION', 'HOME_VISIT_COLLECTION', 'WIRE_CUT')
    .optional()
    .messages({
      'any.only':
        'Category must be one of: REPAIR, NEW_INSTALLATION, HOME_VISIT_COLLECTION, WIRE_CUT',
    }),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional().messages({
    'any.only': 'Priority must be one of: LOW, MEDIUM, HIGH, URGENT',
  }),
  assignedTo: Joi.string().optional(),
  customerId: Joi.string().optional(),
  search: Joi.string().optional(),
});
