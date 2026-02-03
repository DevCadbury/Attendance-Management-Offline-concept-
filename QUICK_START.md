# 🚀 Quick Start - Workplace Attendance System

## 30-Second Setup

```bash
# 1. Install dependencies
npm install

# 2. Create dev user
npx tsx scripts/create-dev-user.ts

# 3. Start server
npm run dev

# 4. Login
# Open http://localhost:3000/login
# Email: dev@company.com
# Password: dev@123
```

## 5-Minute Complete Test

### Step 1: Login as Dev (Super Admin)
- Email: `dev@company.com`
- Password: `dev@123`
- You'll be at `/dev` dashboard

### Step 2: Create an Admin
```
Name: Admin User
Email: admin@company.com
Password: admin123
```

### Step 3: Logout and Login as Admin
- Email: `admin@company.com`
- Password: `admin123`
- You'll be at `/admin` dashboard

### Step 4: Create an Employee
```
Name: John Doe
Email: john@company.com
Password: john123
```

### Step 5: Generate a QR Code
- Click "Generate QR Code"
- Set expiry: 24 hours
- QR Code appears with IST expiry time

### Step 6: Logout and Login as Employee
- Email: `john@company.com`
- Password: `john123`
- You'll be at `/employee` dashboard

### Step 7: Mark Attendance
1. Click "Scan QR" tab
2. Click "Start Camera"
3. Take your photo (selfie)
4. Click "Capture Photo"
5. Scan the QR code (admin should share it)
6. ✅ Attendance Marked!

### Step 8: View Your Attendance
- Go to "My Attendance" tab
- See monthly calendar
- Green days = Present
- See time when you marked attendance

### Step 9: Raise a Dispute
- Go to "Disputes" tab
- Select a date
- Enter reason: "I was present but attendance not marked"
- Submit

### Step 10: Resolve Dispute (as Admin)
- Logout and login as admin
- Go to "Disputes" tab
- See pending dispute
- Approve with note: "Attendance corrected"

### Step 11: View Logs
- As admin, go to "Logs" tab
- See all attendance edits
- Track who changed what and when

## ✅ Done!

You've tested:
- ✅ User creation (dev → admin → employee)
- ✅ QR code generation with expiry
- ✅ Attendance marking with photo
- ✅ Attendance viewing
- ✅ Dispute system
- ✅ Admin resolution

## 🎯 System Features at a Glance

### Dev Can:
- Create admins
- Create employees
- Do everything admins can do
- Delete users
- Cannot be locked

### Admin Can:
- Generate QR codes (with IST expiry)
- Invalidate QR codes manually
- Create employees
- Edit any attendance (logged)
- View all attendance
- Export to Excel
- Approve/reject disputes
- View edit logs
- Cannot create other admins

### Employee Can:
- Scan QR code to mark attendance
- Take photo during scan
- View own attendance monthly
- See present/absent with timestamps
- Raise disputes
- Track dispute status

## 📱 Attendance Flow

```
1. Admin generates QR (24hr expiry, IST)
2. Admin shares QR with employees
3. Employee opens app
4. Employee takes selfie
5. Employee scans QR
6. Attendance marked ✅
7. Recorded with IST timestamp
8. Shows in employee's calendar
9. Admin can view in reports
10. Admin can export to Excel
```

## 🔐 Default Credentials

After running `create-dev-user.ts`:

```
Dev:
  Email: dev@company.com
  Password: dev@123

(Create these yourself):
Admin:
  Email: admin@company.com
  Password: admin123

Employee:
  Email: employee@company.com  
  Password: emp123
```

**⚠️ Change all passwords after first login in production!**

## 📊 Key Concepts

### IST (Indian Standard Time)
All timestamps are in IST (UTC+5:30):
- QR expiry times
- Attendance timestamps
- Edit log times
- Report times

### One Per Day
- Employees can mark attendance once per day (IST)
- Based on IST date, not UTC

### QR Code Expiry
- Admin sets expiry (e.g., 24 hours)
- Expires automatically at that IST time
- Admin can manually invalidate anytime
- Expired/invalidated QRs cannot be used

### Attendance Editing
- Admin can edit any attendance
- All edits are logged:
  - Who edited (admin name)
  - Old status → New status
  - Reason
  - Timestamp
- Cannot be deleted from logs (audit trail)

### Disputes
- Employee raises for any date
- Goes to admin
- Admin approves or rejects
- Employee sees resolution

## 📁 Project Structure

```
app/
  (dashboard)/
    dev/page.tsx          ← Dev dashboard
    admin/page.tsx        ← Admin dashboard
    employee/page.tsx     ← Employee dashboard
  actions/
    workplace-auth.ts     ← User management
    qr-management.ts      ← QR code generation
    workplace-attendance.ts ← Attendance operations
    workplace-disputes.ts ← Dispute handling
    attendance-logs.ts    ← Log viewing
    export-attendance.ts  ← Excel export

components/workplace/
  employee-workplace-view.tsx     ← Employee UI
  admin-workplace-view.tsx        ← Admin UI
  dev-workplace-view.tsx          ← Dev UI
  workplace-scanner.tsx           ← QR scanner
  employee-attendance-calendar.tsx ← Calendar view
  employee-dispute-form.tsx       ← Dispute form

lib/
  models.ts             ← Database schemas
  db-workplace.ts       ← Database operations
  storage.ts            ← User operations
  mongodb.ts            ← MongoDB connection

scripts/
  create-dev-user.ts    ← Create first dev user
  migrate-to-workplace.ts ← Migrate old data
```

## 🛠️ Environment Setup

Create `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/workplace-attendance
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: For photo uploads
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 📖 Documentation

- **IMPLEMENTATION_SUMMARY.md** - What was changed
- **WORKPLACE_SYSTEM_README.md** - Full feature list
- **SETUP_GUIDE.md** - Detailed setup
- **QUICK_START.md** - This file

## 🎉 You're Ready!

The system is fully functional. Core features are complete:
- ✅ Role-based access control
- ✅ QR code generation with IST expiry
- ✅ Photo-based attendance marking
- ✅ Monthly attendance viewing
- ✅ Dispute system
- ✅ Edit logging
- ✅ Excel export (data layer ready)

Now you can:
1. Polish the UI
2. Add more features
3. Customize for your workplace
4. Deploy to production

Happy attendance tracking! 📊
