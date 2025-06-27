# Datenfestung API Endpoints

## Authentication Endpoints
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login            - User login
POST   /api/auth/logout           - User logout
POST   /api/auth/refresh          - Refresh JWT token
POST   /api/auth/forgot-password  - Request password reset
POST   /api/auth/reset-password   - Reset password with token
GET    /api/auth/me               - Get current user info
PUT    /api/auth/profile          - Update user profile
```

## Dashboard Endpoints
```
GET    /api/dashboard/stats       - Get dashboard statistics
GET    /api/dashboard/notifications - Get recent notifications
GET    /api/dashboard/tasks/overdue - Get overdue tasks
GET    /api/dashboard/contracts/expiring - Get expiring contracts
```

## Processing Activities Endpoints
```
GET    /api/processing-activities           - Get all processing activities
POST   /api/processing-activities           - Create new processing activity
GET    /api/processing-activities/:id       - Get specific processing activity
PUT    /api/processing-activities/:id       - Update processing activity
DELETE /api/processing-activities/:id       - Delete processing activity
GET    /api/processing-activities/export    - Export VVT as PDF/Excel
POST   /api/processing-activities/import    - Import processing activities
GET    /api/processing-activities/templates - Get VVT templates
```

## Technical and Organizational Measures (TOM) Endpoints
```
GET    /api/toms                 - Get all TOMs
POST   /api/toms                 - Create new TOM
GET    /api/toms/:id             - Get specific TOM
PUT    /api/toms/:id             - Update TOM
DELETE /api/toms/:id             - Delete TOM
GET    /api/toms/templates       - Get TOM templates
POST   /api/toms/templates       - Create TOM template
GET    /api/toms/categories      - Get TOM categories
```

## Contract Management Endpoints
```
GET    /api/contracts            - Get all contracts
POST   /api/contracts            - Create new contract
GET    /api/contracts/:id        - Get specific contract
PUT    /api/contracts/:id        - Update contract
DELETE /api/contracts/:id        - Delete contract
POST   /api/contracts/:id/upload - Upload contract document
GET    /api/contracts/:id/download - Download contract document
GET    /api/contracts/expiring   - Get expiring contracts
POST   /api/contracts/:id/remind - Send renewal reminder
```

## Task Management Endpoints
```
GET    /api/tasks                - Get all tasks
POST   /api/tasks                - Create new task
GET    /api/tasks/:id            - Get specific task
PUT    /api/tasks/:id            - Update task
DELETE /api/tasks/:id            - Delete task
PUT    /api/tasks/:id/assign     - Assign task to user
PUT    /api/tasks/:id/status     - Update task status
GET    /api/tasks/assigned       - Get tasks assigned to current user
GET    /api/tasks/overdue        - Get overdue tasks
```

## E-Learning Endpoints
```
GET    /api/courses              - Get all courses
POST   /api/courses              - Create new course
GET    /api/courses/:id          - Get specific course
PUT    /api/courses/:id          - Update course
DELETE /api/courses/:id          - Delete course
POST   /api/courses/:id/upload   - Upload course content
GET    /api/courses/:id/progress - Get user progress for course
PUT    /api/courses/:id/progress - Update user progress
POST   /api/courses/:id/complete - Mark course as completed
GET    /api/quizzes/:courseId    - Get quiz questions for course
POST   /api/quizzes/:courseId/submit - Submit quiz answers
GET    /api/progress/user/:userId - Get user's overall progress
```

## User Management Endpoints (Admin only)
```
GET    /api/users                - Get all users
POST   /api/users                - Create new user
GET    /api/users/:id            - Get specific user
PUT    /api/users/:id            - Update user
DELETE /api/users/:id            - Delete user
PUT    /api/users/:id/activate   - Activate user account
PUT    /api/users/:id/deactivate - Deactivate user account
PUT    /api/users/:id/role       - Update user role
```

## Organization Management Endpoints
```
GET    /api/organizations        - Get organization details
PUT    /api/organizations        - Update organization
GET    /api/organizations/users  - Get organization users
POST   /api/organizations/invite - Invite user to organization
```

## Notification Endpoints
```
GET    /api/notifications        - Get user notifications
PUT    /api/notifications/:id/read - Mark notification as read
PUT    /api/notifications/mark-all-read - Mark all notifications as read
DELETE /api/notifications/:id    - Delete notification
```

## File Upload Endpoints
```
POST   /api/files/upload         - Upload file (contracts, course content)
GET    /api/files/:id            - Download file
DELETE /api/files/:id            - Delete file
```

## Reporting Endpoints
```
GET    /api/reports/vvt          - Generate VVT report
GET    /api/reports/toms         - Generate TOM report
GET    /api/reports/contracts    - Generate contracts report
GET    /api/reports/compliance   - Generate compliance overview
GET    /api/reports/audit        - Generate audit log report
POST   /api/reports/custom       - Generate custom report
```

## System/Admin Endpoints
```
GET    /api/system/health        - System health check
GET    /api/system/version       - Get system version
GET    /api/audit-log            - Get audit log (admin only)
GET    /api/system/stats         - Get system statistics (admin only)
```

## Request/Response Examples

### Authentication
```javascript
// POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Processing Activity
```javascript
// POST /api/processing-activities
{
  "name": "Customer Registration",
  "purpose": "Creating customer accounts for service access",
  "legalBasis": "contract",
  "dataCategories": ["personal_data", "contact_data"],
  "dataSubjects": ["customers", "prospects"],
  "recipients": ["internal_staff", "it_service_provider"],
  "thirdCountryTransfers": false,
  "retentionPeriod": "5 years after contract termination",
  "tomIds": [1, 2, 3]
}

// Response
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Customer Registration",
    "purpose": "Creating customer accounts for service access",
    "legalBasis": "contract",
    "dataCategories": ["personal_data", "contact_data"],
    "dataSubjects": ["customers", "prospects"],
    "recipients": ["internal_staff", "it_service_provider"],
    "thirdCountryTransfers": false,
    "retentionPeriod": "5 years after contract termination",
    "tomIds": [1, 2, 3],
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

## Error Responses
```javascript
// Validation Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}

// Authentication Error
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials"
  }
}

// Not Found Error
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```