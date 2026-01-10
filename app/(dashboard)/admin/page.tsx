import { AdminViewEnhanced } from '@/components/dashboard/admin-view-enhanced';

export default function AdminPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h2>
                <p className="text-muted-foreground">Complete system overview and management.</p>
            </div>
            <AdminViewEnhanced />
        </div>
    );
}
