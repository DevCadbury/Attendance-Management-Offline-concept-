import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ChangePasswordForm from '@/components/dashboard/change-password-form';

export default async function ChangePasswordPage() {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Change Password</h1>
                <p className="text-muted-foreground">
                    Update your account password
                </p>
            </div>

            <ChangePasswordForm />
        </div>
    );
}
