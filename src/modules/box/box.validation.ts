import Joi from 'joi';

// Create box activation validation schema
export const createBoxActivationSchema = Joi.object({
  customerId: Joi.string().required().messages({
    'any.required': 'Customer ID is required',
    'string.empty': 'Customer ID cannot be empty',
  }),
  actionType: Joi.string()
    .valid('ACTIVATED', 'SUSPENDED', 'DEACTIVATED', 'REACTIVATED')
    .required()
    .messages({
      'any.required': 'Action type is required',
      'any.only': 'Action type must be one of: ACTIVATED, SUSPENDED, DEACTIVATED, REACTIVATED',
    }),
  reason: Joi.string().optional().allow(''),
  notes: Joi.string().optional().allow(''),
});

// Customer ID parameter validation
export const customerIdParamSchema = Joi.object({
  customerId: Joi.string().required().messages({
    'any.required': 'Customer ID is required',
    'string.empty': 'Customer ID cannot be empty',
  }),
});

// Box activation ID parameter validation
export const boxActivationIdParamSchema = Joi.object({
  id: Joi.string().required().messages({
    'any.required': 'Box activation ID is required',
    'string.empty': 'Box activation ID cannot be empty',
  }),
});