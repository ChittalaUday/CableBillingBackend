import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma } from '@/database/prisma.service';
import config from '@/config';
import { CreateUserDto, LoginDto, RegisterDto, ChangePasswordDto } from '@/types/auth.types';
import { JwtPayload, AuthenticatedUser } from '@/types/common.types';

export class AuthService {
  async register(registerDto: RegisterDto): Promise<{ user: AuthenticatedUser; tokens: any }> {
    const { email, username, password, confirmPassword, firstName, lastName, phone } = registerDto;

    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role: 'STAFF',
        isActive: true,
        isVerified: false,
      },
    });

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
    };

    const tokens = this.generateTokens(user.id, user.email, user.username, user.role);

    return { user: authenticatedUser, tokens };
  }

  async login(loginDto: LoginDto): Promise<{ user: AuthenticatedUser; tokens: any }> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
    };

    const tokens = this.generateTokens(user.id, user.email, user.username, user.role);

    return { user: authenticatedUser, tokens };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new Error('New passwords do not match');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });
  }

  async refreshToken(refreshToken: string): Promise<{ tokens: any }> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret as string) as JwtPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user || !user.isActive) {
        throw new Error('Invalid refresh token');
      }

      const tokens = this.generateTokens(user.id, user.email, user.username, user.role);
      return { tokens };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async validateUser(payload: JwtPayload): Promise<AuthenticatedUser | null> {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
    };
  }

  private generateTokens(id: string, email: string, username: string, role: string): any {
    const payload: JwtPayload = {
      sub: id,
      email,
      username,
      role,
    };

    const jwtSecret = config.jwt.secret;
    const jwtRefreshSecret = config.jwt.refreshSecret;

    if (!jwtSecret || !jwtRefreshSecret) {
      throw new Error('JWT secrets are not configured');
    }

    const accessToken = jwt.sign(payload, jwtSecret as jwt.Secret, {
      expiresIn: config.jwt.expiresIn,
    });

    const refreshToken = jwt.sign(payload, jwtRefreshSecret as jwt.Secret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: config.jwt.expiresIn,
    };
  }
}
