# Workplace Attendance System - Setup Guide

## Quick Setup Instructions

### 1. Install Dependencies

The system requires a few npm packages. Check if you need to install:

```bash
npm install
# or if calendar component is missing
npm install react-day-picker
```

### 2. Create Initial Dev User

You need to create the first dev user manually. Create a script to do this:

**File: `scripts/create-dev-user.ts`**

```typescript
import { UserModel } from '../lib/models';
import connectDB from '../lib/mongodb';
import bcrypt from 'bcryptjs';

async function createDevUser() {
    await connectDB();
    
    const hashedPassword = await bcrypt.hash('dev@123', 10); // Change this password!
    
    const devUser = {
        id: 'dev-001',
        name: 'Super Admin',
        email: 'dev@company.com',
        password: hashedPassword,
        role: 'dev',
        locked: false,
        createdAt: Date.now()
    };
    
    await UserModel.create(devUser);
    console.log('Dev user created successfully!');
    console.log('Email: dev@company.com');
    console.log('Password: dev@123');
    console.log('Please change the password after first login!');
}

createDevUser()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
```

Run it:
```bash
npx tsx scripts/create-dev-user.ts
```

### 3. Environment Variables

Make sure your `.env.local` has:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your-super-secret-jwt-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For photo uploads (if using Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Database Setup

The system will automatically create collections when you first use them, but you can run migrations:

```bash
# The database models will auto-create indexes
# Just make sure MongoDB is running and accessible
```

## First Time Login

1. Start the development server:
```bash
npm run dev
```

2. Navigate to `http://localhost:3000/login`

3. Login with dev credentials:
   - Email: `dev@company.com`
   - Password: `dev@123`

4. You'll be redirected to `/dev` dashboard

## Creating Your First Admin

From the Dev dashboard:

1. Go to "Admins" tab
2. Click "Create Admin"
3. Fill in:
   - Name: Admin Name
   - Email: admin@company.com
   - Password: (set secure password)
4. Click "Create"

## Creating Employees

From Admin dashboard:

1. Go to "Employees" tab
2. Click "Create Employee"
3. Fill in employee details
4. Click "Create"

## Generating First QR Code

From Admin dashboard:

1. Go to "QR Codes" tab
2. Click "Generate QR Code"
3. Set expiry hours (default 24 hours)
4. Click "Generate"
5. Share the QR code with employees

## Employee Flow

1. Employee logs in with their credentials
2. Navigate to "Scan QR" tab
3. Click "Start Camera" to take selfie
4. Capture photo
5. Scan the admin's QR code
6. Attendance is marked!

## Testing the Complete Flow

### Test Scenario 1: Mark Attendance

1. **As Admin**: Generate a QR code (24hr expiry)
2. **As Employee**: 
   - Login
   - Take photo
   - Scan QR code
   - Verify attendance is marked
3. **As Admin**: View today's attendance to confirm

### Test Scenario 2: Raise Dispute

1. **As Employee**:
   - Go to "Disputes" tab
   - Select a date
   - Enter reason
   - Submit dispute
2. **As Admin**:
   - Go to "Disputes" tab
   - See pending dispute
   - Approve or reject with notes

### Test Scenario 3: Edit Attendance

1. **As Admin**:
   - Go to "Attendance" tab
   - Find an attendance record
   - Click "Edit"
   - Change status
   - Add reason
   - Save
2. **Check Logs** tab to see the edit logged

### Test Scenario 4: Export Data

1. **As Admin**:
   - Go to "Attendance" tab
   - Click "Export to Excel"
   - Select date range
   - Download the file

## Migration from Old System

If you're migrating from the old student/teacher system:

### Data Migration Script

Create `scripts/migrate-to-workplace.ts`:

```typescript
import { UserModel, SessionModel, AttendanceModel } from '../lib/models';
import connectDB from '../lib/mongodb';

async function migrate() {
    await connectDB();
    
    // 1. Update user roles
    await UserModel.updateMany(
        { role: 'student' },
        { $set: { role: 'employee' } }
    );
    
    await UserModel.updateMany(
        { role: 'teacher' },
        { $set: { role: 'admin' } }
    );
    
    console.log('User roles updated');
    
    // 2. Delete old session data (incompatible schema)
    await SessionModel.deleteMany({});
    console.log('Old sessions cleared');
    
    // 3. Migrate attendance records
    const oldAttendance = await AttendanceModel.find({});
    for (const record of oldAttendance) {
        await AttendanceModel.updateOne(
            { _id: record._id },
            {
                $set: {
                    employeeId: record.studentId,
                    employeeName: record.studentName,
                    markedBy: 'employee',
                    qrCodeId: 'migrated'
                },
                $unset: {
                    studentId: '',
                    studentName: '',
                    sessionId: ''
                }
            }
        );
    }
    
    console.log('Attendance records migrated');
    console.log('Migration complete!');
}

migrate()
    .then(() => process.exit(0))
    .catch(console.error);
```

Run migration:
```bash
npx tsx scripts/migrate-to-workplace.ts
```

## Important Security Notes

1. **Change Default Passwords**: Always change default dev password after first login
2. **JWT Secret**: Use a strong random string for JWT_SECRET in production
3. **HTTPS**: Use HTTPS in production
4. **Rate Limiting**: Add rate limiting to prevent abuse
5. **Photo Storage**: Configure proper photo storage (Cloudinary or S3)

## Troubleshooting

### Issue: Camera not working
- Check browser permissions
- Try HTTPS instead of HTTP
- Ensure camera is not in use by another app

### Issue: QR code not scanning
- Ensure QR code is not expired
- Check IST timezone is correct
- Verify QR code is active

### Issue: Attendance already marked
- One attendance per employee per day (IST)
- Check if already marked today
- Admin can edit if needed

### Issue: Cannot create admin
- Only dev can create admins
- Check if logged in as dev role
- Verify email is not already in use

## Next Steps

1. **Customize UI**: Update colors, branding, logos
2. **Add Email Notifications**: Send emails on dispute resolution
3. **Add More Reports**: Create custom reports
4. **Add Biometric**: Integrate fingerprint/face recognition
5. **Add Mobile App**: Create React Native app for employees
6. **Add Analytics**: Dashboard with charts and graphs
7. **Add Shift Management**: Support multiple shifts
8. **Add Leave Management**: Integrate leave/vacation tracking

## Support & Documentation

- Main README: `WORKPLACE_SYSTEM_README.md`
- API Documentation: See action files in `app/actions/`
- Database Schema: See `lib/models.ts`
- UI Components: See `components/workplace/`

## Production Deployment

Before deploying to production:

1. Set strong passwords
2. Configure production MongoDB
3. Set up proper photo storage
4. Enable HTTPS
5. Configure domain
6. Set up monitoring
7. Create backup strategy
8. Test all features thoroughly

```bash
npm run build
npm start
```

For Vercel/Netlify deployment, ensure environment variables are set properly.
