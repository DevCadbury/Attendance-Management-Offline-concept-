'use client';

import { useState, useEffect, Fragment } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getTimeSlotsAction } from '@/app/actions/timetable';
import { getAllAttendanceAction, getAllSessionsAction } from '@/app/actions/attendance';
import { raiseDisputeAction, getStudentDisputesAction } from '@/app/actions/disputes';
import { TimeSlot, Attendance, Session } from '@/lib/db';
import { toast } from 'sonner';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    MessageSquare,
    Send,
    X,
    HelpCircle,
    Timer
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface DisputeForm {
    show: boolean;
    sessionId: string;
    subject: string;
    date: string;
    reason: string;
}

interface Dispute {
    id: string;
    sessionId: string;
    studentId: string;
    studentName: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: number;
    rejectionMessage?: string;
}

export function StudentAttendanceCalendar({ 
    studentId, 
    studentName,
    sectionId 
}: { 
    studentId: string;
    studentName: string;
    sectionId: string;
}) {
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
    const [disputeForm, setDisputeForm] = useState<DisputeForm>({
        show: false,
        sessionId: '',
        subject: '',
        date: '',
        reason: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [slotsData, attendanceData, sessionsData, disputesData] = await Promise.all([
            getTimeSlotsAction(),
            getAllAttendanceAction(),
            getAllSessionsAction(),
            getStudentDisputesAction(studentId)
        ]);
        
        // Filter slots for this section, attendance for this student, and sessions for this section
        setTimeSlots(slotsData.filter(s => s.sectionId === sectionId));
        setAttendance(attendanceData.filter(a => a.studentId === studentId));
        setSessions(sessionsData.filter(s => s.sectionId === sectionId));
        setDisputes(disputesData as Dispute[]);
        setLoading(false);
    };

    const getCurrentWeekDates = () => {
        const today = new Date();
        const currentDay = today.getDay();
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset + (currentWeekOffset * 7));

        return DAYS.map((_, i) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            return date;
        });
    };

    const weekDates = getCurrentWeekDates();

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getDateString = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const getAttendanceForSlot = (slotId: string, date: Date) => {
        const dateStr = getDateString(date);
        // Find sessions for this slot on this date
        const session = sessions.find(s => 
            s.slotId === slotId && 
            new Date(s.startTime).toISOString().split('T')[0] === dateStr
        );
        
        if (!session) return null;
        
        // Find attendance for this session
        return attendance.find(a => a.sessionId === session.id);
    };

    const hasDispute = (sessionId: string) => {
        return disputes.find(d => d.sessionId === sessionId);
    };

    const handleRaiseDispute = (sessionId: string, subject: string, date: Date) => {
        setDisputeForm({
            show: true,
            sessionId,
            subject,
            date: formatDate(date),
            reason: ''
        });
    };

    const handleSubmitDispute = async () => {
        if (!disputeForm.reason.trim()) {
            toast.error('Please provide a reason for the dispute');
            return;
        }

        const result = await raiseDisputeAction(
            disputeForm.sessionId,
            studentId,
            studentName,
            disputeForm.reason
        );

        if (result.success) {
            toast.success('Dispute raised successfully');
            setDisputeForm({ show: false, sessionId: '', subject: '', date: '', reason: '' });
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const calculateStats = () => {
        const totalClasses = attendance.length;
        const presentClasses = attendance.filter(a => a.status === 'present').length;
        const percentage = totalClasses > 0 ? (presentClasses / totalClasses * 100).toFixed(1) : '0';
        
        return { totalClasses, presentClasses, percentage };
    };

    const stats = calculateStats();

    if (loading) {
        return <div className="text-center p-8">Loading attendance...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Overall Attendance</CardDescription>
                        <CardTitle className={`text-3xl ${
                            parseFloat(stats.percentage) >= 75 ? 'text-green-600' :
                            parseFloat(stats.percentage) >= 65 ? 'text-yellow-600' :
                            'text-red-600'
                        }`}>
                            {stats.percentage}%
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Classes Attended</CardDescription>
                        <CardTitle className="text-3xl">{stats.presentClasses}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Classes</CardDescription>
                        <CardTitle className="text-3xl">{stats.totalClasses}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Calendar */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Attendance Calendar
                            </CardTitle>
                            <CardDescription>View your attendance by slot</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentWeekOffset(prev => prev - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-sm font-medium">
                            Week of {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentWeekOffset(prev => prev + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <div className="min-w-[800px]">
                            <div className="grid grid-cols-8 gap-2">
                                <div className="font-semibold text-sm p-2">Subject</div>
                                
                                {DAYS.map((day, idx) => {
                                    const date = weekDates[idx];
                                    return (
                                        <div key={day} className="p-2 rounded-lg text-center bg-accent">
                                            <div className="font-semibold text-sm">{day}</div>
                                            <div className="text-xs text-muted-foreground">{formatDate(date)}</div>
                                        </div>
                                    );
                                })}

                                {timeSlots.map((slot) => (
                                    <Fragment key={`slot-row-${slot.id}`}>
                                        <div className="p-2 border-r">
                                            <div className="font-medium text-sm">{slot.subject}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {slot.startTime} - {slot.endTime}
                                            </div>
                                        </div>
                                        
                                        {DAYS.map((day, idx) => {
                                            if (slot.day !== day) {
                                                return <div key={`${slot.id}-${day}`} className="p-2 border border-dashed rounded bg-muted/20" />;
                                            }

                                            const date = weekDates[idx];
                                            const dateStr = getDateString(date);
                                            const attendanceRecord = getAttendanceForSlot(slot.id, date);
                                            
                                            // Find session for this slot and date
                                            const session = sessions.find(s => 
                                                s.slotId === slot.id && 
                                                new Date(s.startTime).toISOString().split('T')[0] === dateStr
                                            );
                                            const sessionId = session?.id || '';
                                            const dispute = sessionId ? hasDispute(sessionId) : null;

                                            // Determine if slot is in past, present, or future
                                            const now = new Date();
                                            const [startHour, startMinute] = slot.startTime.split(':').map(Number);
                                            const [endHour, endMinute] = slot.endTime.split(':').map(Number);
                                            const slotStart = new Date(date);
                                            slotStart.setHours(startHour, startMinute, 0, 0);
                                            const slotEnd = new Date(date);
                                            slotEnd.setHours(endHour, endMinute, 0, 0);
                                            
                                            const isPast = slotEnd < now;
                                            const isFuture = slotStart > now;
                                            const isOngoing = !isPast && !isFuture;

                                            return (
                                                <div
                                                    key={`${slot.id}-${day}`}
                                                    className={`p-2 border-2 rounded-lg min-h-[80px] flex flex-col ${
                                                        attendanceRecord
                                                            ? attendanceRecord.status === 'present'
                                                                ? 'bg-green-500/10 border-green-500/30'
                                                                : 'bg-red-500/10 border-red-500/30'
                                                            : isPast
                                                                ? 'bg-gray-500/10 border-gray-500/30'
                                                                : isFuture
                                                                    ? 'bg-blue-500/5 border-blue-500/20 border-dashed'
                                                                    : 'bg-yellow-500/10 border-yellow-500/30'
                                                    }`}
                                                >
                                                    {attendanceRecord ? (
                                                        <>
                                                            <div className="flex items-center gap-1 mb-2">
                                                                {attendanceRecord.status === 'present' ? (
                                                                    <>
                                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                                        <span className="text-xs font-medium text-green-700">Present</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <XCircle className="h-4 w-4 text-red-600" />
                                                                        <span className="text-xs font-medium text-red-700">Absent</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                            
                                                            {attendanceRecord.status === 'absent' && (
                                                                <div className="mt-auto">
                                                                    {dispute ? (
                                                                        <div className="space-y-1">
                                                                            <div className={`text-xs px-2 py-1 rounded ${
                                                                                dispute.status === 'pending' ? 'bg-yellow-500/20 text-yellow-700' :
                                                                                dispute.status === 'approved' ? 'bg-green-500/20 text-green-700' :
                                                                                'bg-red-500/20 text-red-700'
                                                                            }`}>
                                                                                <AlertCircle className="h-3 w-3 inline mr-1" />
                                                                                Dispute {dispute.status}
                                                                            </div>
                                                                            {dispute.status === 'rejected' && dispute.rejectionMessage && (
                                                                                <div className="text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                                                                    <strong>Rejection reason:</strong> {dispute.rejectionMessage}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="w-full text-xs h-7"
                                                                            onClick={() => handleRaiseDispute(sessionId, slot.subject, date)}
                                                                        >
                                                                            <MessageSquare className="h-3 w-3 mr-1" />
                                                                            Dispute
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : isFuture ? (
                                                        <div className="flex flex-col items-center justify-center h-full text-xs text-muted-foreground">
                                                            <Clock className="h-5 w-5 mb-1" />
                                                            <span>Upcoming</span>
                                                        </div>
                                                    ) : isOngoing ? (
                                                        <div className="flex flex-col items-center justify-center h-full">
                                                            <Timer className="h-5 w-5 mb-1 text-yellow-600 animate-pulse" />
                                                            <span className="text-xs font-medium text-yellow-700">Ongoing</span>
                                                        </div>
                                                    ) : isPast ? (
                                                        <div className="flex flex-col items-center justify-center h-full">
                                                            <HelpCircle className="h-5 w-5 mb-1 text-gray-500" />
                                                            <span className="text-xs text-gray-600">Not Marked</span>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            );
                                        })}
                                    </Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Disputes History */}
            {disputes.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            My Disputes
                        </CardTitle>
                        <CardDescription>Track your raised disputes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {disputes.map((dispute) => (
                                <div 
                                    key={dispute.id}
                                    className="p-3 border rounded-lg"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <div className="font-medium text-sm mb-1">
                                                Dispute #{dispute.id.substring(0, 8)}
                                            </div>
                                            <div className="text-sm text-muted-foreground mb-2">
                                                {dispute.reason}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Raised on {new Date(dispute.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            dispute.status === 'pending' ? 'bg-yellow-500/20 text-yellow-700' :
                                            dispute.status === 'approved' ? 'bg-green-500/20 text-green-700' :
                                            'bg-red-500/20 text-red-700'
                                        }`}>
                                            {dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)}
                                        </div>
                                    </div>
                                    {dispute.status === 'rejected' && dispute.rejectionMessage && (
                                        <div className="mt-2 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
                                            <strong>Rejection reason:</strong> {dispute.rejectionMessage}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Legend */}
            <Card>
                <CardContent className="pt-4">
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>Present</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span>Absent</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span>Upcoming</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Timer className="h-4 w-4 text-yellow-600" />
                            <span>Ongoing Class</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <HelpCircle className="h-4 w-4 text-gray-500" />
                            <span>Not Marked (Past)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                            <span>Raise dispute</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dispute Form Dialog */}
            {disputeForm.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                        onClick={() => setDisputeForm({ ...disputeForm, show: false })}
                    />
                    <Card className="relative z-50 w-full max-w-md mx-4 shadow-2xl border-2">
                        <CardHeader className="bg-blue-500/10 border-b-2 border-blue-500/20">
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-blue-600" />
                                Raise Attendance Dispute
                            </CardTitle>
                            <CardDescription>
                                {disputeForm.subject} - {disputeForm.date}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div>
                                <Label htmlFor="reason">Reason for Dispute</Label>
                                <textarea
                                    id="reason"
                                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                                    placeholder="Explain why you believe you were present..."
                                    value={disputeForm.reason}
                                    onChange={(e) => setDisputeForm({ ...disputeForm, reason: e.target.value })}
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setDisputeForm({ ...disputeForm, show: false })}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmitDispute}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <Send className="h-4 w-4 mr-2" />
                                    Submit Dispute
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
