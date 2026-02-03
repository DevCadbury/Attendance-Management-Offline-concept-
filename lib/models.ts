import mongoose, { Schema, Model } from 'mongoose';

// User Schema
export interface IUser {
    id: string;
    name: string;
    email: string;
    password: string;
    role: 'dev' | 'admin' | 'employee';
    profilePictureUrl?: string;
    createdBy?: string;
    locked?: boolean;
    createdAt: number;
}

const userSchema = new Schema<IUser>({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['dev', 'admin', 'employee'], required: true },
    profilePictureUrl: { type: String },
    createdBy: { type: String },
    locked: { type: Boolean, default: false },
    createdAt: { type: Number, required: true }
});

// OTP Schema (for attendance marking)
export interface IOTP {
    id: string;
    otp: string;
    type: 'entry' | 'exit';
    generatedAt: number;
    expiryTime: number;
    isActive: boolean;
    usedBy?: string;
    usedAt?: number;
    employeeId?: string; // If set, OTP is only valid for this employee. If null, universal (admin-generated)
}

const otpSchema = new Schema<IOTP>({
    id: { type: String, required: true, unique: true },
    otp: { type: String, required: true },
    type: { type: String, enum: ['entry', 'exit'], required: true },
    generatedAt: { type: Number, required: true },
    expiryTime: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    usedBy: { type: String },
    usedAt: { type: Number },
    employeeId: { type: String } // null = universal (admin), set = employee-specific
});

// Attendance Schema (Entry/Exit based)
export interface IAttendance {
    id: string;
    employeeId: string;
    employeeName: string;
    date: string; // YYYY-MM-DD
    entryTime?: number;
    exitTime?: number;
    entryLocation?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    exitLocation?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    status: 'incomplete' | 'present' | 'absent';
    markedBy: 'employee' | 'admin';
    editedBy?: string;
    editedAt?: number;
}

const attendanceSchema = new Schema<IAttendance>({
    id: { type: String, required: true, unique: true },
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    date: { type: String, required: true },
    entryTime: { type: Number },
    exitTime: { type: Number },
    entryLocation: {
        latitude: { type: Number },
        longitude: { type: Number },
        address: { type: String }
    },
    exitLocation: {
        latitude: { type: Number },
        longitude: { type: Number },
        address: { type: String }
    },
    status: { type: String, enum: ['incomplete', 'present', 'absent'], default: 'incomplete' },
    markedBy: { type: String, enum: ['employee', 'admin'], required: true },
    editedBy: { type: String },
    editedAt: { type: Number }
});

attendanceSchema.index({ employeeId: 1, date: 1 });
attendanceSchema.index({ date: 1 });

// Dispute Schema
export interface IDispute {
    id: string;
    attendanceId?: string;
    date: string;
    employeeId: string;
    employeeName: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: number;
    resolvedAt?: number;
    resolvedBy?: string;
    rejectionMessage?: string;
    adminNotes?: string;
}

const disputeSchema = new Schema<IDispute>({
    id: { type: String, required: true, unique: true },
    attendanceId: { type: String },
    date: { type: String, required: true },
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], required: true },
    createdAt: { type: Number, required: true },
    resolvedAt: { type: Number },
    resolvedBy: { type: String },
    rejectionMessage: { type: String },
    adminNotes: { type: String }
});

disputeSchema.index({ date: 1 });
disputeSchema.index({ employeeId: 1 });
disputeSchema.index({ status: 1 });

// Attendance Log Schema (for tracking admin edits and OTP usage)
export interface IAttendanceLog {
    id: string;
    attendanceId?: string;
    employeeId: string;
    employeeName: string;
    date: string;
    action: 'entry' | 'exit' | 'edited' | 'deleted';
    timestamp: number;
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    editedBy?: string;
    editedByName?: string;
    reason?: string;
    otpUsed?: string;
}

const attendanceLogSchema = new Schema<IAttendanceLog>({
    id: { type: String, required: true, unique: true },
    attendanceId: { type: String },
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    date: { type: String, required: true },
    action: { type: String, enum: ['entry', 'exit', 'edited', 'deleted'], required: true },
    timestamp: { type: Number, required: true },
    location: {
        latitude: { type: Number },
        longitude: { type: Number },
        address: { type: String }
    },
    editedBy: { type: String },
    editedByName: { type: String },
    reason: { type: String },
    otpUsed: { type: String }
});

attendanceLogSchema.index({ employeeId: 1, date: 1 });
attendanceLogSchema.index({ editedBy: 1 });
attendanceLogSchema.index({ timestamp: -1 });

// OTP Activity Log Schema (for tracking OTP requests and validations)
export interface IOTPActivityLog {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeEmail: string;
    profilePictureUrl?: string;
    action: 'request' | 'validate';
    type: 'entry' | 'exit';
    otpCode?: string;
    timestamp: number;
    success: boolean;
    errorMessage?: string;
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
}

const otpActivityLogSchema = new Schema<IOTPActivityLog>({
    id: { type: String, required: true, unique: true },
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    employeeEmail: { type: String, required: true },
    profilePictureUrl: { type: String },
    action: { type: String, enum: ['request', 'validate'], required: true },
    type: { type: String, enum: ['entry', 'exit'], required: true },
    otpCode: { type: String },
    timestamp: { type: Number, required: true },
    success: { type: Boolean, required: true },
    errorMessage: { type: String },
    location: {
        latitude: { type: Number },
        longitude: { type: Number },
        address: { type: String }
    }
});

otpActivityLogSchema.index({ employeeId: 1 });
otpActivityLogSchema.index({ timestamp: -1 });
otpActivityLogSchema.index({ action: 1, timestamp: -1 });

// Settings Schema (global settings)
export interface ISettings {
    id: string;
    entryTimeStart: string; // Format: "HH:MM" (e.g., "09:00")
    entryTimeEnd: string;   // Format: "HH:MM" (e.g., "10:00")
    exitTimeStart: string;  // Format: "HH:MM" (e.g., "17:00")
    exitTimeEnd: string;    // Format: "HH:MM" (e.g., "18:00")
    otpValidityMinutes: number;
    securityEmail: string;  // Email where OTPs are sent
    securityNotificationsEnabled: boolean; // Toggle for security guard notifications
}

const settingsSchema = new Schema<ISettings>({
    id: { type: String, required: true, unique: true },
    entryTimeStart: { type: String, default: "09:00" },
    entryTimeEnd: { type: String, default: "10:00" },
    exitTimeStart: { type: String, default: "17:00" },
    exitTimeEnd: { type: String, default: "18:00" },
    otpValidityMinutes: { type: Number, default: 5 },
    securityEmail: { type: String, default: "" },
    securityNotificationsEnabled: { type: Boolean, default: true }
});

// Export models
export const UserModel = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', userSchema);
export const OTPModel = (mongoose.models.OTP as Model<IOTP>) || mongoose.model<IOTP>('OTP', otpSchema);
export const AttendanceModel = (mongoose.models.Attendance as Model<IAttendance>) || mongoose.model<IAttendance>('Attendance', attendanceSchema);
export const DisputeModel = (mongoose.models.Dispute as Model<IDispute>) || mongoose.model<IDispute>('Dispute', disputeSchema);
export const AttendanceLogModel = (mongoose.models.AttendanceLog as Model<IAttendanceLog>) || mongoose.model<IAttendanceLog>('AttendanceLog', attendanceLogSchema);
export const OTPActivityLogModel = (mongoose.models.OTPActivityLog as Model<IOTPActivityLog>) || mongoose.model<IOTPActivityLog>('OTPActivityLog', otpActivityLogSchema);
export const SettingsModel = (mongoose.models.Settings as Model<ISettings>) || mongoose.model<ISettings>('Settings', settingsSchema);
