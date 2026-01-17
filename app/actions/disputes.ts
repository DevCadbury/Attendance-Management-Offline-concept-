'use server';

import {
    getDisputes,
    saveDispute,
    getStudentDisputes,
    getPendingDisputes,
    getSessions,
    saveSession,
    getSettings,
    Dispute
} from '@/lib/db';
import { notifySessionUnlocked } from '@/lib/notifications';
import { revalidatePath } from 'next/cache';

// Student raises a dispute
export async function raiseDisputeAction(sessionId: string, studentId: string, studentName: string, reason: string) {
    try {
        // Check if dispute already exists for this session and student
        const disputes = await getDisputes();
        const existing = disputes.find(d => d.sessionId === sessionId && d.studentId === studentId);
        
        if (existing) {
            return { success: false, error: 'Dispute already raised for this session' };
        }

        const newDispute: Dispute = {
            id: Math.random().toString(36).substring(7),
            sessionId,
            studentId,
            studentName,
            reason,
            status: 'pending',
            createdAt: Date.now()
        };

        await saveDispute(newDispute);
        
        // Keep the session unlocked for 2 days (grace period) from now
        const sessions = await getSessions();
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
            session.unlockedByAdmin = true;
            // Extend lock to 2 days from now
            session.lockUntil = Date.now() + (2 * 24 * 60 * 60 * 1000);
            await saveSession(session);
        }

        revalidatePath('/student');
        revalidatePath('/admin');
        revalidatePath('/teacher');
        return { success: true, message: 'Dispute raised successfully. Your attendance is unlocked for 2 days.' };
    } catch (error) {
        return { success: false, error: 'Failed to raise dispute' };
    }
}

// Admin approves dispute
export async function approveDisputeAction(disputeId: string, adminId: string) {
    try {
        const disputes = await getDisputes();
        const dispute = disputes.find(d => d.id === disputeId);
        
        if (!dispute) {
            return { success: false, error: 'Dispute not found' };
        }

        dispute.status = 'approved';
        dispute.resolvedAt = Date.now();
        dispute.resolvedBy = adminId;

        await saveDispute(dispute);

        // Keep session unlocked for teacher to edit
        const sessions = await getSessions();
        const session = sessions.find(s => s.id === dispute.sessionId);
        if (session) {
            session.unlockedByAdmin = true;
            await saveSession(session);
            
            // Notify teacher about unlocked session
            if (session.subject) {
                await notifySessionUnlocked(session.teacherId, session.id, session.subject);
            }
        }

        revalidatePath('/admin');
        revalidatePath('/teacher');
        return { success: true, message: 'Dispute approved. Teacher notified and session unlocked.' };
    } catch (error) {
        return { success: false, error: 'Failed to approve dispute' };
    }
}

// Admin rejects dispute
export async function rejectDisputeAction(disputeId: string, adminId: string) {
    try {
        const disputes = await getDisputes();
        const dispute = disputes.find(d => d.id === disputeId);
        
        if (!dispute) {
            return { success: false, error: 'Dispute not found' };
        }

        dispute.status = 'rejected';
        dispute.resolvedAt = Date.now();
        dispute.resolvedBy = adminId;

        await saveDispute(dispute);
        revalidatePath('/admin');
        return { success: true, message: 'Dispute rejected.' };
    } catch (error) {
        return { success: false, error: 'Failed to reject dispute' };
    }
}

// Admin manually unlocks session for teacher editing
export async function unlockSessionForEditingAction(sessionId: string) {
    try {
        const sessions = await getSessions();
        const session = sessions.find(s => s.id === sessionId);
        
        if (!session) {
            return { success: false, error: 'Session not found' };
        }

        session.unlockedByAdmin = true;
        await saveSession(session);

        revalidatePath('/admin');
        revalidatePath('/teacher');
        return { success: true, message: 'Session unlocked for teacher editing' };
    } catch (error) {
        return { success: false, error: 'Failed to unlock session' };
    }
}

// Admin locks session (removes unlock)
export async function lockSessionAction(sessionId: string) {
    try {
        const sessions = await getSessions();
        const session = sessions.find(s => s.id === sessionId);
        
        if (!session) {
            return { success: false, error: 'Session not found' };
        }

        session.unlockedByAdmin = false;
        await saveSession(session);

        revalidatePath('/admin');
        revalidatePath('/teacher');
        return { success: true, message: 'Session locked' };
    } catch (error) {
        return { success: false, error: 'Failed to lock session' };
    }
}

// Get all disputes
export async function getDisputesAction() {
    return await getDisputes();
}

// Get disputes for a student
export async function getStudentDisputesAction(studentId: string) {
    return await getStudentDisputes(studentId);
}

// Get pending disputes for admin
export async function getPendingDisputesAction() {
    return await getPendingDisputes();
}

// Teacher approves dispute (auto-approve when marked present)
export async function teacherApproveDisputeAction(disputeId: string, teacherId: string) {
    try {
        const disputes = await getDisputes();
        const dispute = disputes.find(d => d.id === disputeId);
        
        if (!dispute) {
            return { success: false, error: 'Dispute not found' };
        }

        dispute.status = 'approved';
        dispute.resolvedAt = Date.now();
        dispute.resolvedBy = teacherId;

        await saveDispute(dispute);

        revalidatePath('/student');
        revalidatePath('/teacher');
        return { success: true, message: 'Dispute approved.' };
    } catch (error) {
        return { success: false, error: 'Failed to approve dispute' };
    }
}

// Teacher rejects dispute with message
export async function teacherRejectDisputeAction(disputeId: string, teacherId: string, message: string) {
    try {
        const disputes = await getDisputes();
        const dispute = disputes.find(d => d.id === disputeId);
        
        if (!dispute) {
            return { success: false, error: 'Dispute not found' };
        }

        dispute.status = 'rejected';
        dispute.resolvedAt = Date.now();
        dispute.resolvedBy = teacherId;
        dispute.rejectionMessage = message;

        await saveDispute(dispute);

        revalidatePath('/student');
        revalidatePath('/teacher');
        return { success: true, message: 'Dispute rejected.' };
    } catch (error) {
        return { success: false, error: 'Failed to reject dispute' };
    }
}

// Check and clean up expired disputes (after 2 days grace period)
export async function cleanupExpiredDisputesAction() {
    try {
        const settings = await getSettings();
        const disputes = await getDisputes();
        const sessions = await getSessions();
        const now = Date.now();

        for (const dispute of disputes) {
            if (dispute.status === 'pending') {
                const elapsedTime = now - dispute.createdAt;
                
                // If grace period expired, auto-reject and lock session
                if (elapsedTime > settings.disputeGracePeriod) {
                    dispute.status = 'rejected';
                    dispute.resolvedAt = now;
                    dispute.resolvedBy = 'system';
                    await saveDispute(dispute);

                    // Lock the session
                    const session = sessions.find(s => s.id === dispute.sessionId);
                    if (session) {
                        session.unlockedByAdmin = false;
                        await saveSession(session);
                    }
                }
            }
        }

        revalidatePath('/admin');
        revalidatePath('/student');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to cleanup disputes' };
    }
}
