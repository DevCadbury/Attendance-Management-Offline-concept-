import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AdminView from '@/components/admin/admin-view';

export default async function DevPage() {
    const session = await getSession();
    
    if (!session) {
        redirect('/login');
    }
    
    if (session.role !== 'dev') {
        redirect(`/${session.role}`);
    }
    
    // Dev users see the same admin view with additional permissions
    return <AdminView userRole="dev" />;
}
