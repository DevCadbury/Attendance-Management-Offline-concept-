'use server';

import connectDB from '@/lib/mongodb';
import { AttendanceModel, AttendanceLogModel, UserModel, SettingsModel, OTPActivityLogModel } from '@/lib/models';
import { getSession } from '@/lib/auth';
import { verifyOTPAction, markOTPUsedAction } from './otp-management';
import { sendOTPVerificationEmail } from '@/lib/email';

// Get IST timestamp
function getISTTimestamp(): number {
    return Date.now() + (5.5 * 60 * 60 * 1000);
}

// Get date string in IST (YYYY-MM-DD)
function getISTDateString(timestamp?: number): string {
    const date = new Date(timestamp || getISTTimestamp());
    return date.toISOString().split('T')[0];
}

// Check if current time is within allowed window
async function isWithinTimeWindow(type: 'entry' | 'exit'): Promise<{ allowed: boolean; message?: string }> {
    await connectDB();
    
    let settings = await SettingsModel.findOne({ id: 'global' });
    if (!settings) {
        settings = await SettingsModel.create({
            id: 'global',
            entryTimeStart: '09:00',
            entryTimeEnd: '10:00',
            exitTimeStart: '17:00',
            exitTimeEnd: '18:00',
            otpValidityMinutes: 5,
            securityEmail: '',
            securityNotificationsEnabled: true
        });
    }
    
    const now = new Date(getISTTimestamp());
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    
    const startTime = type === 'entry' ? settings.entryTimeStart : settings.exitTimeStart;
    const endTime = type === 'entry' ? settings.entryTimeEnd : settings.exitTimeEnd;
    
    if (currentTime < startTime || currentTime > endTime) {
        return { 
            allowed: false, 
            message: `${type === 'entry' ? 'Entry' : 'Exit'} time is between ${startTime} and ${endTime}. Current time: ${currentTime}` 
        };
    }
    
    return { allowed: true };
}

// Mark attendance (entry or exit)
export async function markAttendanceAction(
    otp: string, 
    type: 'entry' | 'exit',
    location?: { latitude: number; longitude: number; address?: string }
) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'employee') {
            return { success: false, error: 'Unauthorized. Only employees can mark attendance.' };
        }

        // Check time window
        const timeCheck = await isWithinTimeWindow(type);
        if (!timeCheck.allowed) {
            return { success: false, error: timeCheck.message };
        }

        // Verify OTP
        const otpVerification = await verifyOTPAction(otp, type, session.id);
        
        // Log OTP validation attempt
        const employee = await UserModel.findOne({ id: session.id });
        if (employee) {
            const activityLogId = `otp_log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await OTPActivityLogModel.create({
                id: activityLogId,
                employeeId: session.id,
                employeeName: employee.name,
                employeeEmail: employee.email,
                profilePictureUrl: employee.profilePictureUrl,
                action: 'validate',
                type,
                otpCode: otp,
                timestamp: getISTTimestamp(),
                success: otpVerification.success,
                errorMessage: otpVerification.error,
                location
            });
        }
        
        if (!otpVerification.success) {
            return { success: false, error: otpVerification.error };
        }

        await connectDB();
        
        if (!employee) {
            return { success: false, error: 'Employee not found' };
        }
        
        const today = getISTDateString();
        const now = getISTTimestamp();
        
        // Find or create attendance record for today
        let attendance = await AttendanceModel.findOne({
            employeeId: session.id,
            date: today
        });
        
        if (!attendance) {
            // Create new attendance record
            if (type === 'exit') {
                return { success: false, error: 'Cannot mark exit without entry. Please mark entry first.' };
            }
            
            const attendanceId = `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            attendance = await AttendanceModel.create({
                id: attendanceId,
                employeeId: session.id,
                employeeName: employee.name,
                date: today,
                entryTime: now,
                entryLocation: location,
                status: 'incomplete',
                markedBy: 'employee'
            });
            
            // Create log entry
            const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await AttendanceLogModel.create({
                id: logId,
                attendanceId: attendance.id,
                employeeId: session.id,
                employeeName: employee.name,
                date: today,
                action: 'entry',
                timestamp: now,
                location,
                otpUsed: otp
            });
            
            // Mark OTP as used
            await markOTPUsedAction(otp, session.id);
            
            // Send verification email to security guard if notifications enabled
            const settings = await SettingsModel.findOne({ id: 'global' });
            if (settings?.securityNotificationsEnabled && settings?.securityEmail) {
                await sendOTPVerificationEmail(
                    settings.securityEmail,
                    employee.name,
                    employee.email,
                    employee.profilePictureUrl,
                    'entry'
                ).catch(err => console.error('Failed to send verification email:', err));
            }
            
            return { success: true, message: 'Entry marked successfully', status: 'incomplete' };
        } else {
            // Update existing attendance
            if (type === 'entry') {
                if (attendance.entryTime) {
                    return { success: false, error: 'Entry already marked for today' };
                }
                
                attendance.entryTime = now;
                attendance.entryLocation = location;
                await attendance.save();
                
                // Create log entry
                const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                await AttendanceLogModel.create({
                    id: logId,
                    attendanceId: attendance.id,
                    employeeId: session.id,
                    employeeName: employee.name,
                    date: today,
                    action: 'entry',
                    timestamp: now,
                    location,
                    otpUsed: otp
                });
                
                // Mark OTP as used
                await markOTPUsedAction(otp, session.id);
                
                return { success: true, message: 'Entry marked successfully', status: 'incomplete' };
            } else {
                // Exit marking
                if (!attendance.entryTime) {
                    return { success: false, error: 'Cannot mark exit without entry. Please mark entry first.' };
                }
                
                if (attendance.exitTime) {
                    return { success: false, error: 'Exit already marked for today' };
                }
                
                attendance.exitTime = now;
                attendance.exitLocation = location;
                attendance.status = 'present'; // Both entry and exit marked = present
                await attendance.save();
                
                // Create log entry
                const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                await AttendanceLogModel.create({
                    id: logId,
                    attendanceId: attendance.id,
                    employeeId: session.id,
                    employeeName: employee.name,
                    date: today,
                    action: 'exit',
                    timestamp: now,
                    location,
                    otpUsed: otp
                });
                
                // Mark OTP as used
                await markOTPUsedAction(otp, session.id);
                
                // Send verification email to security guard if notifications enabled
                const settings = await SettingsModel.findOne({ id: 'global' });
                if (settings?.securityNotificationsEnabled && settings?.securityEmail) {
                    await sendOTPVerificationEmail(
                        settings.securityEmail,
                        employee.name,
                        employee.email,
                        employee.profilePictureUrl,
                        'exit'
                    ).catch(err => console.error('Failed to send verification email:', err));
                }
                
                return { success: true, message: 'Exit marked successfully. Attendance complete!', status: 'present' };
            }
        }
    } catch (error) {
        console.error('Error marking attendance:', error);
        return { success: false, error: 'Failed to mark attendance' };
    }
}

// Get employee's own attendance
export async function getMyAttendanceAction(month?: string, year?: string) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'employee') {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();
        
        // If no month/year specified, use current IST month
        const now = new Date(getISTTimestamp());
        const targetMonth = month || (now.getMonth() + 1).toString().padStart(2, '0');
        const targetYear = year || now.getFullYear().toString();
        
        // Get all attendance for the specified month
        const startDate = `${targetYear}-${targetMonth}-01`;
        const endDate = `${targetYear}-${targetMonth}-31`;
        
        const attendance = await AttendanceModel.find({
            employeeId: session.id,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 }).lean();
        
        // Remove MongoDB-specific fields
        const serializedAttendance = attendance.map(a => {
            const { _id, __v, ...rest } = a as any;
            return rest;
        });
        
        return { success: true, attendance: serializedAttendance };
    } catch (error) {
        console.error('Error fetching attendance:', error);
        return { success: false, error: 'Failed to fetch attendance' };
    }
}

// Get today's attendance status
export async function getTodayAttendanceAction() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'employee') {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();
        
        const today = getISTDateString();
        const attendance = await AttendanceModel.findOne({
            employeeId: session.id,
            date: today
        }).lean();
        
        if (!attendance) {
            return { success: true, attendance: null };
        }
        
        // Remove MongoDB-specific fields
        const { _id, __v, ...serializedAttendance } = attendance as any;
        
        return { success: true, attendance: serializedAttendance };
    } catch (error) {
        console.error('Error fetching today\'s attendance:', error);
        return { success: false, error: 'Failed to fetch attendance' };
    }
}

// Get all attendance (admin only)
export async function getAllAttendanceAction(filters?: { 
    employeeId?: string; 
    startDate?: string; 
    endDate?: string;
    status?: 'incomplete' | 'present' | 'absent';
}) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();
        
        const query: any = {};
        
        if (filters?.employeeId) {
            query.employeeId = filters.employeeId;
        }
        
        if (filters?.startDate || filters?.endDate) {
            query.date = {};
            if (filters.startDate) query.date.$gte = filters.startDate;
            if (filters.endDate) query.date.$lte = filters.endDate;
        }
        
        if (filters?.status) {
            query.status = filters.status;
        }
        
        const attendance = await AttendanceModel.find(query)
            .sort({ date: -1, employeeName: 1 })
            .lean();
        
        // Remove MongoDB-specific fields
        const serializedAttendance = attendance.map(a => {
            const { _id, __v, ...rest } = a as any;
            return rest;
        });
        
        return { success: true, attendance: serializedAttendance };
    } catch (error) {
        console.error('Error fetching all attendance:', error);
        return { success: false, error: 'Failed to fetch attendance' };
    }
}

// Update attendance manually (admin only)
export async function updateAttendanceAction(
    attendanceId: string,
    updates: {
        status?: 'incomplete' | 'present' | 'absent';
        entryTime?: number;
        exitTime?: number;
    },
    reason?: string
) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();
        
        const admin = await UserModel.findOne({ id: session.id });
        if (!admin) {
            return { success: false, error: 'Admin not found' };
        }
        
        const attendance = await AttendanceModel.findOne({ id: attendanceId });
        if (!attendance) {
            return { success: false, error: 'Attendance record not found' };
        }
        
        // Update attendance
        if (updates.status !== undefined) attendance.status = updates.status;
        if (updates.entryTime !== undefined) attendance.entryTime = updates.entryTime;
        if (updates.exitTime !== undefined) attendance.exitTime = updates.exitTime;
        
        attendance.editedBy = session.id;
        attendance.editedAt = getISTTimestamp();
        
        await attendance.save();
        
        // Create log entry
        const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AttendanceLogModel.create({
            id: logId,
            attendanceId: attendance.id,
            employeeId: attendance.employeeId,
            employeeName: attendance.employeeName,
            date: attendance.date,
            action: 'edited',
            timestamp: getISTTimestamp(),
            editedBy: session.id,
            editedByName: admin.name,
            reason
        });
        
        return { success: true, message: 'Attendance updated successfully' };
    } catch (error) {
        console.error('Error updating attendance:', error);
        return { success: false, error: 'Failed to update attendance' };
    }
}

// Get attendance logs (admin only)
export async function getAttendanceLogsAction(filters?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
}) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();
        
        const query: any = {};
        
        if (filters?.employeeId) {
            query.employeeId = filters.employeeId;
        }
        
        if (filters?.startDate || filters?.endDate) {
            query.date = {};
            if (filters.startDate) query.date.$gte = filters.startDate;
            if (filters.endDate) query.date.$lte = filters.endDate;
        }
        
        const logs = await AttendanceLogModel.find(query)
            .sort({ timestamp: -1 })
            .lean();
        
        // Remove MongoDB-specific fields
        const serializedLogs = logs.map(l => {
            const { _id, __v, ...rest } = l as any;
            return rest;
        });
        
        return { success: true, logs: serializedLogs };
    } catch (error) {
        console.error('Error fetching attendance logs:', error);
        return { success: false, error: 'Failed to fetch logs' };
    }
}
