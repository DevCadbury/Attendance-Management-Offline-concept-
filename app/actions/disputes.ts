'use server';

import connectDB from '@/lib/mongodb';
import { DisputeModel, UserModel } from '@/lib/models';
import { getSession } from '@/lib/auth';

// Get IST timestamp
function getISTTimestamp(): number {
    return Date.now() + (5.5 * 60 * 60 * 1000);
}

// Raise dispute (employee only)
export async function raiseDisputeAction(date: string, reason: string, attendanceId?: string) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'employee') {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();
        
        const employee = await UserModel.findOne({ id: session.id });
        if (!employee) {
            return { success: false, error: 'Employee not found' };
        }
        
        // Check if dispute already exists for this date
        const existingDispute = await DisputeModel.findOne({
            employeeId: session.id,
            date,
            status: 'pending'
        });
        
        if (existingDispute) {
            return { success: false, error: 'You already have a pending dispute for this date' };
        }
        
        const disputeId = `dispute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await DisputeModel.create({
            id: disputeId,
            attendanceId,
            date,
            employeeId: session.id,
            employeeName: employee.name,
            reason,
            status: 'pending',
            createdAt: getISTTimestamp()
        });
        
        return { success: true, message: 'Dispute raised successfully. Admin will review it.' };
    } catch (error) {
        console.error('Error raising dispute:', error);
        return { success: false, error: 'Failed to raise dispute' };
    }
}

// Get my disputes (employee only)
export async function getMyDisputesAction() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'employee') {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();
        
        const disputes = await DisputeModel.find({ employeeId: session.id })
            .sort({ createdAt: -1 })
            .lean();
        
        // Remove MongoDB-specific fields
        const serializedDisputes = disputes.map(d => {
            const { _id, __v, ...rest } = d as any;
            return rest;
        });
        
        return { success: true, disputes: serializedDisputes };
    } catch (error) {
        console.error('Error fetching disputes:', error);
        return { success: false, error: 'Failed to fetch disputes' };
    }
}

// Get all disputes (admin only)
export async function getAllDisputesAction(status?: 'pending' | 'approved' | 'rejected') {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();
        
        const query = status ? { status } : {};
        const disputes = await DisputeModel.find(query)
            .sort({ createdAt: -1 })
            .lean();
        
        // Remove MongoDB-specific fields
        const serializedDisputes = disputes.map(d => {
            const { _id, __v, ...rest } = d as any;
            return rest;
        });
        
        return { success: true, disputes: serializedDisputes };
    } catch (error) {
        console.error('Error fetching disputes:', error);
        return { success: false, error: 'Failed to fetch disputes' };
    }
}

// Resolve dispute (admin only)
export async function resolveDisputeAction(
    disputeId: string,
    decision: 'approved' | 'rejected',
    adminNotes?: string,
    rejectionMessage?: string
) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();
        
        const dispute = await DisputeModel.findOne({ id: disputeId });
        if (!dispute) {
            return { success: false, error: 'Dispute not found' };
        }
        
        if (dispute.status !== 'pending') {
            return { success: false, error: 'Dispute already resolved' };
        }
        
        dispute.status = decision;
        dispute.resolvedBy = session.id;
        dispute.resolvedAt = getISTTimestamp();
        
        if (adminNotes) dispute.adminNotes = adminNotes;
        if (rejectionMessage) dispute.rejectionMessage = rejectionMessage;
        
        await dispute.save();
        
        return { success: true, message: `Dispute ${decision} successfully` };
    } catch (error) {
        console.error('Error resolving dispute:', error);
        return { success: false, error: 'Failed to resolve dispute' };
    }
}
