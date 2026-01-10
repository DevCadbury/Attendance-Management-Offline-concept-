'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { getDisputesAction } from '@/app/actions/disputes';
import { getSlotsByTeacherAction } from '@/app/actions/timetable';
import { getAllSessionsAction } from '@/app/actions/attendance';

interface Dispute {
    id: string;
    sessionId: string;
    studentId: string;
    studentName: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: number;
    resolvedAt?: number;
    resolvedBy?: string;
}

interface Session {
    id: string;
    teacherId: string;
    qrCode: string;
    startTime: number;
    endTime?: number;
    active: boolean;
    sectionId?: string;
    slotId?: string;
    locked?: boolean;
}

interface TeacherDisputesViewProps {
    teacherId: string;
}

export function TeacherDisputesView({ teacherId }: TeacherDisputesViewProps) {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDisputes();
    }, [teacherId]);

    const loadDisputes = async () => {
        setLoading(true);
        try {
            const [allDisputes, teacherSlots, allSessions] = await Promise.all([
                getDisputesAction(),
                getSlotsByTeacherAction(teacherId),
                getAllSessionsAction()
            ]);

            // Filter sessions by teacher's slots
            const teacherSlotIds = teacherSlots.map(slot => slot.id);
            const teacherSessions = allSessions.filter(session => 
                session.slotId && teacherSlotIds.includes(session.slotId)
            );
            const teacherSessionIds = teacherSessions.map(s => s.id);

            // Filter disputes for teacher's sessions
            const teacherDisputes = allDisputes.filter(dispute =>
                teacherSessionIds.includes(dispute.sessionId)
            );

            setDisputes(teacherDisputes);
            setSessions(teacherSessions);
        } catch (error) {
            console.error('Error loading disputes:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSessionDate = (sessionId: string) => {
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return 'Unknown';
        return new Date(session.startTime).toLocaleDateString();
    };

    const getDaysAgo = (timestamp: number) => {
        const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        return `${days} days ago`;
    };

    const pendingDisputes = disputes.filter(d => d.status === 'pending');
    const approvedDisputes = disputes.filter(d => d.status === 'approved');
    const rejectedDisputes = disputes.filter(d => d.status === 'rejected');

    if (loading) {
        return <div className="text-center py-8">Loading disputes...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Info Card */}
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                About Disputes
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Students can raise disputes for absent marks. These disputes are reviewed by the admin. 
                                You can view all disputes related to your classes here. Only pending disputes require admin action.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded">
                                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Pending</p>
                                <p className="text-2xl font-bold">{pendingDisputes.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded">
                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Approved</p>
                                <p className="text-2xl font-bold">{approvedDisputes.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900 rounded">
                                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Rejected</p>
                                <p className="text-2xl font-bold">{rejectedDisputes.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Disputes */}
            {pendingDisputes.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-yellow-600" />
                            Pending Disputes
                        </CardTitle>
                        <CardDescription>Waiting for admin review</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {pendingDisputes.map(dispute => (
                                <Card key={dispute.id} className="border-l-4 border-l-yellow-500">
                                    <CardContent className="p-4">
                                        <div className="space-y-2">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                <div>
                                                    <p className="font-medium">{dispute.studentName}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Session: {getSessionDate(dispute.sessionId)}
                                                    </p>
                                                </div>
                                                <span className="text-xs text-muted-foreground self-start sm:self-auto">
                                                    {getDaysAgo(dispute.createdAt)}
                                                </span>
                                            </div>
                                            <div className="bg-muted p-3 rounded">
                                                <p className="text-sm">{dispute.reason}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Approved Disputes */}
            {approvedDisputes.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Approved Disputes
                        </CardTitle>
                        <CardDescription>You can edit these attendance records</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {approvedDisputes.map(dispute => (
                                <Card key={dispute.id} className="border-l-4 border-l-green-500">
                                    <CardContent className="p-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <div>
                                                <p className="font-medium">{dispute.studentName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Session: {getSessionDate(dispute.sessionId)}
                                                </p>
                                                {dispute.resolvedAt && (
                                                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                                        Approved {getDaysAgo(dispute.resolvedAt)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Rejected Disputes */}
            {rejectedDisputes.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-600" />
                            Rejected Disputes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {rejectedDisputes.map(dispute => (
                                <Card key={dispute.id} className="border-l-4 border-l-red-500 opacity-60">
                                    <CardContent className="p-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <div>
                                                <p className="font-medium">{dispute.studentName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Session: {getSessionDate(dispute.sessionId)}
                                                </p>
                                                {dispute.resolvedAt && (
                                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                                        Rejected {getDaysAgo(dispute.resolvedAt)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {disputes.length === 0 && (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No disputes found for your classes.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
