'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, BookOpen, CheckCircle, Settings as SettingsIcon, Lock, Unlock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { getSettingsAction, updateSettingsAction } from '@/app/actions/settings';
import { getAllAttendanceAction, getAllSessionsAction } from '@/app/actions/attendance';
import { getUsersAction } from '@/app/actions/users';
import { toast } from 'sonner';
import { User } from '@/lib/storage';
import { Session, Attendance } from '@/lib/db';

export function AdminViewEnhanced() {
    const [settings, setSettings] = useState({ 
        id: 'global',
        attendanceEnabled: true,
        qrRefreshInterval: 3000,
        disputeGracePeriod: 172800000 // 2 days
    });
    const [users, setUsers] = useState<User[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [settingsData, usersData, sessionsData, attendanceData] = await Promise.all([
                getSettingsAction(),
                getUsersAction(),
                getAllSessionsAction(),
                getAllAttendanceAction()
            ]);
            setSettings(settingsData);
            setUsers(usersData);
            setSessions(sessionsData);
            setAttendance(attendanceData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (enabled: boolean) => {
        const newSettings = { 
            ...settings,
            id: 'global',
            attendanceEnabled: enabled 
        };
        setSettings(newSettings);
        await updateSettingsAction(newSettings);
        toast.success(`Attendance marking ${enabled ? 'enabled' : 'disabled'}`);
    };

    const activeSessions = sessions.filter(s => s.active).length;
    const lockedUsers = users.filter(u => u.locked).length;
    const todayAttendance = attendance.filter(a => {
        const today = new Date();
        const recordDate = new Date(a.timestamp);
        return recordDate.toDateString() === today.toDateString();
    }).length;

    const stats = [
        {
            title: "Total Users",
            value: users.length,
            description: `${lockedUsers} locked`,
            icon: Users,
            color: "text-blue-600 dark:text-blue-400"
        },
        {
            title: "Active Sessions",
            value: activeSessions,
            description: `${sessions.length} total sessions`,
            icon: BookOpen,
            color: "text-green-600 dark:text-green-400"
        },
        {
            title: "Today's Attendance",
            value: todayAttendance,
            description: `${attendance.length} total records`,
            icon: CheckCircle,
            color: "text-purple-600 dark:text-purple-400"
        },
    ];

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Loading dashboard...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                {stats.map((stat) => (
                    <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5" />
                            System Settings
                        </CardTitle>
                        <CardDescription>Global configuration for the attendance system.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label htmlFor="attendance-mode" className="text-base font-medium">
                                    Enable Attendance Marking
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Allow students to mark their attendance via QR code.
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="attendance-mode"
                                    className="h-6 w-6 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                                    checked={settings.attendanceEnabled}
                                    onChange={(e) => handleToggle(e.target.checked)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Stats</CardTitle>
                        <CardDescription>Overview of system status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-2 rounded-lg hover:bg-accent/50">
                                <span className="text-sm font-medium">Students</span>
                                <span className="text-lg font-bold">{users.filter(u => u.role === 'student').length}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded-lg hover:bg-accent/50">
                                <span className="text-sm font-medium">Teachers</span>
                                <span className="text-lg font-bold">{users.filter(u => u.role === 'teacher').length}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded-lg hover:bg-accent/50">
                                <span className="text-sm font-medium">Admins</span>
                                <span className="text-lg font-bold">{users.filter(u => u.role === 'admin').length}</span>
                            </div>
                            {lockedUsers > 0 && (
                                <div className="flex justify-between items-center p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                                    <span className="text-sm font-medium flex items-center gap-2">
                                        <Lock className="h-4 w-4" />
                                        Locked Accounts
                                    </span>
                                    <span className="text-lg font-bold text-red-600 dark:text-red-400">{lockedUsers}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest attendance submissions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {attendance.slice(-5).reverse().map((record, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 border border-border/50">
                                <div className="flex items-center gap-3">
                                    {record.photo && (
                                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-green-500">
                                            <img src={record.photo} alt="Student" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium text-sm">{record.studentName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(record.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    record.status === 'present'
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                    {record.status.toUpperCase()}
                                </span>
                            </div>
                        ))}
                        {attendance.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">No attendance records yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
