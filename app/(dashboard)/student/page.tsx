import { StudentViewEnhanced } from '@/components/dashboard/student-view-enhanced';
import { getSession } from '@/lib/auth';
import { getUserById } from '@/lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, QrCode, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default async function StudentPage() {
    const session = await getSession();

    // Should be handled by middleware/layout, but safe check
    if (!session) return null;

    const user = await getUserById(session.id);

    return (
        <div className="space-y-6 sm:space-y-8">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Student Dashboard</h2>
                <p className="text-sm sm:text-base text-muted-foreground">Welcome back, {session.name}</p>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-3">
                <Link href="/student/timetable">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                <CardTitle className="text-lg">My Timetable</CardTitle>
                            </div>
                            <CardDescription>View your class schedule</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/student/attendance">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <QrCode className="h-5 w-5 text-green-600 dark:text-green-400" />
                                <CardTitle className="text-lg">My Attendance</CardTitle>
                            </div>
                            <CardDescription>Track your attendance records</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/student/disputes">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                <CardTitle className="text-lg">Disputes</CardTitle>
                            </div>
                            <CardDescription>Manage attendance disputes</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
            </div>

            {/* QR Scanner for Attendance */}
            <Card>
                <CardHeader>
                    <CardTitle>Mark Attendance</CardTitle>
                    <CardDescription>Scan QR code to mark your attendance for current session</CardDescription>
                </CardHeader>
                <CardContent>
                    <StudentViewEnhanced 
                        studentId={session.id} 
                        studentName={session.name}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
