import { TimetableManagement } from '@/components/dashboard/timetable-management';

export default function TimetablePage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Timetable Management</h2>
                <p className="text-muted-foreground">Create sections, assign students, and manage class schedules</p>
            </div>
            <TimetableManagement />
        </div>
    );
}
