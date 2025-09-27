import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '@/types/common.types';

export class ResponseUtil {
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode?: number
  ): Response<ApiResponse<T>>;
  static success(
    res: Response,
    data?: undefined,
    message?: string,
    statusCode?: number
  ): Response<ApiResponse>;
  static success<T>(
    res: Response,
    data?: T,
    message = 'Success',
    statusCode = 200
  ): Response<ApiResponse<T>> {
    const response: ApiResponse<T> = {
      success: true,
      message,
      ...(data !== undefined && { data }),
      timestamp: new Date().toISOString(),
      statusCode,
    };
    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    message = 'Internal Server Error',
    error?: any,
    statusCode = 500
  ): Response<ApiResponse> {
    const response: ApiResponse = {
      success: false,
      message,
      error: error?.message || error,
      timestamp: new Date().toISOString(),
      statusCode,
    };
    return res.status(statusCode).json(response);
  }

  static paginated<T>(
    res: Response,
    items: T[],
    total: number,
    page: number,
    limit: number,
    message = 'Success',
    statusCode = 200
  ): Response<PaginatedResponse<T>> {
    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse<T> = {
      success: true,
      message,
      data: {
        items,
        total,
        page,
        limit,
        totalPages,
      },
      timestamp: new Date().toISOString(),
      statusCode,
    };

    return res.status(statusCode).json(response);
  }

  static badRequest(res: Response, message = 'Bad Request', error?: any): Response<ApiResponse> {
    return this.error(res, message, error, 400);
  }

  static unauthorized(res: Response, message = 'Unauthorized'): Response<ApiResponse> {
    return this.error(res, message, null, 401);
  }

  static forbidden(res: Response, message = 'Forbidden'): Response<ApiResponse> {
    return this.error(res, message, null, 403);
  }

  static notFound(res: Response, message = 'Not Found'): Response<ApiResponse> {
    return this.error(res, message, null, 404);
  }

  static conflict(res: Response, message = 'Conflict', error?: any): Response<ApiResponse> {
    return this.error(res, message, error, 409);
  }

  static unprocessableEntity(
    res: Response,
    message = 'Unprocessable Entity',
    error?: any
  ): Response<ApiResponse> {
    return this.error(res, message, error, 422);
  }

  static tooManyRequests(res: Response, message = 'Too Many Requests'): Response<ApiResponse> {
    return this.error(res, message, null, 429);
  }
}
