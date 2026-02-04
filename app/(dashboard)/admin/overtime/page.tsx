import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import OvertimeManagement from '@/components/admin/overtime-management';

export default async function OvertimeManagementPage() {
    const session = await getSession();
    
    if (!session) {
        redirect('/login');
    }
    
    if (session.role !== 'admin' && session.role !== 'dev') {
        redirect(`/${session.role}`);
    }
    
    return (
        <div className="container mx-auto p-6">
            <OvertimeManagement />
        </div>
    );
}
