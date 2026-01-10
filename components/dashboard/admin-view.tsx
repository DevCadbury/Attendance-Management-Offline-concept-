'use client';

import { usePersistentState } from '@/lib/hooks/usePersistentState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, BookOpen, CheckCircle, Settings as SettingsIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { getSettingsAction, updateSettingsAction } from '@/app/actions/settings';
import { toast } from 'sonner';
import { Settings } from '@/lib/db';

export function AdminStats() {
    const [attendance] = usePersistentState<any[]>('attendance_records', []);
    const [settings, setSettings] = useState<Settings>({ 
        id: 'global',
        attendanceEnabled: true,
        qrRefreshInterval: 3000,
        disputeGracePeriod: 172800000
    });
    const userCount = 4; // Mocked for now

    useEffect(() => {
        getSettingsAction().then(setSettings);
    }, []);

    const handleToggle = async (enabled: boolean) => {
        const newSettings = { ...settings, attendanceEnabled: enabled };
        setSettings(newSettings);
        await updateSettingsAction(newSettings);
        toast.success(`Attendance marking ${enabled ? 'enabled' : 'disabled'}`);
    };

    const stats = [
        {
            title: "Total Users",
            value: userCount,
            description: "Registered accounts",
            icon: Users,
        },
        {
            title: "Active Sessions",
            value: "1", // Mocked
            description: "Currently ongoing",
            icon: BookOpen,
        },
        {
            title: "Total Attendance",
            value: attendance.length,
            description: "Records logged",
            icon: CheckCircle,
        },
    ];

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-foreground">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                        <SettingsIcon className="h-5 w-5" />
                        System Settings
                    </CardTitle>
                    <CardDescription>Global configuration for the attendance system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                            <Label htmlFor="attendance-mode" className="text-base font-medium text-foreground">
                                Enable Attendance Marking
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Allow students to mark their attendance via QR code.
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            {/* Simple Checkbox as Switch replacement for now */}
                            <input
                                type="checkbox"
                                id="attendance-mode"
                                className="h-6 w-6 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                                checked={settings.attendanceEnabled}
                                onChange={(e) => handleToggle(e.target.checked)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
