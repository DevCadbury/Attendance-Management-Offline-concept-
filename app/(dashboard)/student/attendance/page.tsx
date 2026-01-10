import { AttendanceCalendar } from '@/components/timetable/attendance-calendar';
import { AttendanceStats } from '@/components/timetable/attendance-stats';
import { AttendancePredictions } from '@/components/timetable/attendance-predictions';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getWeeklyAttendanceAction, getAttendanceStatsAction, predictAttendanceAction } from '@/app/actions/attendance-stats';

export default async function StudentAttendancePage() {
    const session = await getSession();
    if (!session) redirect('/login');

    const weekStart = new Date();
    const [attendanceData, stats, predictions] = await Promise.all([
        getWeeklyAttendanceAction(session.id, weekStart),
        getAttendanceStatsAction(session.id),
        predictAttendanceAction(session.id)
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">My Attendance</h1>
                <p className="text-muted-foreground">Track and analyze your attendance records</p>
            </div>

            <AttendanceCalendar 
                attendanceData={attendanceData}
            />

            <AttendanceStats 
                overallPercentage={stats.overallPercentage}
                classStats={stats.classStats}
            />

            <AttendancePredictions {...predictions} />
        </div>
    );
}
