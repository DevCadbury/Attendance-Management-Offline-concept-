import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { NotificationModel } from '@/lib/models-extended';

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { notificationId } = await request.json();

        await connectDB();

        if (notificationId) {
            // Mark specific notification as read
            await NotificationModel.updateOne(
                { _id: notificationId, userId: session.id },
                { $set: { read: true } }
            );
        } else {
            // Mark all notifications as read
            await NotificationModel.updateMany(
                { userId: session.id, read: false },
                { $set: { read: true } }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return NextResponse.json(
            { error: 'Failed to mark notification as read' },
            { status: 500 }
        );
    }
}
