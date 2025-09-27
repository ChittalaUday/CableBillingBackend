import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { prisma } from '@/database/prisma.service';
import config from '@/config';
import { Logger } from '@/utils/logger.util';

export interface CustomerAuthResult {
  success: boolean;
  customer?: any;
  supabaseUser?: any;
  token?: string | undefined;
  error?: string;
}

export interface CustomerRegistrationData {
  email: string;
  password: string;
  customerData: {
    accountNo: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    connectionType: 'CABLE_TV' | 'INTERNET' | 'PHONE' | 'BUNDLE';
    packageType: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
    monthlyRate: number;
    installationDate: Date;
    createdBy: string;
  };
}

export class SupabaseCustomerAuthService {
  private supabase: SupabaseClient | null = null;

  constructor() {
    this.initializeSupabase();
  }

  /**
   * Initialize Supabase client
   */
  private initializeSupabase(): void {
    if (!config.supabase) {
      Logger.warn('Supabase configuration not found. Supabase auth will be disabled.');
      return;
    }

    try {
      this.supabase = createClient(
        config.supabase.url,
        config.supabase.anonKey
      );
      Logger.info('Supabase client initialized successfully');
    } catch (error) {
      Logger.error('Failed to initialize Supabase client:', error);
    }
  }

  /**
   * Check if Supabase is available
   */
  public isAvailable(): boolean {
    return this.supabase !== null;
  }

  /**
   * Register a new customer with Supabase Auth and create customer record
   */
  public async registerCustomer(data: CustomerRegistrationData): Promise<CustomerAuthResult> {
    if (!this.supabase) {
      return {
        success: false,
        error: 'Supabase authentication is not available'
      };
    }

    try {
      // Register user with Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            firstName: data.customerData.firstName,
            lastName: data.customerData.lastName,
            phone: data.customerData.phone,
          }
        }
      });

      if (authError) {
        Logger.error('Supabase registration error:', authError);
        return {
          success: false,
          error: authError.message
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Failed to create Supabase user'
        };
      }

      // Create customer record in our database with Supabase user ID
      const customer = await prisma.customer.create({
        data: {
          accountNo: data.customerData.accountNo,
          customerNumber: data.customerData.accountNo || await this.generateCustomerNumber(),
          firstName: data.customerData.firstName,
          lastName: data.customerData.lastName,
          email: data.email,
          supabaseUserId: authData.user.id,
          phone: data.customerData.phone,
          address: data.customerData.address,
          city: data.customerData.city,
          state: data.customerData.state,
          zipCode: data.customerData.zipCode,
          connectionType: data.customerData.connectionType as 'CABLE_TV' | 'INTERNET' | 'PHONE' | 'BUNDLE',
          packageType: data.customerData.packageType as 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE',
          monthlyRate: data.customerData.monthlyRate,
          installationDate: data.customerData.installationDate,
          createdBy: data.customerData.createdBy,
        },
      });

      Logger.info(`Customer registered successfully with Supabase: ${customer.accountNo}`);

      return {
        success: true,
        customer,
        supabaseUser: authData.user,
        token: authData.session?.access_token
      };

    } catch (error: any) {
      Logger.error('Customer registration error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  }

  /**
   * Sign in customer with Supabase Auth
   */
  public async signInCustomer(email: string, password: string): Promise<CustomerAuthResult> {
    if (!this.supabase) {
      return {
        success: false,
        error: 'Supabase authentication is not available'
      };
    }

    try {
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        Logger.error('Supabase sign-in error:', authError);
        return {
          success: false,
          error: authError.message
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Authentication failed'
        };
      }

      // Get customer record from our database
      const customer = await prisma.customer.findUnique({
        where: {
          supabaseUserId: authData.user.id
        },
        select: {
          id: true,
          accountNo: true,
          customerNumber: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          connectionType: true,
          packageType: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      if (!customer) {
        return {
          success: false,
          error: 'Customer record not found'
        };
      }

      if (customer.status !== 'ACTIVE') {
        return {
          success: false,
          error: 'Customer account is not active'
        };
      }

      Logger.info(`Customer signed in successfully: ${customer.accountNo}`);

      return {
        success: true,
        customer,
        supabaseUser: authData.user,
        token: authData.session?.access_token
      };

    } catch (error: any) {
      Logger.error('Customer sign-in error:', error);
      return {
        success: false,
        error: error.message || 'Sign-in failed'
      };
    }
  }

  /**
   * Sign in with phone (OTP)
   */
  public async signInWithPhone(phone: string): Promise<any> {
    if (!this.supabase) {
      throw new Error('Supabase authentication is not available');
    }

    const { data, error } = await this.supabase.auth.signInWithOtp({
      phone: phone,
      options: {
        channel: 'sms'
      }
    });

    if (error) {
      Logger.error('Supabase phone auth error:', error);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Verify OTP for phone authentication
   */
  public async verifyOTP(phone: string, token: string): Promise<CustomerAuthResult> {
    if (!this.supabase) {
      return {
        success: false,
        error: 'Supabase authentication is not available'
      };
    }

    try {
      const { data: authData, error: authError } = await this.supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms'
      });

      if (authError) {
        Logger.error('OTP verification error:', authError);
        return {
          success: false,
          error: authError.message
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'OTP verification failed'
        };
      }

      // Find customer by phone number
      const customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { supabaseUserId: authData.user.id },
            { phone: phone.replace(/[^\d]/g, '') } // Clean phone number
          ]
        },
        select: {
          id: true,
          accountNo: true,
          customerNumber: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          connectionType: true,
          packageType: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      if (!customer) {
        return {
          success: false,
          error: 'Customer record not found'
        };
      }

      // Update customer with Supabase user ID if not already set
      if (!customer.id) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { supabaseUserId: authData.user.id }
        });
      }

      return {
        success: true,
        customer,
        supabaseUser: authData.user,
        token: authData.session?.access_token
      };

    } catch (error: any) {
      Logger.error('OTP verification error:', error);
      return {
        success: false,
        error: error.message || 'OTP verification failed'
      };
    }
  }

  /**
   * Reset password
   */
  public async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return {
        success: false,
        error: 'Supabase authentication is not available'
      };
    }

    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${config.frontend.url}/reset-password`
      });

      if (error) {
        Logger.error('Password reset error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      Logger.info(`Password reset email sent to: ${email}`);
      return { success: true };

    } catch (error: any) {
      Logger.error('Password reset error:', error);
      return {
        success: false,
        error: error.message || 'Password reset failed'
      };
    }
  }

  /**
   * Update password
   */
  public async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return {
        success: false,
        error: 'Supabase authentication is not available'
      };
    }

    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        Logger.error('Password update error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      Logger.info('Password updated successfully');
      return { success: true };

    } catch (error: any) {
      Logger.error('Password update error:', error);
      return {
        success: false,
        error: error.message || 'Password update failed'
      };
    }
  }

  /**
   * Sign out customer
   */
  public async signOut(): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return {
        success: false,
        error: 'Supabase authentication is not available'
      };
    }

    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        Logger.error('Sign out error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };

    } catch (error: any) {
      Logger.error('Sign out error:', error);
      return {
        success: false,
        error: error.message || 'Sign out failed'
      };
    }
  }

  /**
   * Get current user session
   */
  public async getSession(): Promise<any> {
    if (!this.supabase) {
      return null;
    }

    const { data: { session } } = await this.supabase.auth.getSession();
    return session;
  }

  /**
   * Generate unique customer number
   */
  private async generateCustomerNumber(): Promise<string> {
    const prefix = 'C';
    const randomNumber = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    const customerNumber = `${prefix}${randomNumber}`;

    // Check if the generated number already exists
    const existing = await prisma.customer.findUnique({
      where: { customerNumber },
    });

    if (existing) {
      // Generate a new one recursively if it exists
      return this.generateCustomerNumber();
    }

    return customerNumber;
  }
}