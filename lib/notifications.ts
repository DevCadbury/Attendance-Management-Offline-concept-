import connectDB from './mongodb';
import { NotificationModel } from './models-extended';

export async function createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    link?: string
) {
    try {
        await connectDB();
        
        await NotificationModel.create({
            id: Math.random().toString(36).substring(7),
            userId,
            type,
            title,
            message,
            link,
            read: false,
            createdAt: Date.now()
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

export async function notifySessionUnlocked(teacherId: string, sessionId: string, subject: string) {
    await createNotification(
        teacherId,
        'session_unlocked',
        'Session Unlocked for Editing',
        `Attendance session for ${subject} has been unlocked. You can now edit attendance records. Auto-locks after 24 hours.`,
        `/teacher?session=${sessionId}`
    );
}
