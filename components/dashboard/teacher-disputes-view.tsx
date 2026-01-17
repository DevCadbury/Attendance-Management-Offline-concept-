'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, CheckCircle, XCircle, Clock, AlertCircle, Eye, Calendar, Edit, Lock, Unlock, ExternalLink } from 'lucide-react';
import { getDisputesAction } from '@/app/actions/disputes';
import { getSlotsByTeacherAction } from '@/app/actions/timetable';
import { getAllSessionsAction, getAllAttendanceAction, updateAttendanceAction, markAttendanceAction } from '@/app/actions/attendance';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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
    lockUntil?: number;
    subject?: string;
    unlockedByAdmin?: boolean;
}

interface Attendance {
    id: string;
    sessionId: string;
    studentId: string;
    studentName: string;
    timestamp: number;
    status: 'present' | 'absent';
}

interface TeacherDisputesViewProps {
    teacherId: string;
}

export function TeacherDisputesView({ teacherId }: TeacherDisputesViewProps) {
    const router = useRouter();
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingDispute, setViewingDispute] = useState<string | null>(null);
    const [editingAttendance, setEditingAttendance] = useState<string | null>(null);

    useEffect(() => {
        loadDisputes();
    }, [teacherId]);

    const loadDisputes = async () => {
        setLoading(true);
        try {
            const [allDisputes, teacherSlots, allSessions, allAttendance] = await Promise.all([
                getDisputesAction(),
                getSlotsByTeacherAction(teacherId),
                getAllSessionsAction(),
                getAllAttendanceAction()
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
            setAttendance(allAttendance);
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

    const getStudentDayAttendance = (studentId: string, sessionId: string) => {
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return [];

        // Get the date of the disputed session
        const sessionDate = new Date(session.startTime);
        const startOfDay = new Date(sessionDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(sessionDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Find all sessions for this student on that day
        const daySessions = sessions.filter(s => {
            const sTime = new Date(s.startTime);
            return sTime >= startOfDay && sTime <= endOfDay && s.sectionId === session.sectionId;
        });

        // Get attendance records for these sessions
        return daySessions.map(s => {
            const att = attendance.find(a => a.sessionId === s.id && a.studentId === studentId);
            return {
                session: s,
                attendance: att,
                isDisputed: s.id === sessionId
            };
        });
    };

    const getLockTimeRemaining = (lockUntil?: number) => {
        if (!lockUntil) return null;
        const now = Date.now();
        if (now > lockUntil) return 'Expired';
        
        const hours = Math.floor((lockUntil - now) / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
        return `${hours} hour${hours !== 1 ? 's' : ''} remaining`;
    };

    const canEditSession = (session: Session) => {
        return session.teacherId === teacherId;
    };

    const handleEditSession = (sessionId: string, session: Session) => {
        if (!canEditSession(session)) {
            toast.error('You can only edit your own class attendance');
            return;
        }
        router.push(`/teacher/session/${sessionId}`);
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
                            {pendingDisputes.map(dispute => {
                                const session = sessions.find(s => s.id === dispute.sessionId);
                                const dayAttendance = getStudentDayAttendance(dispute.studentId, dispute.sessionId);
                                const isViewing = viewingDispute === dispute.id;
                                const lockRemaining = getLockTimeRemaining(session?.lockUntil);

                                return (
                                    <Card key={dispute.id} className="border-l-4 border-l-yellow-500">
                                        <CardContent className="p-4">
                                            <div className="space-y-3">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                    <div className="flex-1">
                                                        <p className="font-medium">{dispute.studentName}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {session?.subject || 'Session'} - {getSessionDate(dispute.sessionId)}
                                                        </p>
                                                        {session && !canEditSession(session) && (
                                                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                                                                <AlertCircle className="h-3 w-3" />
                                                                Other faculty's class (view only)
                                                            </p>
                                                        )}
                                                        {lockRemaining && session && canEditSession(session) && (
                                                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                                                                <Unlock className="h-3 w-3" />
                                                                Unlocked: {lockRemaining}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-start sm:items-end gap-2">
                                                        <span className="text-xs text-muted-foreground">
                                                            {getDaysAgo(dispute.createdAt)}
                                                        </span>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setViewingDispute(isViewing ? null : dispute.id)}
                                                            >
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                {isViewing ? 'Hide' : 'View'} Day
                                                            </Button>
                                                            {session && canEditSession(session) && (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleEditSession(dispute.sessionId, session)}
                                                                    className="bg-blue-600 hover:bg-blue-700"
                                                                >
                                                                    <Edit className="h-4 w-4 mr-1" />
                                                                    Edit
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-muted p-3 rounded">
                                                    <p className="text-sm font-semibold mb-1">Dispute Reason:</p>
                                                    <p className="text-sm">{dispute.reason}</p>
                                                </div>

                                                {isViewing && dayAttendance.length > 0 && (
                                                    <div className="mt-4 border-t pt-4">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                            <p className="text-sm font-medium">Full Day Attendance</p>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {dayAttendance.map((item, idx) => {
                                                                const isMyClass = canEditSession(item.session);
                                                                const canEdit = isMyClass && (!item.session.locked || item.session.unlockedByAdmin);
                                                                const isLocked = item.session.locked && !item.session.unlockedByAdmin;
                                                                
                                                                return (
                                                                    <div 
                                                                        key={idx}
                                                                        className={`flex items-center justify-between p-3 rounded border ${
                                                                            item.isDisputed ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700' : 'bg-muted/50 border-border'
                                                                        }`}
                                                                    >
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <p className="text-sm font-medium">
                                                                                    {item.session.subject || 'Class'}
                                                                                </p>
                                                                                {item.isDisputed && (
                                                                                    <span className="text-xs px-2 py-0.5 rounded bg-yellow-500 text-white">
                                                                                        Disputed
                                                                                    </span>
                                                                                )}
                                                                                {!isMyClass && (
                                                                                    <span className="text-xs px-2 py-0.5 rounded bg-orange-500 text-white">
                                                                                        Other Faculty
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-2 mt-1">
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    {new Date(item.session.startTime).toLocaleTimeString()}
                                                                                </p>
                                                                                {isLocked && (
                                                                                    <span className="flex items-center gap-1 text-xs text-red-600">
                                                                                        <Lock className="h-3 w-3" />
                                                                                        Locked
                                                                                    </span>
                                                                                )}
                                                                                {canEdit && item.session.lockUntil && (
                                                                                    <span className="flex items-center gap-1 text-xs text-blue-600">
                                                                                        <Unlock className="h-3 w-3" />
                                                                                        {getLockTimeRemaining(item.session.lockUntil)}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            {item.attendance ? (
                                                                                <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                                                                    item.attendance.status === 'present' 
                                                                                        ? 'bg-green-600 text-white' 
                                                                                        : 'bg-red-600 text-white'
                                                                                }`}>
                                                                                    {item.attendance.status === 'present' ? (
                                                                                        <><CheckCircle className="h-3 w-3" /> Present</>
                                                                                    ) : (
                                                                                        <><XCircle className="h-3 w-3" /> Absent</>
                                                                                    )}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-xs text-muted-foreground px-2">Not marked</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
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
