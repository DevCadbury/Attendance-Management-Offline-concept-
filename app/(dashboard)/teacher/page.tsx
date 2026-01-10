import { TeacherSlotView } from '@/components/dashboard/teacher-slot-view';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function TeacherPage() {
    const session = await getSession();
    if (!session) redirect('/login');

    return (
        <div className="space-y-6 sm:space-y-8">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Teacher Dashboard</h2>
                <p className="text-sm sm:text-base text-muted-foreground">View your timetable and manage attendance for assigned slots.</p>
            </div>
            <TeacherSlotView teacherId={session.id} teacherName={session.name} />
        </div>
    );
}
