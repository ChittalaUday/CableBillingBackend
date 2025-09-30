export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
  timestamp: string;
  statusCode: number;
}

export interface PaginatedResponse<T> extends Omit<ApiResponse, 'data'> {
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'TECHNICIAN';
export type CustomerStatus = 'ACTIVE' | 'SUSPENDED' | 'DISCONNECTED' | 'PENDING';
export type BillStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'ESCALATED';
