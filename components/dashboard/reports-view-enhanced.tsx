'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    getAllAttendanceAction, 
    getAllSessionsAction,
    updateAttendanceAction,
    deleteAttendanceAction 
} from '@/app/actions/attendance';
import { Session, Attendance } from '@/lib/db';
import { Eye, Edit2, Trash2, Check, X, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export function ReportsViewEnhanced() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [editingRecord, setEditingRecord] = useState<Attendance | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [sessionsData, attendanceData] = await Promise.all([
            getAllSessionsAction(),
            getAllAttendanceAction()
        ]);
        setSessions(sessionsData);
        setAttendance(attendanceData);
        setLoading(false);
    };

    const getSessionAttendance = (sessionId: string) => {
        return attendance.filter(a => a.sessionId === sessionId);
    };

    const handleUpdateStatus = async (recordId: string, newStatus: 'present' | 'absent') => {
        const result = await updateAttendanceAction(recordId, newStatus);
        if (result.success) {
            toast.success(result.message);
            setAttendance(attendance.map(a => 
                a.id === recordId ? { ...a, status: newStatus } : a
            ));
            setEditingRecord(null);
        } else {
            toast.error(result.error);
        }
    };

    const handleDeleteRecord = async (recordId: string, studentName: string) => {
        if (!confirm(`Delete attendance record for ${studentName}?`)) return;

        const result = await deleteAttendanceAction(recordId);
        if (result.success) {
            toast.success(result.message);
            setAttendance(attendance.filter(a => a.id !== recordId));
        } else {
            toast.error(result.error);
        }
    };

    const sortedSessions = [...sessions].sort((a, b) => b.startTime - a.startTime);

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Loading reports...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Session Reports
                    </CardTitle>
                    <CardDescription>View and manage attendance records for all sessions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {sortedSessions.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No sessions recorded yet.</p>
                        ) : (
                            sortedSessions.map((session) => {
                                const sessionAttendance = getSessionAttendance(session.id);
                                const presentCount = sessionAttendance.filter(a => a.status === 'present').length;
                                
                                return (
                                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <p className="font-medium">{session.subject}</p>
                                                {session.active && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(session.startTime).toLocaleDateString()} • {new Date(session.startTime).toLocaleTimeString()}
                                                {session.endTime && ` - ${new Date(session.endTime).toLocaleTimeString()}`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-sm text-muted-foreground">
                                                <span className="font-medium text-green-600 dark:text-green-400">{presentCount}</span> Present
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => setSelectedSession(session)}>
                                                <Eye className="mr-2 h-4 w-4" /> Details
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Session Details Modal */}
            {selectedSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-3xl max-h-[85vh] overflow-y-auto">
                        <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-card z-10 border-b">
                            <div>
                                <CardTitle>{selectedSession.subject}</CardTitle>
                                <CardDescription>
                                    {new Date(selectedSession.startTime).toLocaleString()}
                                </CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-3">
                                {getSessionAttendance(selectedSession.id).length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">No attendance records for this session.</p>
                                ) : (
                                    getSessionAttendance(selectedSession.id).map((record) => (
                                        <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-medium">{record.studentName}</span>
                                                    {record.photo && (
                                                        <span className="text-xs text-muted-foreground">📷 Photo captured</span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(record.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {editingRecord?.id === record.id ? (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant={record.status === 'present' ? 'default' : 'outline'}
                                                            onClick={() => handleUpdateStatus(record.id, 'present')}
                                                        >
                                                            Present
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant={record.status === 'absent' ? 'default' : 'outline'}
                                                            onClick={() => handleUpdateStatus(record.id, 'absent')}
                                                        >
                                                            Absent
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setEditingRecord(null)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                            record.status === 'present'
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}>
                                                            {record.status.toUpperCase()}
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setEditingRecord(record)}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteRecord(record.id, record.studentName)}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
