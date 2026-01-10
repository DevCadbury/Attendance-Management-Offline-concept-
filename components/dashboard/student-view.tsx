'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Scanner } from '@/components/dashboard/scanner';
import { toast } from 'sonner';
import { CheckCircle, History, Loader2 } from 'lucide-react';
import { markAttendanceAction, getActiveSessionAction, getAttendanceAction } from '@/app/actions/attendance';
import { Session, Attendance } from '@/lib/db';
import { cn } from '@/lib/utils';

export function StudentView({ studentId, studentName }: { studentId: string, studentName: string }) {
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(false);

    // Check for active session and load history
    useEffect(() => {
        const checkSession = async () => {
            const session = await getActiveSessionAction();
            setActiveSession(session);
        };

        // In a real app, we'd fetch history from a dedicated endpoint
        // For now, we'll just mock it or leave it empty as we didn't implement getStudentHistory

        checkSession();
        const interval = setInterval(checkSession, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleScan = async (data: string) => {
        if (!activeSession) {
            toast.error('No active session found');
            return;
        }

        if (data !== activeSession.qrCode) {
            toast.error('Invalid QR Code');
            return;
        }

        setLoading(true);
        try {
            const result = await markAttendanceAction(activeSession.id, studentId, studentName);
            if (result.success) {
                toast.success('Attendance marked successfully!');
                // Add to local history (optimistic update)
                setAttendanceHistory(prev => [{
                    id: Date.now().toString(),
                    sessionId: activeSession.id,
                    studentId,
                    studentName,
                    timestamp: Date.now(),
                    status: 'present'
                }, ...prev]);
            } else {
                toast.error(result.error || 'Failed to mark attendance');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
                <Card className="border-zinc-800/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader>
                        <CardTitle>Attendance Scanner</CardTitle>
                        <CardDescription>Scan the QR code displayed by your teacher.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {activeSession ? (
                            <Scanner onScan={handleScan} active={true} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center p-6 border-2 border-dashed border-zinc-800 rounded-lg">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                                <h3 className="font-semibold text-lg">Waiting for Session</h3>
                                <p className="text-sm text-muted-foreground">
                                    No active class session detected. Please wait for your teacher to start.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card className="h-full border-zinc-800/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Recent Attendance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {attendanceHistory.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No recent records.</p>
                            ) : (
                                attendanceHistory.map((record) => (
                                    <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 border border-border/50">
                                        <div>
                                            <p className="font-medium text-sm">Session ID: {record.sessionId.substring(0, 8)}...</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(record.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">

                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
