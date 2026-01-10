import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserById } from '@/lib/storage';
import ProfileForm from '@/components/dashboard/profile-form';

export default async function ProfilePage() {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    const user = await getUserById(session.id);

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">My Profile</h1>
                <p className="text-muted-foreground">
                    Manage your profile information
                </p>
            </div>

            <ProfileForm user={user} />
        </div>
    );
}
