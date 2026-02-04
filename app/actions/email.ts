'use server';

import connectDB from '@/lib/mongodb';
import { SettingsModel, AttendanceLogModel, UserModel, OTPModel, OTPActivityLogModel } from '@/lib/models';
import { sendOTPRequestEmail, sendOTPVerificationEmail, sendTestEmail } from '@/lib/email';
import { getSession } from '@/lib/auth';

// Get IST timestamp
function getISTTimestamp(): number {
    return Date.now() + (5.5 * 60 * 60 * 1000);
}

// Employee requests OTP from security guard
export async function requestOTPAction(type: 'entry' | 'exit') {
    try {
        const session = await getSession();
        if (!session || session.role !== 'employee') {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();
        
        // Get settings
        const settings = await SettingsModel.findOne({ id: 'global' });
        const securityEmail = settings?.securityEmail;
        const notificationsEnabled = settings?.securityNotificationsEnabled !== false;
        
        if (!securityEmail || !securityEmail.includes('@')) {
            return { success: false, error: 'Security email not configured. Please contact admin.' };
        }
        
        if (!notificationsEnabled) {
            return { success: false, error: 'Security notifications are currently disabled. Please contact admin.' };
        }
        
        // Get employee profile picture
        const user = await UserModel.findOne({ id: session.id });
        const profilePicture = user?.profilePictureUrl;
        
        // Get current OTP for this type
        const now = getISTTimestamp();
        
        // First, check for a universal OTP (admin-generated, employeeId = null)
        let currentOTP = await OTPModel.findOne({
            type,
            isActive: true,
            expiryTime: { $gt: now },
            employeeId: null // Universal OTP
        });
        
        // If no universal OTP, check for employee-specific OTP
        if (!currentOTP) {
            currentOTP = await OTPModel.findOne({
                type,
                isActive: true,
                expiryTime: { $gt: now },
                employeeId: session.id
            });
        }
        
        // If no OTP exists, generate a new employee-specific OTP
        if (!currentOTP) {
            const otpValidityMinutes = settings?.otpValidityMinutes || 5;
            const expiryTime = now + (otpValidityMinutes * 60 * 1000);
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpId = `otp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            currentOTP = await OTPModel.create({
                id: otpId,
                otp,
                type,
                generatedAt: now,
                expiryTime,
                isActive: true,
                employeeId: session.id // Employee-specific
            });
        }
        
        console.log('Sending OTP request to security email:', securityEmail);
        console.log('Current OTP:', currentOTP.otp);
        console.log('OTP Type:', currentOTP.employeeId ? 'Employee-specific' : 'Universal');
        console.log('Profile picture URL:', profilePicture);
        
        // Send notification to security guard with the OTP
        const result = await sendOTPRequestEmail(
            securityEmail,
            session.name || 'Unknown',
            session.email || '',
            profilePicture,
            currentOTP.otp,
            type
        );
        
        // Log the OTP request activity
        const activityLogId = `otp_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await OTPActivityLogModel.create({
            id: activityLogId,
            employeeId: session.id,
            employeeName: session.name || 'Unknown',
            employeeEmail: session.email || '',
            profilePictureUrl: profilePicture,
            action: 'request',
            type,
            otpCode: currentOTP.otp,
            timestamp: getISTTimestamp(),
            success: result.success,
            errorMessage: result.success ? undefined : 'Failed to send email to security guard'
        });
        
        if (!result.success) {
            return { success: false, error: 'Failed to send OTP request' };
        }
        
        return { 
            success: true, 
            message: 'OTP request sent to security guard. Please ask them for the code.'
        };
    } catch (error) {
        console.error('Error requesting OTP:', error);
        return { success: false, error: 'Failed to request OTP' };
    }
}

// Admin sends test email
export async function sendTestEmailAction(email: string) {
    try {
        const session = await getSession();
        if (!session || (session.role !== 'admin' && session.role !== 'dev')) {
            return { success: false, error: 'Unauthorized' };
        }

        const result = await sendTestEmail(email);
        
        if (result.success) {
            return { success: true, message: `Test email sent to ${email}` };
        } else {
            return { success: false, error: result.error || 'Failed to send test email' };
        }
    } catch (error) {
        console.error('Error sending test email:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to send test email' };
    }
}
