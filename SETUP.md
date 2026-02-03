# Attendance System - MongoDB Setup

This system uses **MongoDB exclusively** for all data storage. No local JSON files are used.

## Prerequisites
- MongoDB Atlas account (or local MongoDB instance)
- Node.js 18+ installed
- Environment variables configured

## Environment Setup

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/attendance-system?retryWrites=true&w=majority
JWT_SECRET=your-secure-jwt-secret-key-here

# Email Configuration for OTP
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Cloudinary Configuration (optional)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Database Models

The system uses these MongoDB collections:

1. **Users** - Dev, Admin, and Employee accounts
2. **OTP** - One-time passwords for attendance marking
3. **Attendance** - Entry/Exit records with location tracking
4. **Disputes** - Employee attendance dispute records
5. **AttendanceLog** - Audit trail for all attendance changes
6. **Settings** - Global system settings

## Initial Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Dev User (Super Admin)
```bash
npm run seed:dev
```
**Credentials:** dev@company.com / dev@123

### 3. (Optional) Create Admin User
```bash
npm run seed:admin
```
**Credentials:** admin@company.com / admin@123

### 4. (Optional) Initialize Settings
```bash
npm run seed:settings
```

### 5. Start Development Server
```bash
npm run dev
```

## User Roles & Permissions

### Dev (Super Admin)
- Full system access
- Can create Admin and Employee users
- Can manage all settings
- Can view and modify all data

### Admin
- Can create Employee users only
- Can generate OTP codes
- Can manage attendance records
- Can resolve disputes
- Can configure system settings
- Can export attendance reports

### Employee
- Can mark attendance using OTP
- Can view own attendance history
- Can raise attendance disputes
- Can change own password
- Can update profile

## Features

### Attendance Marking
- OTP-based check-in/check-out system
- Location tracking (GPS coordinates)
- Time-bound OTP validity (configurable)
- Entry and exit time windows

### Dispute Management
- Employees can raise disputes for missed attendance
- Admins review and approve/reject with notes
- Full audit trail maintained

### Settings Configuration
- Entry time window (default: 09:00 - 10:00)
- Exit time window (default: 17:00 - 18:00)
- OTP validity period (default: 5 minutes)
- Email configuration for notifications

### Security Features
- JWT-based authentication
- HttpOnly cookies for session management
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Location verification for attendance

## API Structure

All server actions are located in `app/actions/`:
- `auth.ts` - Login/logout
- `users.ts` - User management (CRUD)
- `attendance.ts` - Attendance marking and retrieval
- `disputes.ts` - Dispute management
- `settings.ts` - System configuration
- `otp-management.ts` - OTP generation and validation

## Data Flow

1. **Login**: Email + Password → JWT Token → HttpOnly Cookie
2. **Mark Entry**: OTP + Location → Verify OTP → Record Entry Time
3. **Mark Exit**: OTP + Location → Verify OTP → Record Exit Time
4. **Raise Dispute**: Date + Reason → Create Dispute Record
5. **Admin Review**: Approve/Reject → Update Attendance

## Production Deployment

### Environment Variables
Ensure all environment variables are set in your hosting platform.

### Database
- Use MongoDB Atlas for production
- Enable IP whitelisting
- Use strong authentication credentials
- Regular backups recommended

### Security
- Change default passwords immediately
- Use strong JWT_SECRET
- Enable HTTPS
- Configure proper CORS settings

## Troubleshooting

### Login Issues
1. Clear browser cookies
2. Check MongoDB connection
3. Verify JWT_SECRET matches across all files

### Attendance Not Recording
1. Check OTP is valid and not expired
2. Ensure location permissions enabled
3. Verify employee account not locked

### Profile Picture Upload
1. Files must be under 5MB
2. Supported formats: JPG, PNG, GIF
3. Images stored as base64 (or Cloudinary if configured)

## Maintenance Scripts

```bash
# Create dev user
npm run seed:dev

# Create admin user  
npm run seed:admin

# Initialize settings
npm run seed:settings

# Run all seeds
npm run seed
```

## Support

For issues or questions, check:
1. MongoDB connection string
2. Environment variables
3. Console error logs
4. Network tab in browser DevTools
