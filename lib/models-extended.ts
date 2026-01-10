import mongoose, { Schema, Model } from 'mongoose';

// Notification Schema
export interface INotification {
    id: string;
    userId: string;
    type: 'dispute' | 'session_unlock' | 'system' | 'attendance';
    title: string;
    message: string;
    read: boolean;
    link?: string;
    createdAt: number;
}

const notificationSchema = new Schema<INotification>({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    type: { type: String, enum: ['dispute', 'session_unlock', 'system', 'attendance'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    link: { type: String },
    createdAt: { type: Number, required: true }
});

notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

// Timetable Template Schema
export interface ITimetableTemplate {
    id: string;
    name: string;
    description?: string;
    schedule: Array<{
        day: string;
        slots: Array<{
            id?: string;
            subject: string;
            teacher?: string;
            startTime: string;
            endTime: string;
            room?: string;
        }>;
    }>;
    createdBy?: string;
    createdAt: number;
}

const timetableTemplateSchema = new Schema<ITimetableTemplate>({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    schedule: [{
        day: { type: String, required: true },
        slots: [{
            id: { type: String },
            subject: { type: String, required: true },
            teacher: { type: String },
            startTime: { type: String, required: true },
            endTime: { type: String, required: true },
            room: { type: String }
        }]
    }],
    createdBy: { type: String },
    createdAt: { type: Number, required: true }
});

// Timetable Override Schema (for specific dates)
export interface ITimetableOverride {
    id: string;
    date: string; // YYYY-MM-DD format
    sectionId: string;
    slots: Array<{
        id?: string;
        subject: string;
        teacher?: string;
        startTime: string;
        endTime: string;
        room?: string;
    }>;
    createdBy?: string;
    createdAt: number;
}

const timetableOverrideSchema = new Schema<ITimetableOverride>({
    id: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    sectionId: { type: String, required: true },
    slots: [{
        id: { type: String },
        subject: { type: String, required: true },
        teacher: { type: String },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        room: { type: String }
    }],
    createdBy: { type: String },
    createdAt: { type: Number, required: true }
});

timetableOverrideSchema.index({ date: 1, sectionId: 1 });

// Export all models with existing ones
export { UserModel, SessionModel, AttendanceModel, SectionModel, TimeSlotModel, DisputeModel, SettingsModel } from './models';

export const NotificationModel = (mongoose.models.Notification as Model<INotification>) || mongoose.model<INotification>('Notification', notificationSchema);
export const TimetableTemplateModel = (mongoose.models.TimetableTemplate as Model<ITimetableTemplate>) || mongoose.model<ITimetableTemplate>('TimetableTemplate', timetableTemplateSchema);
export const TimetableOverrideModel = (mongoose.models.TimetableOverride as Model<ITimetableOverride>) || mongoose.model<ITimetableOverride>('TimetableOverride', timetableOverrideSchema);
