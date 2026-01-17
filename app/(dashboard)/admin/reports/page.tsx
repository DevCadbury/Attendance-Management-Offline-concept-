import { ReportsViewEnhanced } from '@/components/dashboard/reports-view-enhanced';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ReportsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Attendance Reports</h2>
                <p className="text-muted-foreground">View and edit attendance records for all sessions.</p>
            </div>
            <ReportsViewEnhanced />
        </div>
    );
}
