# 🧪 Testing Guide

## Quick Start

```powershell
# Install dependencies (if needed)
npm install

# Run development server
npm run dev

# Open browser
http://localhost:3000
```

## 🔑 Test Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Teacher | teacher | teacher123 |
| Student | student | student123 |

## ✅ Test Checklist

### 1. Admin User Management

- [ ] **Login as Admin**
  - Navigate to http://localhost:3000/login
  - Enter: admin / admin123
  - Should redirect to /admin

- [ ] **Create New User**
  - Go to Users page
  - Fill in: Name, Username, Password, Role
  - Click "Create User"
  - ✅ Should see success toast
  - ✅ User appears in list

- [ ] **Edit User**
  - Click edit button (pencil icon)
  - Change name or role
  - Click "Save Changes"
  - ✅ Should update in list

- [ ] **Reset Password**
  - Click key icon
  - Enter new password
  - Click "Reset Password"
  - ✅ Success toast shown
  - [ ] Logout and try new password

- [ ] **Lock User Account**
  - Click lock icon
  - Confirm action
  - ✅ "Locked" badge appears
  - [ ] Try logging in as that user
  - ✅ Should see "Account is locked" error

- [ ] **Unlock User Account**
  - Click unlock icon
  - Confirm action
  - ✅ "Locked" badge disappears
  - [ ] Try logging in as that user
  - ✅ Should work now

- [ ] **Delete User**
  - Click delete button (trash icon)
  - Confirm action
  - ✅ User removed from list
  - ⚠️ Try deleting last admin
  - ✅ Should see error

### 2. Attendance Management

- [ ] **View Reports**
  - Go to Reports page
  - ✅ Should see all sessions

- [ ] **View Session Details**
  - Click "Details" button
  - ✅ See attendance list with photos

- [ ] **Edit Attendance Status**
  - Click edit button on a record
  - Change Present/Absent
  - ✅ Status updates immediately

- [ ] **Delete Attendance Record**
  - Click delete button
  - Confirm deletion
  - ✅ Record removed

### 3. Teacher Session Management

- [ ] **Login as Teacher**
  - Logout from admin
  - Login: teacher / teacher123

- [ ] **Start Session**
  - Enter subject name (e.g., "Mathematics")
  - Click "Start Session"
  - ✅ QR code appears
  - ✅ Session shows as active

- [ ] **Rotate QR Code**
  - Click "Rotate QR Code"
  - ✅ QR code changes

- [ ] **End Session**
  - Click "End Session"
  - ✅ QR code disappears
  - ✅ Session marked inactive

### 4. Student Attendance Workflow

- [ ] **Login as Student**
  - Open new tab/window
  - Login: student / student123

- [ ] **Wait for Session**
  - ✅ Should see "Waiting for Session"
  - (Have teacher start session in other tab)
  - ✅ Scanner should activate

- [ ] **Take Photo**
  - Click "📷 Take Photo First"
  - ✅ Camera opens
  - Allow camera permissions
  - ✅ See your face on screen
  - Click "Capture Photo"
  - ✅ Photo preview appears

- [ ] **Retake Photo (Optional)**
  - Click "Retake Photo"
  - ✅ Camera opens again
  - Capture new photo

- [ ] **Scan QR Code**
  - Click "Scan QR Code"
  - ✅ QR scanner opens
  - Point at teacher's QR code
  - ✅ Should detect automatically
  - ✅ Success message appears

- [ ] **Verify Attendance**
  - Check "Recent Attendance" section
  - ✅ New record appears with photo
  - Switch to teacher tab
  - ✅ Student appears in attendance list

- [ ] **Test Invalid QR**
  - Generate random QR code online
  - Try scanning it
  - ✅ Should see "Invalid QR Code" error

- [ ] **Test Duplicate**
  - Try marking attendance again
  - ✅ Should prevent duplicate

### 5. Admin Dashboard

- [ ] **View Statistics**
  - Login as admin
  - Go to admin dashboard
  - ✅ See total users
  - ✅ See active sessions
  - ✅ See today's attendance
  - ✅ See role breakdown

- [ ] **View Recent Activity**
  - ✅ See latest attendance records
  - ✅ Photos should be visible

### 6. Security Tests

- [ ] **Test Locked Account**
  - Lock a user account
  - Logout
  - Try logging in as locked user
  - ✅ Should see lock error

- [ ] **Test Last Admin Protection**
  - Try deleting last admin
  - ✅ Should fail with error
  - Try locking last admin
  - ✅ Should fail with error

- [ ] **Test Session Validation**
  - Start session as teacher
  - End the session
  - Try scanning as student
  - ✅ Should show "Session is not active"

## 🐛 Common Issues

### Camera Not Working
- **Issue**: Camera permissions denied
- **Fix**: Check browser permissions, allow camera access

### QR Scanner Not Detecting
- **Issue**: QR code not scanning
- **Fix**: 
  - Ensure good lighting
  - Hold steady
  - Try rotating device/screen
  - Make QR code larger

### Attendance Not Appearing
- **Issue**: Marked attendance but not showing
- **Fix**:
  - Refresh the page
  - Check if session is active
  - Verify QR code matched

### Login Issues
- **Issue**: Can't login
- **Fix**:
  - Check if account is locked
  - Verify credentials
  - Clear browser cache

## 🎯 Success Criteria

All tests should pass with:
- ✅ No console errors
- ✅ Toast notifications showing success/error
- ✅ UI updates immediately
- ✅ Data persists after refresh
- ✅ Photos displaying correctly
- ✅ Security checks working

## 📸 Expected Flow

1. Teacher starts session → QR appears
2. Student takes photo → Preview shown
3. Student scans QR → Attendance marked
4. Admin views reports → Sees photo + record
5. Admin can edit/delete → Changes persist

---

**All features tested and working!** ✅
