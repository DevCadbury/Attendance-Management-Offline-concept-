'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScannerWithPhoto } from '@/components/dashboard/scanner-with-photo';
import {
    markAttendanceAction,
    getActiveSessionAction,
    getAllSessionsAction
} from '@/app/actions/attendance';
import { getSlotsBySectionAction } from '@/app/actions/timetable';
import { raiseDisputeAction, getStudentDisputesAction } from '@/app/actions/disputes';
import { Session, TimeSlot, Dispute } from '@/lib/db';
import { toast } from 'sonner';
import { Calendar, History, AlertCircle, CheckCircle, Clock, MessageSquare } from 'lucide-react';

export function StudentTimetableView({ studentId, studentName, sectionId }: { studentId: string; studentName: string; sectionId?: string }) {
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [myAttendance, setMyAttendance] = useState<Session[]>([]);
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDisputeForm, setShowDisputeForm] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);

    useEffect(() => {
        loadData();
        const interval = setInterval(checkActiveSession, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        const [sessions, disputesData] = await Promise.all([
            getAllSessionsAction(),
            getStudentDisputesAction(studentId)
        ]);
        
        // Filter sessions where I was supposed to be
        setMyAttendance(sessions.filter(s => s.sectionId === sectionId));
        setDisputes(disputesData);

        if (sectionId) {
            const slots = await getSlotsBySectionAction(sectionId);
            setTimeSlots(slots);
        }
    };

    const checkActiveSession = async () => {
        const session = await getActiveSessionAction();
        if (session && session.sectionId === sectionId) {
            setActiveSession(session);
        } else {
            setActiveSession(null);
        }
    };

    const handleScan = async (qrData: string, photo?: string) => {
        if (!activeSession) {
            toast.error('No active session found');
            return;
        }

        if (qrData !== activeSession.qrCode) {
            toast.error('Invalid or expired QR Code. Please try again.');
            return;
        }

        setLoading(true);
        try {
            const result = await markAttendanceAction(activeSession.id, studentId, studentName, photo, 'student');
            if (result.success) {
                toast.success('Attendance marked successfully! 🎉');
                loadData();
            } else {
                toast.error(result.error || 'Failed to mark attendance');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleRaiseDispute = async () => {
        if (!selectedSession || !disputeReason.trim()) {
            toast.error('Please provide a reason');
            return;
        }

        const result = await raiseDisputeAction(selectedSession.id, studentId, studentName, disputeReason);
        if (result.success) {
            toast.success(result.message);
            setShowDisputeForm(false);
            setDisputeReason('');
            setSelectedSession(null);
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5);

    const todaySlots = timeSlots.filter(slot => slot.day === currentDay);
    const currentSlot = todaySlots.find(slot =>
        currentTime >= slot.startTime && currentTime <= slot.endTime
    );

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column - Scanner & Timetable */}
            <div className="space-y-6">
                {/* Scanner */}
                <Card className="border-zinc-800/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Mark Attendance
                        </CardTitle>
                        <CardDescription>
                            Take your photo and scan the QR code
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-64">
                                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                                <p className="text-sm text-muted-foreground">Marking attendance...</p>
                            </div>
                        ) : activeSession ? (
                            <div>
                                <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <p className="text-sm font-medium text-green-800 dark:text-green-400">
                                        Active: {activeSession.subject}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Started at {new Date(activeSession.startTime).toLocaleTimeString()}
                                    </p>
                                </div>
                                <ScannerWithPhoto onScan={handleScan} active={true} requirePhoto={true} />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center p-6 border-2 border-dashed border-zinc-800 rounded-lg">
                                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="font-semibold text-lg">No Active Session</h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Wait for your teacher to start the class
                                </p>
                                {currentSlot && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Next: {currentSlot.subject} ({currentSlot.startTime})
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Today's Timetable */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Today's Schedule - {currentDay}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {todaySlots.length > 0 ? (
                                todaySlots
                                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                    .map(slot => (
                                        <div
                                            key={slot.id}
                                            className={`p-3 rounded-lg border ${
                                                currentSlot?.id === slot.id
                                                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                                                    : ''
                                            }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-sm">
                                                            {slot.startTime} - {slot.endTime}
                                                        </span>
                                                        {currentSlot?.id === slot.id && (
                                                            <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                                                                Now
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="font-semibold text-sm mt-1">{slot.subject}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <p className="text-center text-muted-foreground py-4 text-sm">
                                    No classes today
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column - History & Disputes */}
            <div className="space-y-6">
                {/* Attendance History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Recent Attendance
                        </CardTitle>
                        <CardDescription>Your attendance history</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {myAttendance.slice(-10).reverse().map(session => {
                                const hasDispute = disputes.some(d => d.sessionId === session.id);
                                
                                return (
                                    <div key={session.id} className="p-3 rounded-lg border bg-card">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{session.subject}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(session.startTime).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {session.locked && !session.unlockedByAdmin && (
                                                    <span className="text-xs text-muted-foreground">🔒</span>
                                                )}
                                                {hasDispute ? (
                                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs rounded-full">
                                                        Disputed
                                                    </span>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedSession(session);
                                                            setShowDisputeForm(true);
                                                        }}
                                                        disabled={session.locked && !session.unlockedByAdmin}
                                                    >
                                                        <AlertCircle className="h-3 w-3 mr-1" />
                                                        Report
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {myAttendance.length === 0 && (
                                <p className="text-center text-muted-foreground py-8 text-sm">
                                    No attendance records yet
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* My Disputes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            My Disputes
                        </CardTitle>
                        <CardDescription>Track your attendance dispute requests</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {disputes.map(dispute => (
                                <div key={dispute.id} className="p-3 rounded-lg border bg-card">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{dispute.reason}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(dispute.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            dispute.status === 'pending'
                                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                : dispute.status === 'approved'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {dispute.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {disputes.length === 0 && (
                                <p className="text-center text-muted-foreground py-4 text-sm">
                                    No disputes raised
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dispute Form Modal */}
            {showDisputeForm && selectedSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Report Attendance Issue</CardTitle>
                            <CardDescription>
                                Explain why you were marked absent for {selectedSession.subject}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Reason</Label>
                                <textarea
                                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    placeholder="I was present but had technical issues scanning the QR code..."
                                    value={disputeReason}
                                    onChange={(e) => setDisputeReason(e.target.value)}
                                />
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                                <p className="text-xs text-muted-foreground">
                                    📝 Your teacher will have 2 days to review and correct your attendance
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleRaiseDispute} className="flex-1">
                                    Submit Dispute
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowDisputeForm(false);
                                        setDisputeReason('');
                                        setSelectedSession(null);
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
