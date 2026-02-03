import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import EmployeeView from '@/components/employee/employee-view';

export default async function EmployeePage() {
    const session = await getSession();
    
    if (!session) {
        redirect('/login');
    }
    
    if (session.role !== 'employee') {
        redirect(`/${session.role}`);
    }
    
    return <EmployeeView user={session} />;
}
