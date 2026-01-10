'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, QrCode, LogOut, Calendar, MessageSquare, BarChart, BookOpen, WifiOff } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';

const links = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, role: 'admin' },
    { href: '/admin/users', label: 'Users', icon: Users, role: 'admin' },
    { href: '/admin/timetable', label: 'Timetable', icon: Calendar, role: 'admin' },
    { href: '/admin/reports', label: 'Reports', icon: BarChart, role: 'admin' },
    { href: '/admin/disputes', label: 'Disputes', icon: MessageSquare, role: 'admin' },
    { href: '/teacher', label: 'Dashboard', icon: LayoutDashboard, role: 'teacher' },
    { href: '/teacher/timetable', label: 'My Timetable', icon: BookOpen, role: 'teacher' },
    { href: '/teacher/offline', label: 'Offline Attendance', icon: WifiOff, role: 'teacher' },
    { href: '/teacher/disputes', label: 'Disputes', icon: MessageSquare, role: 'teacher' },
    { href: '/student', label: 'Dashboard', icon: LayoutDashboard, role: 'student' },
    { href: '/student/timetable', label: 'My Timetable', icon: Calendar, role: 'student' },
    { href: '/student/attendance', label: 'My Attendance', icon: QrCode, role: 'student' },
    { href: '/student/disputes', label: 'Disputes', icon: MessageSquare, role: 'student' },
];

export function Sidebar({ role }: { role: string }) {
    const pathname = usePathname();
    const filteredLinks = links.filter((link) => link.role === role);

    return (
        <div className="flex h-full w-full sm:w-64 flex-col border-r bg-card">
            <div className="flex h-14 items-center border-b px-4 sm:px-6 font-semibold tracking-tight">
                <span className="truncate">Attendance System</span>
            </div>
            <div className="flex-1 py-4 overflow-y-auto">
                <nav className="grid items-start px-2 sm:px-4 text-sm font-medium gap-1">
                    {filteredLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                pathname === link.href
                                    ? "bg-muted text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            <link.icon className="h-4 w-4" />
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="border-t p-4">
                <form action={logoutAction}>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive">
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </Button>
                </form>
            </div>
        </div>
    );
}
