'use server';

import connectDB from '@/lib/mongodb';
import { OTPActivityLogModel } from '@/lib/models';
import { getSession } from '@/lib/auth';

export async function getOTPActivityLogsAction(limit: number = 50) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return { success: false, error: 'Unauthorized. Admin access required.' };
        }

        await connectDB();
        
        const logs = await OTPActivityLogModel.find({})
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();
        
        // Remove MongoDB-specific fields
        const cleanedLogs = logs.map(log => ({
            ...log,
            _id: undefined,
            __v: undefined
        }));
        
        return { success: true, logs: cleanedLogs };
    } catch (error) {
        console.error('Error fetching OTP activity logs:', error);
        return { success: false, error: 'Failed to fetch OTP activity logs' };
    }
}

export async function getOTPActivityLogsByEmployeeAction(employeeId: string, limit: number = 20) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return { success: false, error: 'Unauthorized. Admin access required.' };
        }

        await connectDB();
        
        const logs = await OTPActivityLogModel.find({ employeeId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();
        
        // Remove MongoDB-specific fields
        const cleanedLogs = logs.map(log => ({
            ...log,
            _id: undefined,
            __v: undefined
        }));
        
        return { success: true, logs: cleanedLogs };
    } catch (error) {
        console.error('Error fetching employee OTP activity logs:', error);
        return { success: false, error: 'Failed to fetch employee OTP activity logs' };
    }
}
