import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAllEmployeesAction } from '@/app/actions/users';
import { getAllAttendanceAction } from '@/app/actions/attendance';
import StaffComparisonView from '@/components/admin/staff-comparison-view';

export default async function StaffComparisonPage() {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
        redirect('/login');
    }

    const [employeesResult, attendanceResult] = await Promise.all([
        getAllEmployeesAction(),
        getAllAttendanceAction({})
    ]);

    const employees = employeesResult.success ? employeesResult.employees : [];
    const attendance = attendanceResult.success ? attendanceResult.attendance : [];

    return (
        <div className="container mx-auto p-6">
            <StaffComparisonView 
                employees={employees || []} 
                attendance={attendance || []}
            />
        </div>
    );
}
