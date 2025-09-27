import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Type declaration for our environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_VERSION?: string;
      API_DESCRIPTION?: string;
      API_TITLE?: string;
      NODE_ENV?: string;
      PORT?: string;
      HOST?: string;
      DATABASE_URL?: string;
      DIRECT_URL?: string;
      DATABASE_HOST?: string;
      DATABASE_PORT?: string;
      DATABASE_NAME?: string;
      DATABASE_USER?: string;
      DATABASE_PASSWORD?: string;
      JWT_SECRET?: string;
      JWT_EXPIRES_IN?: string;
      JWT_REFRESH_SECRET?: string;
      JWT_REFRESH_EXPIRES_IN?: string;
      BCRYPT_SALT_ROUNDS?: string;
      RATE_LIMIT_WINDOW_MS?: string;
      RATE_LIMIT_MAX_REQUESTS?: string;
      SMTP_HOST?: string;
      SMTP_PORT?: string;
      SMTP_SECURE?: string;
      SMTP_USER?: string;
      SMTP_PASS?: string;
      MAX_FILE_SIZE?: string;
      UPLOAD_PATH?: string;
      LOG_LEVEL?: string;
      LOG_FILE_PATH?: string;
      CORS_ORIGIN?: string;
      SUPABASE_URL?: string;
      SUPABASE_ANON_KEY?: string;
      SUPABASE_SERVICE_ROLE_KEY?: string;
    }
  }
}

interface Config {
  app: {
    name: string;
    version: string;
    description: string;
    env: string;
    port: number;
    host: string;
  };
  database: {
    url: string;
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  bcrypt: {
    saltRounds: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  email: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };
  upload: {
    maxFileSize: number;
    path: string;
  };
  logging: {
    level: string;
    filePath: string;
  };
  api: {
    title: string;
    description: string;
    version: string;
  };
  cors: {
    origin: string[];
  };
  supabase?: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
}

const config: Config = {
  app: {
    name: 'Cable Management System',
    version: process.env.API_VERSION || '1.0.0',
    description: process.env.API_DESCRIPTION || 'Cable Management System API',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/cable_db',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    name: process.env.DATABASE_NAME || 'cable_db',
    user: process.env.DATABASE_USER || 'username',
    password: process.env.DATABASE_PASSWORD || 'password',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secret_jwt_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_super_secret_refresh_jwt_key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
    path: process.env.UPLOAD_PATH || './uploads',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
  },
  api: {
    title: process.env.API_TITLE || 'Cable Management System API',
    description: process.env.API_DESCRIPTION || 'Production ready API for Cable Management System',
    version: process.env.API_VERSION || '1.0.0',
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  },
};

// Add Supabase configuration if environment variables are provided
if (
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_ANON_KEY &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  (config as any).supabase = {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export default config;
