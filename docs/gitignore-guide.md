# .gitignore Configuration Guide

This document explains the `.gitignore` configuration for the Cable Management System project.

## Overview

The `.gitignore` file is configured to exclude files and directories that should not be version controlled, including:

- Generated files
- Dependencies
- Environment variables
- Temporary files
- IDE-specific files
- Operating system files

## Sections Breakdown

### 🔧 **Dependencies**

```gitignore
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
package-lock.json  # Optional - some teams prefer to commit this
yarn.lock
pnpm-lock.yaml
```

- Excludes all package manager files and logs
- `package-lock.json` is included here but you may want to commit it for reproducible builds

### 🏗️ **Build & Compilation**

```gitignore
dist/
build/
*.tsbuildinfo
.rpt2_cache/
.rts2_cache_cjs/
```

- Generated TypeScript compilation output
- Build artifacts and cache files

### 🌍 **Environment Variables**

```gitignore
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.*.local
local.env
dev.env
```

- **Critical**: Prevents committing sensitive configuration
- Includes all common environment file patterns

### 🗄️ **Database Files**

```gitignore
*.db
*.sqlite
*.sqlite3
dev.db
database.db
```

- Local database files (SQLite fallback)
- Development database files

### 📁 **Application-specific**

```gitignore
uploads/
temp/
tmp/
logs/
*.log
```

- File upload directory
- Temporary files
- Log files

### 🧪 **Testing & Coverage**

```gitignore
coverage/
*.lcov
.nyc_output
test-results/
junit.xml
```

- Test coverage reports
- Test result files

### 💻 **IDE & Editor Files**

```gitignore
.vscode/
.idea/
*.swp
*.swo
*.sublime-project
*.sublime-workspace
```

- IDE configuration files
- Editor temporary files

### 🖥️ **Operating System Files**

```gitignore
.DS_Store      # macOS
Thumbs.db      # Windows
*~             # Linux backup files
```

- OS-generated files that shouldn't be versioned

## Important Notes

### ✅ **Files TO Commit**

- `package.json` - Project dependencies and scripts
- `prisma/schema.prisma` - Database schema
- `src/` - All source code
- `docs/` - Documentation
- `README.md` - Project documentation
- `.env.example` - Environment variable template
- Configuration files (`.eslintrc.js`, `.prettierrc`, `tsconfig.json`)

### ❌ **Files NOT TO Commit**

- `.env` - Contains sensitive information
- `node_modules/` - Can be regenerated
- `dist/` - Generated build output
- `uploads/` - User-uploaded files
- `logs/` - Runtime logs
- Database files (SQLite)

### 🤔 **Optional Files**

- `package-lock.json` - Some teams commit this for reproducible builds
- `prisma/migrations/` - Usually committed, but can be excluded in development

## Environment-Specific Considerations

### Development

```bash
# Create your local environment file
cp .env.example .env
# Edit with your local configuration
```

### Production

- Never commit production environment variables
- Use deployment platform's environment variable management
- Ensure all sensitive data is properly excluded

## Supabase Integration

The `.gitignore` is configured for Supabase projects:

- Excludes local database files (SQLite fallback)
- Keeps Supabase configuration files
- Excludes sensitive Supabase keys (in `.env`)

## Troubleshooting

### Already Committed Files

If you've already committed files that should be ignored:

```bash
# Remove from git but keep locally
git rm --cached filename

# Remove directory from git but keep locally
git rm -r --cached directory/

# For .env file specifically
git rm --cached .env
```

### Check What's Ignored

```bash
# Check if a file is ignored
git check-ignore filename

# List all ignored files
git status --ignored
```

### Force Add Ignored Files

```bash
# If you need to add an ignored file
git add -f filename
```

## Best Practices

1. **Review Regularly**: Update `.gitignore` as project needs change
2. **Team Consistency**: Ensure all team members use the same rules
3. **Environment Security**: Never commit sensitive environment variables
4. **Build Artifacts**: Always exclude generated files
5. **IDE Neutrality**: Exclude IDE-specific files to support different editors

## Common Mistakes to Avoid

❌ **Don't commit**:

- `.env` files with real credentials
- `node_modules/` directory
- Build output (`dist/`, `build/`)
- Log files
- Database files with real data

✅ **Do commit**:

- `.env.example` with dummy values
- Configuration files
- Source code
- Documentation
- Database schema (Prisma)

## Project-Specific Rules

For this Cable Management System:

- Upload directories are ignored (user files)
- Temporary processing files are ignored
- Development database files are ignored
- Build artifacts are ignored
- Log files are ignored

This configuration ensures that only source code, configuration, and documentation are version controlled while keeping sensitive and generated files out of the repository.
