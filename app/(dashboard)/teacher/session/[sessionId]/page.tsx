import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SessionAttendanceManager } from '@/components/dashboard/session-attendance-manager';
import { getAllSessionsAction } from '@/app/actions/attendance';

export default async function SessionAttendancePage({ 
    params 
}: { 
    params: Promise<{ sessionId: string }> 
}) {
    const session = await getSession();
    if (!session || session.role !== 'teacher') redirect('/login');

    const { sessionId } = await params;
    const sessions = await getAllSessionsAction();
    const attendanceSession = sessions.find(s => s.id === sessionId);

    if (!attendanceSession) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold mb-4">Session Not Found</h1>
                <p className="text-muted-foreground">The requested session could not be found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Attendance Session</h1>
                <p className="text-muted-foreground">Mark attendance using QR code or manually</p>
            </div>

            <SessionAttendanceManager 
                sessionId={sessionId}
                teacherId={session.id}
                teacherName={session.name}
            />
        </div>
    );
}
