'use server';

import { getSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { OvertimeRequestModel, AttendanceModel, IOvertimeRequest } from '@/lib/models';

// Create overtime request
export async function createOvertimeRequestAction(data: {
    date: string;
    requestedHours: number;
    reason: string;
}) {
    try {
        const session = await getSession();
        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();

        // Check if employee already has a request for this date
        const existingRequest = await OvertimeRequestModel.findOne({
            employeeId: session.userId,
            date: data.date,
            status: { $in: ['pending', 'approved'] }
        });

        if (existingRequest) {
            return { 
                success: false, 
                error: existingRequest.status === 'approved' 
                    ? 'You already have an approved overtime request for this date'
                    : 'You already have a pending overtime request for this date'
            };
        }

        // Check if attendance already exists for this date
        const existingAttendance = await AttendanceModel.findOne({
            employeeId: session.userId,
            date: data.date
        });

        if (existingAttendance?.exitTime) {
            return { success: false, error: 'Attendance already marked for this date. Cannot request overtime.' };
        }

        const overtimeRequest: IOvertimeRequest = {
            id: `ot-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            employeeId: session.userId,
            employeeName: session.userName,
            date: data.date,
            requestedHours: data.requestedHours,
            reason: data.reason,
            status: 'pending',
            requestedAt: Date.now()
        };

        await OvertimeRequestModel.create(overtimeRequest);

        return { success: true, data: overtimeRequest };
    } catch (error) {
        console.error('Error creating overtime request:', error);
        return { success: false, error: 'Failed to create overtime request' };
    }
}

// Get overtime requests (employee: their own, admin: all)
export async function getOvertimeRequestsAction(filters?: {
    employeeId?: string;
    status?: 'pending' | 'approved' | 'rejected';
    startDate?: string;
    endDate?: string;
}) {
    try {
        const session = await getSession();
        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();

        const query: any = {};

        // If employee, only show their own requests
        if (session.role === 'employee') {
            query.employeeId = session.userId;
        } else if (filters?.employeeId) {
            query.employeeId = filters.employeeId;
        }

        if (filters?.status) {
            query.status = filters.status;
        }

        if (filters?.startDate || filters?.endDate) {
            query.date = {};
            if (filters.startDate) query.date.$gte = filters.startDate;
            if (filters.endDate) query.date.$lte = filters.endDate;
        }

        const requests = await OvertimeRequestModel.find(query).sort({ requestedAt: -1 }).lean();

        return { success: true, data: requests };
    } catch (error) {
        console.error('Error fetching overtime requests:', error);
        return { success: false, error: 'Failed to fetch overtime requests' };
    }
}

// Approve overtime request (admin only)
export async function approveOvertimeRequestAction(requestId: string) {
    try {
        const session = await getSession();
        if (!session || (session.role !== 'admin' && session.role !== 'dev')) {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();

        const request = await OvertimeRequestModel.findOne({ id: requestId });
        if (!request) {
            return { success: false, error: 'Overtime request not found' };
        }

        if (request.status !== 'pending') {
            return { success: false, error: 'Request has already been processed' };
        }

        request.status = 'approved';
        request.approvedBy = session.userId;
        request.approvedAt = Date.now();

        await request.save();

        return { success: true, data: request.toObject() };
    } catch (error) {
        console.error('Error approving overtime request:', error);
        return { success: false, error: 'Failed to approve overtime request' };
    }
}

// Reject overtime request (admin only)
export async function rejectOvertimeRequestAction(requestId: string, rejectionReason: string) {
    try {
        const session = await getSession();
        if (!session || (session.role !== 'admin' && session.role !== 'dev')) {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();

        const request = await OvertimeRequestModel.findOne({ id: requestId });
        if (!request) {
            return { success: false, error: 'Overtime request not found' };
        }

        if (request.status !== 'pending') {
            return { success: false, error: 'Request has already been processed' };
        }

        request.status = 'rejected';
        request.rejectedBy = session.userId;
        request.rejectedAt = Date.now();
        request.rejectionReason = rejectionReason;

        await request.save();

        return { success: true, data: request.toObject() };
    } catch (error) {
        console.error('Error rejecting overtime request:', error);
        return { success: false, error: 'Failed to reject overtime request' };
    }
}

// Extend overtime request (employee can update their pending request)
export async function extendOvertimeRequestAction(requestId: string, newRequestedHours: number, newReason?: string) {
    try {
        const session = await getSession();
        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();

        const request = await OvertimeRequestModel.findOne({ id: requestId });
        if (!request) {
            return { success: false, error: 'Overtime request not found' };
        }

        // Employees can only extend their own pending requests
        if (session.role === 'employee' && request.employeeId !== session.userId) {
            return { success: false, error: 'Unauthorized' };
        }

        if (request.status !== 'pending') {
            return { success: false, error: 'Can only extend pending requests' };
        }

        request.requestedHours = newRequestedHours;
        if (newReason) {
            request.reason = newReason;
        }

        await request.save();

        return { success: true, data: request.toObject() };
    } catch (error) {
        console.error('Error extending overtime request:', error);
        return { success: false, error: 'Failed to extend overtime request' };
    }
}

// Cancel overtime request (employee can cancel their own pending request)
export async function cancelOvertimeRequestAction(requestId: string) {
    try {
        const session = await getSession();
        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();

        const request = await OvertimeRequestModel.findOne({ id: requestId });
        if (!request) {
            return { success: false, error: 'Overtime request not found' };
        }

        // Employees can only cancel their own pending requests
        if (session.role === 'employee' && request.employeeId !== session.userId) {
            return { success: false, error: 'Unauthorized' };
        }

        if (request.status !== 'pending') {
            return { success: false, error: 'Can only cancel pending requests' };
        }

        // Delete the request
        await OvertimeRequestModel.deleteOne({ id: requestId });

        return { success: true };
    } catch (error) {
        console.error('Error canceling overtime request:', error);
        return { success: false, error: 'Failed to cancel overtime request' };
    }
}
