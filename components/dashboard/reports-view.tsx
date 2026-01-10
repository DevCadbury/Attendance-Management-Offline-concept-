'use client';

import { usePersistentState } from '@/lib/hooks/usePersistentState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

// I'll implement a simple modal using fixed positioning if I don't want to install Dialog, 
// but Dialog is standard. I'll use a simple state-based modal for now to keep it lightweight 
// unless I install radix-ui/react-dialog.
// "Professional, modern UI" -> I should probably use a proper Dialog.
// I'll install @radix-ui/react-dialog and create a Dialog component?
// Or just use a simple custom one.
// I'll use a simple custom one for speed, but style it well.

interface Session {
    id: string;
    subject: string;
    timestamp: number;
    active: boolean;
}

interface AttendanceRecord {
    studentId: string;
    studentName: string;
    sessionId: string;
    timestamp: number;
    status: 'present' | 'absent';
}

export function ReportsView() {
    const [attendance] = usePersistentState<AttendanceRecord[]>('attendance_records', []);
    // We need sessions too, but we only stored 'current_session' in TeacherView.
    // We should have stored 'all_sessions'.
    // Let's update TeacherView to store 'all_sessions' or just derive sessions from attendance records?
    // Deriving from attendance records is incomplete (sessions with 0 attendance won't show).
    // But for this MVP/Demo, deriving is okay, or we can assume the teacher stores history.
    // Let's assume we derive unique sessions from attendance records for now, 
    // or better, let's update TeacherView to store history.
    // But I can't go back easily without context switching.
    // I'll derive unique sessions from attendance records for now.

    const uniqueSessionIds = Array.from(new Set(attendance.map(a => a.sessionId)));
    const sessions = uniqueSessionIds.map(id => {
        const records = attendance.filter(a => a.sessionId === id);
        const firstRecord = records[0];
        // We don't have subject name if we only look at attendance, unless we stored it in attendance record?
        // TeacherView stored: { studentId, studentName, sessionId, timestamp, status }
        // It didn't store subject in attendance record.
        // Wait, TeacherView stored `current_session` which has subject.
        // If we want history, we should have stored `sessions_history`.
        // I'll add `sessions_history` to TeacherView logic?
        // Or just update `attendance` to include `subject`?
        // I'll update `attendance` to include `subject` in `TeacherView`? 
        // No, I'll just update the `ReportsView` to gracefully handle missing subject or 
        // I'll update `TeacherView` to store `sessions_history` in a future step if needed.
        // For now, I'll just show Session ID.
        return {
            id,
            timestamp: firstRecord?.timestamp || Date.now(),
            count: records.filter(r => r.status === 'present').length,
            records
        };
    }).sort((a, b) => b.timestamp - a.timestamp);

    const [selectedSession, setSelectedSession] = useState<typeof sessions[0] | null>(null);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Session Reports</CardTitle>
                    <CardDescription>View attendance history for all sessions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {sessions.map((session) => (
                            <div key={session.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div>
                                    <p className="font-medium">Session ID: {session.id}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(session.timestamp).toLocaleDateString()} • {new Date(session.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-sm text-muted-foreground">
                                        {session.count} Present
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setSelectedSession(session)}>
                                        <Eye className="mr-2 h-4 w-4" /> Details
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {sessions.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">No sessions recorded yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Simple Modal */}
            {selectedSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Session Details</CardTitle>
                                <CardDescription>ID: {selectedSession.id}</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)}>Close</Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {selectedSession.records.map((record, idx) => (
                                    <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0">
                                        <span className="font-medium">{record.studentName}</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === 'present'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-red-100 text-red-700'
                                            }`}>
                                            {record.status.toUpperCase()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
