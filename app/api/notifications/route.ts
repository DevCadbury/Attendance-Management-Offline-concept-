import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { NotificationModel } from '@/lib/models-extended';

export async function GET() {
    try {
        const session = await getSession();
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const notifications = await NotificationModel
            .find({ userId: session.id })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        const unreadCount = await NotificationModel.countDocuments({ 
            userId: session.id, 
            read: false 
        });

        return NextResponse.json({
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}
