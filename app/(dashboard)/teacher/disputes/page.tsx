import { TeacherDisputesView } from '@/components/dashboard/teacher-disputes-view';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function TeacherDisputesPage() {
    const session = await getSession();
    if (!session) redirect('/login');

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Attendance Disputes</h2>
                <p className="text-muted-foreground">View student disputes for your classes</p>
            </div>
            <TeacherDisputesView teacherId={session.id} />
        </div>
    );
}
