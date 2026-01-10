import { OfflineAttendanceView } from '@/components/dashboard/offline-attendance-view';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function OfflineAttendancePage() {
    const session = await getSession();
    if (!session) redirect('/login');

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Offline Attendance</h2>
                <p className="text-muted-foreground">Mark attendance manually when internet is unavailable. Data syncs when online.</p>
            </div>
            <OfflineAttendanceView teacherId={session.id} teacherName={session.name} />
        </div>
    );
}
