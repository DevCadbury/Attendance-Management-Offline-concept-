'use client';

import { Sidebar } from '@/components/dashboard/sidebar';
import { DashboardNavbar } from '@/components/dashboard/dashboard-navbar';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardLayoutClientProps {
    children: React.ReactNode;
    session: { id: string; role: string; name: string };
}

export function DashboardLayoutClient({ children, session }: DashboardLayoutClientProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-background">
            {/* Navbar */}
            <DashboardNavbar 
                userName={session.name} 
                userRole={session.role}
                userId={session.id}
            />

            <div className="flex flex-1 overflow-hidden">
                {/* Mobile menu button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="fixed bottom-4 right-4 z-50 sm:hidden h-12 w-12 rounded-full shadow-lg"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>

                {/* Overlay for mobile */}
                {sidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 sm:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`
                    fixed sm:static inset-y-0 left-0 z-40 w-64 
                    transform transition-transform duration-200 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    sm:translate-x-0 mt-0
                `}>
                    <Sidebar role={session.role} />
                </aside>

                {/* Main content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
