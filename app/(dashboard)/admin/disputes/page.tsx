import { DisputeManagement } from '@/components/dashboard/dispute-management';
import { getSession } from '@/lib/auth';

export default async function DisputesPage() {
    const session = await getSession();
    if (!session) return null;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Attendance Disputes</h2>
                <p className="text-muted-foreground">Review and manage student attendance dispute requests</p>
            </div>
            <DisputeManagement adminId={session.id} />
        </div>
    );
}
