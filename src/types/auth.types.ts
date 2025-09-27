export interface CreateUserDto {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'ADMIN' | 'MANAGER' | 'STAFF' | 'TECHNICIAN';
}

export interface UpdateUserDto {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  role?: 'ADMIN' | 'MANAGER' | 'STAFF' | 'TECHNICIAN';
  isActive?: boolean;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
  confirmPassword: string;
}

// Customer Authentication Types
export interface CustomerLoginDto {
  accountNo: string;
  password: string;
}

export interface CustomerRegisterDto {
  accountNo: string;
  firstName: string;
  lastName: string;
  email?: string;
  password?: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  connectionType: 'CABLE_TV' | 'INTERNET' | 'PHONE' | 'BUNDLE';
  packageType: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
  monthlyRate: number;
  installationDate: Date;
  notes?: string;
}

export interface CustomerChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}