'use server';

import connectDB from '@/lib/mongodb';
import { OTPModel, UserModel, SettingsModel } from '@/lib/models';
import { sendBulkOTPEmail } from '@/lib/email';
import { getSession } from '@/lib/auth';

// Get IST timestamp
function getISTTimestamp(): number {
    return Date.now() + (5.5 * 60 * 60 * 1000);
}

// Generate 6-digit OTP
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate OTP for entry or exit
export async function generateOTPAction(type: 'entry' | 'exit') {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();
        
        // Get settings for OTP validity and security email
        let settings = await SettingsModel.findOne({ id: 'global' });
        if (!settings) {
            settings = await SettingsModel.create({
                id: 'global',
                entryTimeStart: '09:00',
                entryTimeEnd: '10:00',
                exitTimeStart: '17:00',
                exitTimeEnd: '18:00',
                otpValidityMinutes: 5,
                securityEmail: process.env.EMAIL_USER || 'security@company.com'
            });
        }
        
        const now = getISTTimestamp();
        const otpValidityMinutes = settings.otpValidityMinutes || 5;
        const expiryTime = now + (otpValidityMinutes * 60 * 1000);
        
        // Invalidate all previous OTPs of this type
        await OTPModel.updateMany(
            { type, isActive: true },
            { $set: { isActive: false } }
        );
        
        // Generate new OTP
        const otp = generateOTP();
        const otpId = `otp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await OTPModel.create({
            id: otpId,
            otp,
            type,
            generatedAt: now,
            expiryTime,
            isActive: true,
            employeeId: null // Universal OTP - can be used by any employee
        });
        
        // Send OTP only to security email
        const securityContact = { email: settings.securityEmail, name: 'Security Guard' };
        await sendBulkOTPEmail([securityContact], otp, type);
        
        return { 
            success: true, 
            otp,
            expiryTime,
            validityMinutes: settings.otpValidityMinutes
        };
    } catch (error) {
        console.error('Error generating OTP:', error);
        return { success: false, error: 'Failed to generate OTP' };
    }
}

// Get current active OTP
export async function getCurrentOTPAction(type: 'entry' | 'exit') {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();
        
        const now = getISTTimestamp();
        const activeOTP = await OTPModel.findOne({
            type,
            isActive: true,
            expiryTime: { $gt: now }
        }).lean();
        
        if (!activeOTP) {
            return { success: true, otp: null };
        }
        
        return { 
            success: true, 
            otp: activeOTP.otp,
            expiryTime: activeOTP.expiryTime,
            remainingSeconds: Math.floor((activeOTP.expiryTime - now) / 1000)
        };
    } catch (error) {
        console.error('Error fetching current OTP:', error);
        return { success: false, error: 'Failed to fetch OTP' };
    }
}

// Invalidate OTP manually
export async function invalidateOTPAction(type: 'entry' | 'exit') {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();
        
        await OTPModel.updateMany(
            { type, isActive: true },
            { $set: { isActive: false } }
        );
        
        return { success: true };
    } catch (error) {
        console.error('Error invalidating OTP:', error);
        return { success: false, error: 'Failed to invalidate OTP' };
    }
}

// Verify OTP (for employee use)
export async function verifyOTPAction(otp: string, type: 'entry' | 'exit', employeeId?: string): Promise<{ success: boolean; error?: string }> {
    try {
        await connectDB();
        
        const now = getISTTimestamp();
        
        // Check for universal OTP (admin-generated, employeeId = null)
        let otpRecord = await OTPModel.findOne({
            otp,
            type,
            isActive: true,
            expiryTime: { $gt: now },
            employeeId: null // Universal OTP
        });
        
        // If no universal OTP found and employeeId provided, check for employee-specific OTP
        if (!otpRecord && employeeId) {
            otpRecord = await OTPModel.findOne({
                otp,
                type,
                isActive: true,
                expiryTime: { $gt: now },
                employeeId: employeeId // Employee-specific OTP
            });
        }
        
        if (!otpRecord) {
            return { success: false, error: 'Invalid or expired OTP' };
        }
        
        // If OTP is employee-specific, ensure it matches the requesting employee
        if (otpRecord.employeeId && employeeId && otpRecord.employeeId !== employeeId) {
            return { success: false, error: 'This OTP was generated for a different employee' };
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return { success: false, error: 'Failed to verify OTP' };
    }
}

// Mark OTP as used
export async function markOTPUsedAction(otp: string, employeeId: string) {
    try {
        await connectDB();
        
        await OTPModel.updateOne(
            { otp, isActive: true },
            { 
                $set: { 
                    usedBy: employeeId,
                    usedAt: getISTTimestamp()
                } 
            }
        );
        
        return { success: true };
    } catch (error) {
        console.error('Error marking OTP as used:', error);
        return { success: false, error: 'Failed to mark OTP as used' };
    }
}
