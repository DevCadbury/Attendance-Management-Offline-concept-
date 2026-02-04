import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAllDisputesAction } from '@/app/actions/disputes';
import { getAllEmployeesAction } from '@/app/actions/users';
import DisputesManagementView from '@/components/admin/disputes-management-view';

export default async function DisputesPage() {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
        redirect('/login');
    }

    const [disputesResult, employeesResult] = await Promise.all([
        getAllDisputesAction(),
        getAllEmployeesAction()
    ]);

    const disputes = disputesResult.success ? disputesResult.disputes : [];
    const employees = employeesResult.success ? employeesResult.employees : [];

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Dispute Management</h1>
            <DisputesManagementView 
                initialDisputes={disputes || []} 
                employees={employees || []}
            />
        </div>
    );
}
