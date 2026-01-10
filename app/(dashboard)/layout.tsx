import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    return <DashboardLayoutClient session={{ id: session.id, role: session.role, name: session.name }}>{children}</DashboardLayoutClient>;
}
