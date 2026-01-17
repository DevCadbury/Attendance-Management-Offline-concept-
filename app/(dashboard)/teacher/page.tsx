import { TeacherView } from '@/components/dashboard/teacher-view';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeacherPage({ 
    searchParams 
}: { 
    searchParams: Promise<{ session?: string }> 
}) {
    const session = await getSession();
    if (!session || session.role !== 'teacher') redirect('/login');

    const params = await searchParams;
    
    // If session ID is provided in query params, redirect to session page
    if (params.session) {
        redirect(`/teacher/session/${params.session}`);
    }

    return (
        <div className="space-y-6 sm:space-y-8">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Teacher Dashboard</h2>
                <p className="text-sm sm:text-base text-muted-foreground">Manage attendance with QR codes and manual marking.</p>
            </div>
            <TeacherView teacherId={session.id} />
        </div>
    );
}
