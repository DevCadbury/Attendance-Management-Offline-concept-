import connectDB from './mongodb';
import {
    SessionModel,
    AttendanceModel,
    SectionModel,
    TimeSlotModel,
    DisputeModel,
    SettingsModel,
    ISession,
    IAttendance,
    ISection,
    ITimeSlot,
    IDispute,
    ISettings
} from './models';

// Export types
export type Session = ISession;
export type Attendance = IAttendance;
export type Section = ISection;
export type TimeSlot = ITimeSlot;
export type Dispute = IDispute;
export type Settings = ISettings;

// ============= SESSIONS =============
export async function getSessions(): Promise<Session[]> {
    await connectDB();
    const sessions = await SessionModel.find({}).lean();
    // Serialize MongoDB objects to plain objects
    return sessions.map(session => ({
        id: session.id,
        subject: session.subject,
        teacherId: session.teacherId,
        sectionId: session.sectionId,
        slotId: session.slotId,
        startTime: session.startTime,
        qrCode: session.qrCode,
        active: session.active,
        locked: session.locked,
        unlockedByAdmin: session.unlockedByAdmin || false
    }));
}

export async function getActiveSession(teacherId?: string): Promise<Session | null> {
    await connectDB();
    const query: any = { active: true };
    if (teacherId) {
        query.teacherId = teacherId;
    }
    const session = await SessionModel.findOne(query).lean();
    if (!session) return null;
    
    // Serialize to plain object
    return {
        id: session.id,
        subject: session.subject,
        teacherId: session.teacherId,
        sectionId: session.sectionId,
        slotId: session.slotId,
        startTime: session.startTime,
        qrCode: session.qrCode,
        active: session.active,
        locked: session.locked,
        unlockedByAdmin: session.unlockedByAdmin || false
    };
}

export async function getSessionById(id: string): Promise<Session | null> {
    await connectDB();
    const session = await SessionModel.findOne({ id }).lean();
    if (!session) return null;
    
    // Serialize to plain object
    return {
        id: session.id,
        subject: session.subject,
        teacherId: session.teacherId,
        sectionId: session.sectionId,
        slotId: session.slotId,
        startTime: session.startTime,
        qrCode: session.qrCode,
        active: session.active,
        locked: session.locked,
        unlockedByAdmin: session.unlockedByAdmin || false
    };
}

export async function saveSession(session: Session): Promise<void> {
    await connectDB();
    await SessionModel.updateOne(
        { id: session.id },
        { $set: session },
        { upsert: true }
    );
}

export async function updateSession(id: string, updates: Partial<Session>): Promise<void> {
    await connectDB();
    await SessionModel.updateOne({ id }, { $set: updates });
}

export async function deleteSession(id: string): Promise<void> {
    await connectDB();
    await SessionModel.deleteOne({ id });
}

// ============= ATTENDANCE =============
export async function getAttendance(): Promise<Attendance[]> {
    await connectDB();
    return await AttendanceModel.find({}).lean();
}

export async function getAttendanceBySession(sessionId: string): Promise<Attendance[]> {
    await connectDB();
    return await AttendanceModel.find({ sessionId }).lean();
}

export async function saveAttendance(attendance: Attendance): Promise<void> {
    await connectDB();
    await AttendanceModel.updateOne(
        { id: attendance.id },
        { $set: attendance },
        { upsert: true }
    );
}

export async function updateAttendanceRecord(id: string, updates: Partial<Attendance>): Promise<void> {
    await connectDB();
    await AttendanceModel.updateOne({ id }, { $set: updates });
}

export async function deleteAttendanceRecord(id: string): Promise<void> {
    await connectDB();
    await AttendanceModel.deleteOne({ id });
}

// ============= SECTIONS =============
export async function getSections(): Promise<Section[]> {
    await connectDB();
    const sections = await SectionModel.find({}).lean();
    // Serialize MongoDB objects to plain objects
    return sections.map(section => ({
        id: section.id,
        name: section.name,
        studentIds: section.studentIds || [],
        createdAt: section.createdAt || Date.now()
    }));
}

export async function getSectionById(id: string): Promise<Section | null> {
    await connectDB();
    return await SectionModel.findOne({ id }).lean();
}

export async function saveSection(section: Section): Promise<void> {
    await connectDB();
    await SectionModel.updateOne(
        { id: section.id },
        { $set: section },
        { upsert: true }
    );
}

export async function deleteSection(id: string): Promise<void> {
    await connectDB();
    await SectionModel.deleteOne({ id });
}

// ============= TIMETABLE/SLOTS =============
export async function getTimeSlots(): Promise<TimeSlot[]> {
    await connectDB();
    const slots = await TimeSlotModel.find({}).lean();
    return slots.map(slot => ({
        id: slot.id,
        sectionId: slot.sectionId,
        day: slot.day,
        subject: slot.subject,
        teacherId: slot.teacherId,
        startTime: slot.startTime,
        endTime: slot.endTime
    }));
}

export async function getSlotsBySection(sectionId: string): Promise<TimeSlot[]> {
    await connectDB();
    const slots = await TimeSlotModel.find({ sectionId }).lean();
    return slots.map(slot => ({
        id: slot.id,
        sectionId: slot.sectionId,
        day: slot.day,
        subject: slot.subject,
        teacherId: slot.teacherId,
        startTime: slot.startTime,
        endTime: slot.endTime
    }));
}

export async function getSlotsByTeacher(teacherId: string): Promise<TimeSlot[]> {
    await connectDB();
    const slots = await TimeSlotModel.find({ teacherId }).lean();
    return slots.map(slot => ({
        id: slot.id,
        sectionId: slot.sectionId,
        day: slot.day,
        subject: slot.subject,
        teacherId: slot.teacherId,
        startTime: slot.startTime,
        endTime: slot.endTime
    }));
}

export async function saveTimeSlot(slot: TimeSlot): Promise<void> {
    await connectDB();
    await TimeSlotModel.updateOne(
        { id: slot.id },
        { $set: slot },
        { upsert: true }
    );
}

export async function deleteTimeSlot(id: string): Promise<void> {
    await connectDB();
    await TimeSlotModel.deleteOne({ id });
}

// ============= DISPUTES =============
export async function getDisputes(): Promise<Dispute[]> {
    await connectDB();
    return await DisputeModel.find({}).lean();
}

export async function getDisputeById(id: string): Promise<Dispute | null> {
    await connectDB();
    return await DisputeModel.findOne({ id }).lean();
}

export async function getStudentDisputes(studentId: string): Promise<Dispute[]> {
    await connectDB();
    return await DisputeModel.find({ studentId }).lean();
}

export async function getPendingDisputes(): Promise<Dispute[]> {
    await connectDB();
    return await DisputeModel.find({ status: 'pending' }).lean();
}

export async function saveDispute(dispute: Dispute): Promise<void> {
    await connectDB();
    await DisputeModel.updateOne(
        { id: dispute.id },
        { $set: dispute },
        { upsert: true }
    );
}

export async function updateDispute(id: string, updates: Partial<Dispute>): Promise<void> {
    await connectDB();
    await DisputeModel.updateOne({ id }, { $set: updates });
}

// ============= SETTINGS =============
export async function getSettings(): Promise<Settings> {
    await connectDB();
    let settings = await SettingsModel.findOne({ id: 'global' }).lean();
    
    if (!settings) {
        // Create default settings
        const defaultSettings: Settings = {
            id: 'global',
            attendanceEnabled: true,
            qrRefreshInterval: 3000,
            disputeGracePeriod: 172800000 // 2 days in milliseconds
        };
        await SettingsModel.create(defaultSettings);
        return defaultSettings;
    }
    
    // Convert to plain object, removing MongoDB-specific fields
    return {
        id: settings.id,
        attendanceEnabled: settings.attendanceEnabled,
        qrRefreshInterval: settings.qrRefreshInterval,
        disputeGracePeriod: settings.disputeGracePeriod
    };
}

export async function saveSettings(settings: Settings): Promise<void> {
    await connectDB();
    await SettingsModel.updateOne(
        { id: 'global' },
        { $set: settings },
        { upsert: true }
    );
}

// ============= HELPER FUNCTIONS =============

// Check if a session can be edited
export async function canEditAttendance(sessionId: string): Promise<boolean> {
    const session = await getSessionById(sessionId);
    if (!session) return false;
    
    // Can edit if session is not locked OR if admin has unlocked it
    return !session.locked || session.unlockedByAdmin === true;
}

// Auto-lock expired disputes
export async function cleanupExpiredDisputes(): Promise<void> {
    await connectDB();
    const settings = await getSettings();
    const expirationTime = Date.now() - settings.disputeGracePeriod;
    
    // Find pending disputes older than grace period
    const expiredDisputes = await DisputeModel.find({
        status: 'pending',
        createdAt: { $lt: expirationTime }
    }).lean();
    
    // Reject them and lock their sessions
    for (const dispute of expiredDisputes) {
        await DisputeModel.updateOne(
            { id: dispute.id },
            {
                $set: {
                    status: 'rejected',
                    resolvedAt: Date.now(),
                    resolvedBy: 'system'
                }
            }
        );
        
        await SessionModel.updateOne(
            { id: dispute.sessionId },
            {
                $set: {
                    locked: true,
                    unlockedByAdmin: false
                }
            }
        );
    }
}

// Get unlocked sessions (for admin view)
export async function getUnlockedSessions(): Promise<Session[]> {
    await connectDB();
    return await SessionModel.find({
        active: false,
        $or: [
            { locked: false },
            { unlockedByAdmin: true }
        ]
    }).lean();
}

// Initialize database with default admin if empty
export async function initializeDatabase(): Promise<void> {
    await connectDB();
    
    // Check if settings exist, if not create them
    const settings = await SettingsModel.findOne({ id: 'global' });
    if (!settings) {
        await SettingsModel.create({
            id: 'global',
            attendanceEnabled: true,
            qrRefreshInterval: 3000,
            disputeGracePeriod: 172800000
        });
    }
}
