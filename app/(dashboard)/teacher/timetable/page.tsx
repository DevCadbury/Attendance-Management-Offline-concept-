import { TeacherTimetableViewEnhanced } from '@/components/dashboard/teacher-timetable-view-enhanced';
import { TeacherTimetableGrid } from '@/components/timetable/teacher-timetable-grid';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getSlotsByTeacherAction, getWeeklyTimetableAction } from '@/app/actions/timetable';

export default async function TeacherTimetablePage() {
    const session = await getSession();
    if (!session) redirect('/login');

    const timetableData = await getWeeklyTimetableAction(session.id, 'teacher');

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">My Timetable</h2>
                <p className="text-muted-foreground">View and manage attendance for your assigned classes</p>
            </div>
            <TeacherTimetableGrid 
                timetableData={timetableData}
                teacherId={session.id}
                title="My Teaching Schedule"
            />
        </div>
    );
}
