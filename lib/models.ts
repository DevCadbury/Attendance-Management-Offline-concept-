import mongoose, { Schema, Model } from 'mongoose';

// User Schema
export interface IUser {
    id: string;
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'teacher' | 'student';
    sectionId?: string;
    locked?: boolean;
    createdAt: number;
}

const userSchema = new Schema<IUser>({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'teacher', 'student'], required: true },
    sectionId: { type: String },
    locked: { type: Boolean, default: false },
    createdAt: { type: Number, required: true }
});

// Session Schema
export interface ISession {
    id: string;
    teacherId: string;
    subject?: string;
    qrCode: string;
    startTime: number;
    endTime?: number;
    active: boolean;
    sectionId?: string;
    slotId?: string;
    locked?: boolean;
    unlockedByAdmin?: boolean;
    lockUntil?: number;
}

const sessionSchema = new Schema<ISession>({
    id: { type: String, required: true, unique: true },
    teacherId: { type: String, required: true },
    subject: { type: String },
    qrCode: { type: String, required: true },
    startTime: { type: Number, required: true },
    endTime: { type: Number },
    active: { type: Boolean, required: true },
    sectionId: { type: String },
    slotId: { type: String },
    locked: { type: Boolean, default: false },
    unlockedByAdmin: { type: Boolean, default: false },
    lockUntil: { type: Number }
});

// Attendance Schema
export interface IAttendance {
    id: string;
    sessionId: string;
    studentId: string;
    studentName: string;
    timestamp: number;
    status: 'present' | 'absent';
    photo?: string;
    markedBy?: 'student' | 'teacher';
}

const attendanceSchema = new Schema<IAttendance>({
    id: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    timestamp: { type: Number, required: true },
    status: { type: String, enum: ['present', 'absent'], required: true },
    photo: { type: String },
    markedBy: { type: String, enum: ['student', 'teacher'] }
});

attendanceSchema.index({ sessionId: 1, studentId: 1 });

// Section Schema
export interface ISection {
    id: string;
    name: string;
    studentIds: string[];
    createdAt: number;
}

const sectionSchema = new Schema<ISection>({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    studentIds: { type: [String], default: [] },
    createdAt: { type: Number, required: true }
});

// TimeSlot Schema
export interface ITimeSlot {
    id: string;
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    startTime: string;
    endTime: string;
    subject: string;
    teacherId: string;
    sectionId: string;
}

const timeSlotSchema = new Schema<ITimeSlot>({
    id: { type: String, required: true, unique: true },
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    subject: { type: String, required: true },
    teacherId: { type: String, required: true },
    sectionId: { type: String, required: true }
});

timeSlotSchema.index({ sectionId: 1, day: 1 });
timeSlotSchema.index({ teacherId: 1 });

// Dispute Schema
export interface IDispute {
    id: string;
    sessionId: string;
    studentId: string;
    studentName: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: number;
    resolvedAt?: number;
    resolvedBy?: string;
    rejectionMessage?: string;
}

const disputeSchema = new Schema<IDispute>({
    id: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], required: true },
    createdAt: { type: Number, required: true },
    resolvedAt: { type: Number },
    resolvedBy: { type: String },
    rejectionMessage: { type: String }
});

disputeSchema.index({ sessionId: 1 });
disputeSchema.index({ studentId: 1 });
disputeSchema.index({ status: 1 });

// Settings Schema
export interface ISettings {
    id: string;
    attendanceEnabled: boolean;
    qrRefreshInterval: number;
    disputeGracePeriod: number;
}

const settingsSchema = new Schema<ISettings>({
    id: { type: String, required: true, unique: true, default: 'global' },
    attendanceEnabled: { type: Boolean, required: true, default: true },
    qrRefreshInterval: { type: Number, required: true, default: 3000 },
    disputeGracePeriod: { type: Number, required: true, default: 172800000 }
});

// Create models
export const UserModel = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', userSchema);
export const SessionModel = (mongoose.models.Session as Model<ISession>) || mongoose.model<ISession>('Session', sessionSchema);
export const AttendanceModel = (mongoose.models.Attendance as Model<IAttendance>) || mongoose.model<IAttendance>('Attendance', attendanceSchema);
export const SectionModel = (mongoose.models.Section as Model<ISection>) || mongoose.model<ISection>('Section', sectionSchema);
export const TimeSlotModel = (mongoose.models.TimeSlot as Model<ITimeSlot>) || mongoose.model<ITimeSlot>('TimeSlot', timeSlotSchema);
export const DisputeModel = (mongoose.models.Dispute as Model<IDispute>) || mongoose.model<IDispute>('Dispute', disputeSchema);
export const SettingsModel = (mongoose.models.Settings as Model<ISettings>) || mongoose.model<ISettings>('Settings', settingsSchema);
