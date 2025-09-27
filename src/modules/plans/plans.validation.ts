import Joi from 'joi';

export const createPlanSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  type: Joi.string().valid('BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE', 'CUSTOM').required(),
  price: Joi.number().positive().required(),
  channels: Joi.array().items(Joi.string()).optional().default([]),
  packageDetails: Joi.object().optional(),
});

export const updatePlanSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  description: Joi.string().max(500).optional(),
  type: Joi.string().valid('BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE', 'CUSTOM').optional(),
  price: Joi.number().positive().optional(),
  channels: Joi.array().items(Joi.string()).optional(),
  packageDetails: Joi.object().optional(),
  isActive: Joi.boolean().optional(),
});

export const getPlansQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
  search: Joi.string().max(100).optional(),
  type: Joi.string().valid('BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE', 'CUSTOM').optional(),
  isActive: Joi.boolean().optional(),
  sortBy: Joi.string()
    .valid('name', 'price', 'createdAt', 'updatedAt')
    .optional()
    .default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').optional().default('desc'),
});

export const planIdParamSchema = Joi.object({
  id: Joi.string().required(),
});
