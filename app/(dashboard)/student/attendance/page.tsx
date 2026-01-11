import { StudentAttendanceCalendar } from '@/components/dashboard/student-attendance-calendar';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUsersAction } from '@/app/actions/users';

export default async function StudentAttendancePage() {
    const session = await getSession();
    if (!session || session.role !== 'student') redirect('/login');

    const users = await getUsersAction();
    const studentData = users.find(u => u.id === session.id);

    if (!studentData?.sectionId) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">My Attendance</h1>
                    <p className="text-muted-foreground">Track and analyze your attendance records</p>
                </div>
                <div className="p-8 text-center border rounded-lg bg-muted/20">
                    <p className="text-muted-foreground">You are not assigned to any section yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">My Attendance</h1>
                <p className="text-muted-foreground">Track and analyze your attendance records</p>
            </div>

            <StudentAttendanceCalendar 
                studentId={session.id}
                studentName={session.name}
                sectionId={studentData.sectionId}
            />
        </div>
    );
}
