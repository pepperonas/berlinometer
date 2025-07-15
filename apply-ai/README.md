# ApplyAI - AI-Powered Job Application Platform

A complete web application for AI-powered job applications with user authentication, admin approval system, and modern React frontend.

## Features

### User Features
- **User Registration & Login**: Secure authentication with JWT tokens
- **Admin Approval System**: New users must be approved by administrators
- **Modern UI**: Clean, responsive design with React
- **Dashboard**: Personal dashboard for authenticated users

### Admin Features
- **User Management**: View all registered users
- **Approval System**: Approve/revoke user access
- **User Deletion**: Remove users from the system
- **Admin Panel**: Dedicated interface for administrative tasks

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt encryption for passwords
- **Rate Limiting**: Protection against brute force attacks
- **CORS Configuration**: Secure cross-origin requests
- **Input Validation**: Server-side validation for all inputs

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MySQL** database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Helmet** for security headers
- **CORS** for cross-origin requests
- **Rate limiting** for API protection

### Frontend
- **React** with functional components and hooks
- **React Router** for navigation
- **Axios** for API calls
- **Modern CSS** with responsive design
- **Component-based architecture**

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MySQL database server
- npm or yarn package manager

### Backend Setup

1. **Navigate to server directory**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Copy `.env` file and update with your database credentials:
   ```bash
   # Database Configuration
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=applyai
   
   # JWT Secret (change in production)
   JWT_SECRET=your_super_secret_jwt_key
   
   # Server Configuration
   PORT=5077
   FRONTEND_URL=http://localhost:3000
   ```

4. **Create MySQL database**:
   ```bash
   mysql -u root -p < config/database.sql
   ```

5. **Start the server**:
   ```bash
   npm start
   # or for development with auto-restart
   npm run dev
   ```

### Frontend Setup

1. **Navigate to client directory**:
   ```bash
   cd client
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the React application**:
   ```bash
   npm start
   ```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5077

## Default Admin User

A default admin user is created automatically:
- **Email**: admin@applyai.com
- **Password**: admin123

⚠️ **Important**: Change the default admin password immediately after first login!

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Admin (Admin only)
- `GET /api/admin/users` - Get all users
- `PATCH /api/admin/users/:id/approve` - Approve/revoke user
- `DELETE /api/admin/users/:id` - Delete user

### Health Check
- `GET /api/health` - Server health status

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Project Structure

```
ApplyAI/
├── server/                 # Backend application
│   ├── config/            # Database configuration
│   ├── middleware/        # Authentication middleware
│   ├── routes/           # API routes
│   ├── .env              # Environment variables
│   ├── server.js         # Main server file
│   └── package.json      # Backend dependencies
├── client/                # Frontend application
│   ├── public/           # Static assets
│   ├── src/              # React source code
│   │   ├── components/   # React components
│   │   ├── services/     # API service functions
│   │   ├── App.js        # Main App component
│   │   └── index.js      # React entry point
│   └── package.json      # Frontend dependencies
└── README.md             # This file
```

## Usage

1. **Start both servers** (backend on port 5077, frontend on port 3000)
2. **Register a new user** at http://localhost:3000/register
3. **Login as admin** to approve the new user
4. **User can now login** after approval
5. **Admin can manage users** through the admin panel

## Security Notes

- Always use HTTPS in production
- Change default JWT secret and admin password
- Regularly update dependencies
- Use environment variables for sensitive data
- Implement proper backup procedures for the database

## Development

### Running in Development Mode

Backend:
```bash
cd server
npm run dev
```

Frontend:
```bash
cd client
npm start
```

### Available Scripts

Backend:
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

Frontend:
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.