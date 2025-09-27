# Postman Collection Guide - Cable Management System API

This guide explains how to use the Postman collection for testing the Cable Management System API.

## 📁 Collection Files

- **[`Cable-Management-API.postman_collection.json`](./Cable-Management-API.postman_collection.json)** - Main collection with all API endpoints
- **[`Cable-Management-Environment.postman_environment.json`](./Cable-Management-Environment.postman_environment.json)** - Environment variables for development

## 🚀 Quick Setup

### 1. Import Collection and Environment

1. Open Postman
2. Click **Import** button
3. Import both files:
   - `Cable-Management-API.postman_collection.json`
   - `Cable-Management-Environment.postman_environment.json`
4. Select the **Cable Management - Development** environment

### 2. Verify Server is Running

- Make sure your development server is running on `http://localhost:3000`
- Test with the **Health Check** request first

## 📚 Collection Structure

### 🏥 Health Check
- **Health Check** - Verify server status
- **API Info** - Get API information and available endpoints

### 🔐 Authentication
- **Register User** - Create new user account
- **Login Admin** - Login with admin credentials (`admin@cable.com` / `admin123`)
- **Login Manager** - Login with manager credentials (`manager@cable.com` / `manager123`)
- **Login Staff** - Login with staff credentials (`staff@cable.com` / `staff123`)
- **Refresh Token** - Refresh expired access token
- **Get Current User** - Get authenticated user profile
- **Validate Token** - Verify JWT token validity
- **Logout** - Logout current user

### 👥 User Management
- **Create User** - Create new user (Manager/Admin only)
- **Get All Users** - List users with pagination
- **Get Users with Filters** - Search and filter users
- **Get Current User Profile** - Get own profile
- **Get User by ID** - Get specific user details
- **Update User** - Update user information
- **Change Password** - Change user password
- **Get User Statistics** - View user stats (Manager/Admin only)
- **Toggle User Status** - Activate/deactivate users (Admin only)
- **Verify User** - Verify user accounts (Manager/Admin only)
- **Delete User (Soft)** - Soft delete user (Admin only)
- **Delete User (Permanent)** - Hard delete user (Admin only)

## 🔄 Workflow Guide

### Basic Authentication Flow

1. **Start with Health Check**
   ```
   GET /health
   ```

2. **Login as Admin**
   ```
   POST /api/auth/login
   Body: {"email": "admin@cable.com", "password": "admin123"}
   ```

3. **The access token is automatically saved** in environment variables

4. **Access Protected Resources**
   ```
   GET /api/users (uses Bearer token automatically)
   ```

### User Management Flow

1. **Login as Admin/Manager**
2. **Create a New User**
   ```
   POST /api/users
   Body: User creation data
   ```

3. **Get All Users**
   ```
   GET /api/users?page=1&limit=10
   ```

4. **Update User Information**
   ```
   PUT /api/users/{user_id}
   Body: Updated user data
   ```

5. **Manage User Status**
   ```
   PATCH /api/users/{user_id}/toggle-status
   PATCH /api/users/{user_id}/verify
   ```

## 🔧 Environment Variables

The collection uses the following environment variables:

| Variable | Description | Auto-Set |
|----------|-------------|----------|
| `base_url` | API base URL | Manual |
| `access_token` | JWT access token | Auto (on login) |
| `refresh_token` | JWT refresh token | Auto (on login) |
| `current_user_id` | Logged-in user ID | Auto (on login) |
| `current_user_role` | User role | Auto (on login) |
| `created_user_id` | ID of newly created user | Auto (on user creation) |
| `token_expiry` | Token expiration timestamp | Auto (on login) |

## 🧪 Testing Different Roles

### Admin Testing
1. Use **Login Admin** request
2. Test all endpoints (full access)
3. Try creating users with different roles
4. Test user management functions

### Manager Testing
1. Use **Login Manager** request  
2. Test user creation (limited to staff/technician)
3. Test user viewing and statistics
4. Cannot create admin users or delete users

### Staff Testing
1. Use **Login Staff** request
2. Test viewing users (should work)
3. Try creating users (should fail - 403 Forbidden)
4. Can only update own profile

## 🔍 Common Test Scenarios

### Role-Based Access Control
- Login as different roles and test the same endpoints
- Verify proper error responses (401, 403)
- Test self-access vs. admin access

### Validation Testing
- Try invalid email formats in registration
- Test weak passwords
- Submit incomplete required fields
- Test field length limits

### Security Testing
- Access endpoints without tokens (should return 401)
- Use invalid/expired tokens (should return 401)  
- Try accessing other users' data as staff (should return 403)

## 📝 Request Examples

### User Registration
```json
{
  "email": "newuser@cable.com",
  "username": "newuser",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "firstName": "New",
  "lastName": "User",
  "phone": "+1234567890"
}
```

### User Creation (Admin/Manager)
```json
{
  "email": "staff@example.com",
  "username": "staffuser",
  "password": "StaffPass123!",
  "confirmPassword": "StaffPass123!",
  "firstName": "Staff",
  "lastName": "Member",
  "role": "STAFF"
}
```

### User Update
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "phone": "+1234567999"
}
```

### Password Change
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

## 🚨 Expected Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | Success | Successful operations |
| 201 | Created | User/resource creation |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate email/username |
| 500 | Server Error | Internal server issues |

## 🔄 Token Management

### Automatic Token Refresh
The collection includes pre-request scripts that automatically:
- Check token expiration
- Refresh tokens when needed
- Update environment variables

### Manual Token Refresh
If needed, use the **Refresh Token** request manually:
```json
{
  "refreshToken": "{{refresh_token}}"
}
```

## 🐛 Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check if you're logged in
   - Verify token is set in environment
   - Try refreshing the token

2. **403 Forbidden**
   - Check user role permissions
   - Verify you have access to the endpoint
   - Admin/Manager required for some operations

3. **400 Validation Error**
   - Check request body format
   - Verify required fields are present
   - Check field validation rules

4. **404 Not Found**
   - Verify endpoint URL is correct
   - Check if user/resource exists
   - Ensure server is running

### Server Not Responding
- Check if development server is running (`npm run dev`)
- Verify `base_url` environment variable
- Check console for server errors

## 📊 Collection Statistics

- **Total Requests**: 24
- **Authentication Endpoints**: 8
- **User Management Endpoints**: 12
- **Health Check Endpoints**: 2
- **Test Coverage**: All CRUD operations, Role-based access, Validation

## 🎯 Tips for Effective Testing

1. **Start with Admin Login** for full access testing
2. **Use different roles** to test permission boundaries  
3. **Test validation** with invalid data
4. **Check response formats** match API documentation
5. **Verify error handling** for edge cases
6. **Test pagination** with large datasets
7. **Use filtering and sorting** parameters

This Postman collection provides comprehensive coverage of the Cable Management System API, making it easy to test all functionality and verify proper security implementation.