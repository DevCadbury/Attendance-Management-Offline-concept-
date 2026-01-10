import { UserManagementEnhanced } from '@/components/dashboard/user-management-enhanced';
import { getUsers } from '@/lib/storage';

export default async function UsersPage() {
    const users = await getUsers();

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">User Management</h2>
                <p className="text-muted-foreground">Create, edit, delete users and manage account access.</p>
            </div>
            <UserManagementEnhanced initialUsers={users} />
        </div>
    );
}
