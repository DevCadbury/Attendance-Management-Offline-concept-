import { StudentTimetableViewEnhanced } from '@/components/dashboard/student-timetable-view-enhanced';
import { getSession } from '@/lib/auth';
import { getUserById } from '@/lib/storage';

export default async function StudentTimetablePage() {
    const session = await getSession();
    if (!session) return null;

    const user = await getUserById(session.id);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">My Timetable</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                    View your class schedule in a weekly calendar format
                </p>
            </div>
            <StudentTimetableViewEnhanced 
                studentId={session.id}
                sectionId={user?.sectionId}
            />
        </div>
    );
}
