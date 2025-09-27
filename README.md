# Cable Management System Backend

A production-ready TypeScript API for managing cable services, built with Express.js, Prisma ORM, and Supabase PostgreSQL.

## 🚀 Features

- **Database**: Supabase PostgreSQL with Prisma ORM
- **Authentication**: JWT-based authentication with refresh tokens
- **API Documentation**: Swagger/OpenAPI integration
- **Testing**: Comprehensive test suite with Jest
- **Security**: Helmet, CORS, rate limiting, bcrypt password hashing
- **Validation**: Request validation with Joi
- **Logging**: Winston with daily log rotation and Firebase integration
- **File Upload**: Multer integration for file handling
- **Type Safety**: Full TypeScript implementation

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Supabase account and project

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Cable
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your Supabase connection details:

   ```env
   DATABASE_URL="postgresql://postgres:your_password@your_project_ref.supabase.co:5432/postgres?sslmode=require&schema=public"
   ```

4. **Set up the database**

   ```bash
   # Test database connection
   npm run db:test

   # Set up database schema
   npm run db:setup

   # Or run individually:
   npm run db:generate  # Generate Prisma client
   npm run db:push      # Push schema to database
   npm run db:seed      # Seed initial data (optional)
   ```

5. **Set up Firebase (optional)**

   To enable Firebase logging:
   - Create a Firebase project at https://console.firebase.google.com/
   - Generate a service account key
   - Add the key to your `.env` file:

   ```env
   FIREBASE_SERVICE_ACCOUNT_KEY="{\"type\":\"service_account\",...}"
   # OR
   FIREBASE_SERVICE_ACCOUNT_PATH="/path/to/serviceAccountKey.json"
   FIREBASE_DATABASE_URL="https://your-project.firebaseio.com"
   ```

## 🏃‍♂️ Running the Application

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### With debugging

```bash
npm run dev:debug
```

## 🗄️ Database Configuration

This project uses **Supabase PostgreSQL** as the primary database. See [Supabase Setup Guide](./docs/supabase-setup.md) for detailed configuration instructions.

### Quick Database Commands

```bash
# Test database connection
npm run db:test

# Complete database setup
npm run db:setup

# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Create and run migrations
npm run db:migrate

# Deploy migrations to production
npm run db:deploy

# Seed database with initial data
npm run db:seed

# Seed only users
npm run db:seed:users

# Clear all seeded data
npm run db:seed:clear

# Reset database (clear + seed)
npm run db:seed:reset
```

### Fallback to SQLite

For local development when Supabase is unavailable:

1. Update `.env`:

   ```env
   DATABASE_URL="file:./dev.db"
   ```

2. Update `prisma/schema.prisma`:

   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

3. Change `Decimal` types to `Float` in the schema for SQLite compatibility.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run end-to-end tests
npm run test:e2e
```

## 📊 API Documentation

Once the server is running, access the API documentation at:

- Development: http://localhost:3000/api-docs
- The API documentation is automatically generated from JSDoc comments

### New Logging Endpoints

The system now includes new endpoints for retrieving activity logs and database changes:

- `GET /api/logs/activity` - Get activity logs (Manager and Admin only)
- `GET /api/logs/database` - Get database changes (Admin only)
- `GET /api/logs/activity/user/:userId` - Get activity logs for a specific user (Manager and Admin only)

These endpoints require Firebase logging to be enabled and configured.

## 🔧 Development Tools

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Type checking
npm run typecheck
```

### Build

```bash
# Clean build directory
npm run clean

# Build for production
npm run build
```

## 🐳 Docker Support

```bash
# Build Docker image
npm run docker:build

# Run Docker container
npm run docker:run
```

## 📁 Project Structure

```
src/
├── config/           # Configuration files
├── database/         # Database configuration and seeds
├── middleware/       # Express middleware
├── modules/          # Feature modules (auth, users, customers, logs, etc.)
├── services/         # Business logic services
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
└── ...

prisma/
├── schema.prisma     # Database schema

docs/
├── supabase-setup.md # Supabase setup guide
└── ...

scripts/
├── test-db-connection.js  # Database testing script
└── ...
```

## 🔐 Environment Variables

Key environment variables (see `.env.example` for complete list):

```env
# Database
DATABASE_URL="postgresql://postgres:password@host:5432/postgres?sslmode=require&schema=public"

# JWT
JWT_SECRET="your_jwt_secret"
JWT_REFRESH_SECRET="your_refresh_secret"

# Application
NODE_ENV="development"
PORT=3000

# Supabase (Optional for future features)
SUPABASE_URL="https://your_project.supabase.co"
SUPABASE_ANON_KEY="your_anon_key"

# Firebase Configuration (for activity logging)
# Either provide the service account key as JSON or path to the key file
FIREBASE_SERVICE_ACCOUNT_KEY=
FIREBASE_SERVICE_ACCOUNT_PATH=
FIREBASE_DATABASE_URL=
```

## 🚀 Deployment

### Supabase Database

1. Create a Supabase project
2. Configure environment variables with your Supabase connection string
3. Run `npm run db:deploy` to deploy migrations

### Application Deployment

1. Set production environment variables
2. Build the application: `npm run build`
3. Start the server: `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 📞 Support

For support and questions, please refer to the documentation or create an issue in the repository.
