'use server';

import {
    getSessions,
    saveSession,
    getSessionById,
    updateSession,
    getAttendance as getAttendanceRecords,
    getAttendanceBySession,
    saveAttendance,
    updateAttendanceRecord,
    deleteAttendanceRecord,
    canEditAttendance,
    getActiveSession,
    Session,
    Attendance
} from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function startSessionAction(
    subject: string, 
    teacherId: string, 
    sectionId: string,
    slotId?: string
) {
    // Check for existing session for this slot today to prevent duplicates
    if (slotId) {
        const allSessions = await getSessions();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existingSlotSession = allSessions.find(s => 
            s.slotId === slotId && 
            s.teacherId === teacherId &&
            s.startTime >= today.getTime()
        );
        
        if (existingSlotSession) {
            // Session already exists, return it so UI can navigate to it
            return { 
                success: true, 
                session: existingSlotSession,
                alreadyExists: true
            };
        }
    }

    // End any existing active session for this teacher
    const existingSession = await getActiveSession(teacherId);
    if (existingSession) {
        existingSession.active = false;
        existingSession.endTime = Date.now();
        // Don't auto-lock old sessions when starting new ones
        // The 48-hour rule in getAllSessionsAction will handle locking
        await saveSession(existingSession);
    }

    const newSession: Session = {
        id: Math.random().toString(36).substring(7),
        subject,
        teacherId,
        sectionId,
        slotId,
        startTime: Date.now(),
        active: true,
        qrCode: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        locked: false,
        unlockedByAdmin: false
    };

    await saveSession(newSession);
    revalidatePath('/teacher');
    revalidatePath('/student');
    return { success: true, session: newSession };
}

export async function endSessionAction(sessionId: string) {
    const sessions = await getSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
        session.active = false;
        session.endTime = Date.now();
        // Don't auto-lock immediately when session ends
        // Teacher needs time to make manual corrections
        // Will auto-lock after 48 hours
        await saveSession(session);
        revalidatePath('/teacher');
        revalidatePath('/student');
        return { success: true };
    }
    return { success: false, error: 'Session not found' };
}

export async function markAttendanceAction(
    sessionId: string,
    studentId: string,
    studentName: string,
    photo?: string,
    markedBy: 'student' | 'teacher' = 'student'
) {
    const sessions = await getSessions();
    const session = sessions.find(s => s.id === sessionId);

    if (!session || !session.active) {
        return { success: false, error: 'Session is not active' };
    }

    const record: Attendance = {
        id: Math.random().toString(36).substring(7),
        sessionId,
        studentId,
        studentName,
        timestamp: Date.now(),
        status: 'present',
        photo,
        markedBy
    };

    await saveAttendance(record);
    revalidatePath('/teacher');
    revalidatePath('/student');
    revalidatePath('/admin');
    return { success: true };
}

export async function getActiveSessionAction() {
    const sessions = await getSessions();
    return sessions.find(s => s.active) || null;
}

export async function getSessionsByTeacherAction(teacherId: string) {
    const sessions = await getSessions();
    // Don't auto-lock here - getAllSessionsAction handles it with 48-hour rule
    return sessions.filter(s => s.teacherId === teacherId);
}

export async function getSessionBySlotAction(slotId: string, teacherId: string, date: string) {
    const sessions = await getSessions();
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const session = sessions.find(s => 
        s.slotId === slotId && 
        s.teacherId === teacherId &&
        s.startTime >= targetDate.getTime() &&
        s.startTime < nextDay.getTime()
    );
    
    if (session && !session.locked) {
        // Auto-lock if older than 24 hours
        const hoursSinceStart = (Date.now() - session.startTime) / (1000 * 60 * 60);
        if (hoursSinceStart >= 24) {
            session.locked = true;
            await saveSession(session);
        }
    }
    
    return session || null;
}

export async function getAttendanceAction(sessionId: string) {
    return await getAttendanceBySession(sessionId);
}

export async function rotateQRCodeAction(sessionId: string) {
    const sessions = await getSessions();
    const session = sessions.find(s => s.id === sessionId);

    if (session && session.active) {
        const newCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        session.qrCode = newCode;
        await saveSession(session);
        revalidatePath('/teacher');
        return { success: true, qrCode: newCode };
    }
    return { success: false, error: 'Session not found or inactive' };
}

export async function updateAttendanceAction(recordId: string, status: 'present' | 'absent', isAdmin: boolean = false) {
    try {
        const attendance = await getAttendanceRecords();
        const record = attendance.find(a => a.id === recordId);
        
        if (!record) {
            return { success: false, error: 'Record not found' };
        }

        // Check if session can be edited
        const canEdit = await canEditAttendance(record.sessionId);
        
        if (!canEdit && !isAdmin) {
            return { success: false, error: 'This attendance is locked. Only admin can edit.' };
        }

        await updateAttendanceRecord(recordId, { status });
        revalidatePath('/admin');
        revalidatePath('/admin/reports');
        revalidatePath('/teacher');
        return { success: true, message: 'Attendance updated successfully' };
    } catch (error) {
        return { success: false, error: 'Failed to update attendance' };
    }
}

export async function deleteAttendanceAction(recordId: string) {
    try {
        await deleteAttendanceRecord(recordId);
        revalidatePath('/admin');
        revalidatePath('/admin/reports');
        return { success: true, message: 'Attendance record deleted' };
    } catch (error) {
        return { success: false, error: 'Failed to delete attendance' };
    }
}

export async function getAllAttendanceAction() {
    return await getAttendanceRecords();
}

export async function getAllSessionsAction() {
    const sessions = await getSessions();
    
    // Auto-lock sessions based on 48-hour rule (NOT 24 hours)
    // This gives teachers and admins time to make corrections
    const now = Date.now();
    let updated = false;
    
    for (const session of sessions) {
        if (!session.locked && !session.active) {
            // Check if 48 hours have passed since session ended (or started if no end time)
            const referenceTime = session.endTime || session.startTime;
            const hoursSinceReference = (now - referenceTime) / (1000 * 60 * 60);
            
            // Only auto-lock if:
            // 1. Session is not active AND
            // 2. 48 hours have passed since end (or start) AND
            // 3. Admin hasn't unlocked it AND
            // 4. No lockUntil time is set (meaning no pending disputes)
            const shouldLock = hoursSinceReference >= 48 && !session.unlockedByAdmin && !session.lockUntil;
            
            if (shouldLock) {
                session.locked = true;
                await saveSession(session);
                updated = true;
            }
        }
    }
    
    if (updated) {
        revalidatePath('/teacher');
        revalidatePath('/admin');
    }
    
    return sessions;
}
