# Workplace Attendance System - Complete Transformation

This codebase has been transformed from an education attendance system to a workplace attendance system with the following features:

## Role Hierarchy

### 1. **Dev Role** (Super Admin)
- Has all permissions
- Can create admin accounts
- Can create employee accounts  
- Can delete any user (except other devs)
- Can view all system data
- Cannot be locked

### 2. **Admin Role**
- Can generate QR codes with expiry time (IST)
- Can manually invalidate/expire QR codes at any time
- Can view all employees and their attendance
- Can manually edit any employee's attendance (all edits are logged)
- Can view attendance edit logs
- Can download attendance in Excel format with date range filter
- Can view each employee's attendance with calendar view
- Can approve/reject employee disputes
- Can create employee accounts
- Cannot create other admins
- Cannot lock other admins

### 3. **Employee Role** (formerly Student)
- Can mark attendance by scanning QR code
- Must take photo while scanning
- Can view own attendance monthly
- Can see present/absent days with timestamps
- Can raise disputes for incorrect attendance
- Cannot access admin features

## Key Features

### QR Code System
- **Generation**: Admins can generate QR codes with custom expiry time
- **Expiry**: QR codes expire based on Indian Standard Time (IST)
- **Timezone**: All timestamps use IST (UTC+5:30)
- **Manual Invalidation**: Admins can invalidate any active QR code at any time
- **Status Tracking**: Each QR code tracks:
  - Created by (admin ID)
  - Creation timestamp (IST)
  - Expiry timestamp (IST)
  - Active status
  - Invalidation details (if invalidated)

### Attendance Features
- **Employee Marking**: 
  - Scan QR code
  - Take photo during scan
  - Only one attendance per day allowed
  - Records timestamp in IST
  
- **Admin Management**:
  - View all attendance records
  - Edit any attendance (with reason)
  - Create manual attendance entries
  - All edits are logged with:
    - Old status
    - New status
    - Admin who made the change
    - Reason for change
    - Timestamp

- **Employee View**:
  - Monthly calendar view
  - Present/absent days highlighted
  - Timestamp shown for each present day
  - Statistics (total days, present, absent)

### Dispute System
- **Employee Can**:
  - Raise dispute for any date
  - Provide reason
  - Track dispute status (pending/approved/rejected)
  - View admin notes/rejection messages

- **Admin Can**:
  - View all pending disputes
  - Approve with notes
  - Reject with message
  - View dispute history

### Excel Export
- **Full Attendance Export**:
  - Date range filter (from - to)
  - Employee-wise records
  - Includes edit history
  - IST timestamps

- **Summary Export**:
  - Employee-wise summary
  - Total days, present days, absent days
  - Attendance percentage
  - Date range filter

## Database Models

### User Model
```typescript
{
  id: string
  name: string
  email: string
  password: string (hashed)
  role: 'dev' | 'admin' | 'employee'
  createdBy: string (who created this user)
  locked: boolean
  createdAt: number
}
```

### QR Code Session Model
```typescript
{
  id: string
  createdBy: string (admin ID)
  qrCode: string (unique code)
  createdAt: number (IST)
  expiresAt: number (IST)
  active: boolean
  invalidatedAt?: number
  invalidatedBy?: string
}
```

### Attendance Model
```typescript
{
  id: string
  qrCodeId: string
  employeeId: string
  employeeName: string
  timestamp: number (IST)
  status: 'present' | 'absent'
  photo?: string (cloudinary URL)
  markedBy: 'employee' | 'admin'
  editedBy?: string (admin ID)
  editedAt?: number
  originalStatus?: 'present' | 'absent'
}
```

### Attendance Log Model (for tracking edits)
```typescript
{
  id: string
  attendanceId: string
  employeeId: string
  employeeName: string
  date: string (YYYY-MM-DD)
  editedBy: string (admin ID)
  editedByName: string
  oldStatus: 'present' | 'absent'
  newStatus: 'present' | 'absent'
  reason?: string
  timestamp: number (IST)
}
```

### Dispute Model
```typescript
{
  id: string
  attendanceId?: string
  date: string (YYYY-MM-DD)
  employeeId: string
  employeeName: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: number
  resolvedAt?: number
  resolvedBy?: string (admin ID)
  rejectionMessage?: string
  adminNotes?: string
}
```

## API Actions

### Auth Actions (`workplace-auth.ts`)
- `createAdminAction()` - Dev creates admin
- `createEmployeeAction()` - Admin/Dev creates employee
- `toggleUserLockAction()` - Lock/unlock user accounts
- `getAllUsersAction()` - Get all users
- `deleteUserAction()` - Delete user (Dev only)

### QR Management (`qr-management.ts`)
- `generateQRCodeAction()` - Generate new QR with expiry
- `getAllQRCodesAction()` - Get all QR codes with status
- `getActiveQRCodesAction()` - Get only active/valid QR codes
- `invalidateQRCodeAction()` - Manually invalidate QR

### Attendance Actions (`workplace-attendance.ts`)
- `markAttendanceAction()` - Employee marks attendance
- `getMyAttendanceAction()` - Employee views own attendance
- `getMonthlyAttendanceAction()` - Get monthly stats
- `getAllAttendanceAction()` - Admin views all
- `getAttendanceByDateRangeAction()` - Filter by date
- `updateAttendanceAction()` - Admin edits attendance
- `createManualAttendanceAction()` - Admin creates manual entry
- `getEmployeeAttendanceAction()` - Admin views specific employee

### Dispute Actions (`workplace-disputes.ts`)
- `raiseDisputeAction()` - Employee raises dispute
- `getMyDisputesAction()` - Employee views own disputes
- `getAllDisputesAction()` - Admin views all
- `getPendingDisputesAction()` - Admin views pending
- `approveDisputeAction()` - Admin approves
- `rejectDisputeAction()` - Admin rejects

### Logging Actions (`attendance-logs.ts`)
- `getAllLogsAction()` - Admin views all edit logs
- `getEmployeeLogsAction()` - Admin views specific employee logs

### Export Actions (`export-attendance.ts`)
- `exportAttendanceToExcelAction()` - Export full attendance
- `exportEmployeeSummaryAction()` - Export employee summary

## File Structure

### New Files Created
```
lib/
  db-workplace.ts          # New workplace database functions with IST support

app/actions/
  workplace-auth.ts        # User management for workplace
  qr-management.ts         # QR code generation and management
  workplace-attendance.ts  # Attendance marking and viewing
  workplace-disputes.ts    # Dispute management
  attendance-logs.ts       # Edit log viewing
  export-attendance.ts     # Excel export functionality

app/(dashboard)/
  dev/page.tsx            # Dev dashboard
  admin/page.tsx          # Admin dashboard (updated)
  employee/page.tsx       # Employee dashboard

components/workplace/
  employee-workplace-view.tsx    # Employee main view
  admin-workplace-view.tsx       # Admin main view (to be created)
  dev-workplace-view.tsx         # Dev main view (to be created)
  workplace-scanner.tsx          # QR scanner with photo
  employee-attendance-calendar.tsx # Monthly calendar view
  employee-dispute-form.tsx      # Dispute raising form
  admin-qr-management.tsx        # QR code management
  admin-attendance-view.tsx      # Admin attendance view
  admin-dispute-management.tsx   # Admin dispute view
  attendance-logs-view.tsx       # Edit logs view
  excel-export-form.tsx          # Export functionality
```

### Modified Files
```
lib/
  models.ts           # Updated schemas for workplace
  storage.ts          # Updated user functions
  
middleware.ts         # Updated for new roles

app/(dashboard)/
  admin/page.tsx      # Updated to use workplace view
```

### Removed Concepts
- Teacher role - removed
- Student role - renamed to Employee
- Sections - not needed for workplace
- Timetable/TimeSlots - not needed for workplace
- Holidays - removed (can be added back if needed)
- Session locking (48-hour rule) - replaced with QR expiry

## IST Timezone Implementation

All timestamps use Indian Standard Time (IST = UTC+5:30):

```typescript
// Get current IST timestamp
function getISTTimestamp(): number {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.getTime();
}

// Convert timestamp to IST Date
function toISTDate(timestamp: number): Date {
  return new Date(timestamp);
}
```

## Next Steps to Complete

1. **Create remaining UI components**:
   - `admin-workplace-view.tsx` - Full admin interface
   - `dev-workplace-view.tsx` - Dev super admin interface
   - `workplace-scanner.tsx` - QR scanner with camera
   - `employee-attendance-calendar.tsx` - Calendar view
   - `employee-dispute-form.tsx` - Dispute form
   - Other admin components for QR, attendance, disputes, logs

2. **Add Excel export library**:
   ```bash
   npm install xlsx
   ```

3. **Create initial dev user in database**:
   - Use seed script or manual creation
   - First user should be dev role

4. **Update environment variables**:
   - `MONGODB_URI` - MongoDB connection string
   - `CLOUDINARY_*` - For photo storage
   - `JWT_SECRET` - For session tokens

5. **Test the complete flow**:
   - Dev creates admin
   - Admin creates employees
   - Admin generates QR code
   - Employee scans and marks attendance
   - Employee raises dispute
   - Admin resolves dispute
   - Admin edits attendance
   - Admin exports to Excel

## Security Features

- Role-based access control (RBAC)
- JWT session tokens
- Password hashing (bcrypt)
- Account locking capability
- Audit logs for all admin edits
- QR code expiry for security

## Important Notes

1. All times are in IST (Indian Standard Time)
2. One attendance per employee per day
3. All admin edits are logged
4. QR codes can be manually invalidated
5. Photos are required during attendance marking
6. Employees can only see their own data
7. Admins can see all data
8. Dev has full system access
