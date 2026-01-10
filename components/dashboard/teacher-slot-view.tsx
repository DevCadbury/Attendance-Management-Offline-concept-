'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {  QRCodeDisplay } from '@/components/dashboard/qr-code';
import {
    startSessionAction,
    endSessionAction,
    getAttendanceAction,
    rotateQRCodeAction,
    markAttendanceAction,
    getAllSessionsAction
} from '@/app/actions/attendance';
import { getSlotsByTeacherAction, getSectionsAction } from '@/app/actions/timetable';
import { getUsersAction } from '@/app/actions/users';
import { getSettingsAction } from '@/app/actions/settings';
import { Session, Attendance, TimeSlot, Section } from '@/lib/db';
import { User } from '@/lib/storage';
import { toast } from 'sonner';
import { Play, Square, RefreshCw, Calendar, Users, CheckCircle, XCircle, Unlock, Bell } from 'lucide-react';

export function TeacherSlotView({ teacherId, teacherName }: { teacherId: string; teacherName: string }) {
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [students, setStudents] = useState<User[]>([]);
    const [qrRefreshInterval, setQrRefreshInterval] = useState(3000);
    const [unlockedSessions, setUnlockedSessions] = useState<Session[]>([]);
    const qrIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadData();
        checkUnlockedSessions();
        
        // Check for unlocked sessions every 30 seconds
        const checkInterval = setInterval(checkUnlockedSessions, 30000);
        
        return () => {
            if (qrIntervalRef.current) {
                clearInterval(qrIntervalRef.current);
            }
            clearInterval(checkInterval);
        };
    }, [teacherId]);

    const loadData = async () => {
        const [slotsData, sectionsData, usersData, settingsData] = await Promise.all([
            getSlotsByTeacherAction(teacherId),
            getSectionsAction(),
            getUsersAction(),
            getSettingsAction()
        ]);
        
        setTimeSlots(slotsData);
        setSections(sectionsData);
        setStudents(usersData.filter(u => u.role === 'student'));
        setQrRefreshInterval(settingsData.qrRefreshInterval || 3000);
    };

    const checkUnlockedSessions = async () => {
        try {
            const allSessions = await getAllSessionsAction();
            const teacherSlots = await getSlotsByTeacherAction(teacherId);
            const teacherSlotIds = teacherSlots.map(s => s.id);
            
            // Find unlocked sessions for teacher's slots
            const unlocked = allSessions.filter(session => 
                session.slotId && 
                teacherSlotIds.includes(session.slotId) &&
                !session.active &&
                (session.unlockedByAdmin || (!session.locked && session.endTime))
            );
            
            // Show toast if new unlocked sessions found
            const previousCount = unlockedSessions.length;
            if (unlocked.length > previousCount) {
                toast.info(`${unlocked.length - previousCount} session(s) unlocked for editing`, {
                    icon: <Unlock className="h-4 w-4" />
                });
            }
            
            setUnlockedSessions(unlocked);
        } catch (error) {
            console.error('Error checking unlocked sessions:', error);
        }
    };

    const startQRRefresh = (sessionId: string) => {
        // Auto-refresh QR code every 3-4 seconds
        if (qrIntervalRef.current) {
            clearInterval(qrIntervalRef.current);
        }

        qrIntervalRef.current = setInterval(async () => {
            const result = await rotateQRCodeAction(sessionId);
            if (result.success && result.qrCode) {
                setActiveSession(prev => prev ? { ...prev, qrCode: result.qrCode! } : null);
            }
        }, qrRefreshInterval);
    };

    const handleStartSession = async (slot: TimeSlot) => {
        const result = await startSessionAction(slot.subject, teacherId, slot.sectionId, slot.id);
        if (result.success && result.session) {
            setActiveSession(result.session);
            toast.success(`Session started: ${slot.subject}`);
            startQRRefresh(result.session.id);
            loadAttendance(result.session.id);
        } else {
            toast.error('Failed to start session');
        }
    };

    const handleEndSession = async () => {
        if (!activeSession) return;

        if (qrIntervalRef.current) {
            clearInterval(qrIntervalRef.current);
        }

        const result = await endSessionAction(activeSession.id);
        if (result.success) {
            toast.success('Session ended and locked');
            setActiveSession(null);
            setAttendance([]);
        } else {
            toast.error('Failed to end session');
        }
    };

    const loadAttendance = async (sessionId: string) => {
        const records = await getAttendanceAction(sessionId);
        setAttendance(records);
    };

    const handleManualAttendance = async (studentId: string, studentName: string) => {
        if (!activeSession) return;

        const result = await markAttendanceAction(activeSession.id, studentId, studentName, undefined, 'teacher');
        if (result.success) {
            toast.success(`Marked ${studentName} as present`);
            loadAttendance(activeSession.id);
        } else {
            toast.error(result.error || 'Failed to mark attendance');
        }
    };

    // Get current day and time to highlight active slots
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5);

    const currentSlot = timeSlots.find(slot => 
        slot.day === currentDay &&
        currentTime >= slot.startTime &&
        currentTime <= slot.endTime
    );

    const sectionStudents = activeSession 
        ? students.filter(s => s.sectionId === activeSession.sectionId)
        : [];

    const presentStudentIds = attendance.map(a => a.studentId);

    return (
        <div className="space-y-6">
            {/* Unlocked Sessions Notification */}
            {unlockedSessions.length > 0 && (
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-900">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                            <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                                    {unlockedSessions.length} Session{unlockedSessions.length > 1 ? 's' : ''} Unlocked for Editing
                                </p>
                                <p className="text-sm text-orange-700 dark:text-orange-300">
                                    You can now edit attendance for unlocked sessions. Sessions may be unlocked due to approved student disputes or admin action.
                                </p>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={checkUnlockedSessions}
                                className="flex-shrink-0"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Today's Schedule */}
                <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Your Schedule - {currentDay}
                        </CardTitle>
                        <CardDescription>Your assigned time slots for today</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {timeSlots
                                .filter(slot => slot.day === currentDay)
                                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                .map(slot => {
                                    const section = sections.find(s => s.id === slot.sectionId);
                                    const isActive = currentSlot?.id === slot.id;
                                    
                                    return (
                                        <div
                                            key={slot.id}
                                            className={`p-4 border rounded-lg ${
                                                isActive ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{slot.startTime} - {slot.endTime}</span>
                                                        {isActive && (
                                                            <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                                                                Now
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-semibold mt-1">{slot.subject}</p>
                                                    <p className="text-xs text-muted-foreground">{section?.name}</p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleStartSession(slot)}
                                                    disabled={!!activeSession}
                                                >
                                                    <Play className="h-4 w-4 mr-1" />
                                                    Start
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            {timeSlots.filter(slot => slot.day === currentDay).length === 0 && (
                                <p className="text-center text-muted-foreground py-4">
                                    No classes scheduled for today
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Active Session */}
                {activeSession && (
                    <Card className="border-green-500">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-green-600 dark:text-green-400">Active Session</CardTitle>
                                    <CardDescription>{activeSession.subject}</CardDescription>
                                </div>
                                <Button onClick={handleEndSession} variant="destructive" size="sm">
                                    <Square className="h-4 w-4 mr-2" />
                                    End Session
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center">
                                <QRCodeDisplay value={activeSession.qrCode} />
                            </div>
                            <p className="text-center text-xs text-muted-foreground mt-4">
                                <RefreshCw className="h-3 w-3 inline mr-1 animate-spin" />
                                QR refreshes every {qrRefreshInterval / 1000} seconds
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Attendance Tracking */}
            <div className="space-y-6">
                {activeSession && (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-foreground">
                                    <Users className="h-5 w-5" />
                                    Live Attendance
                                </CardTitle>
                                <CardDescription className="text-foreground/80 font-semibold text-base">
                                    {attendance.length} / {sectionStudents.length} present
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                    {sectionStudents.map(student => {
                                        const isPresent = presentStudentIds.includes(student.id);
                                        const record = attendance.find(a => a.studentId === student.id);
                                        
                                        return (
                                            <div
                                                key={student.id}
                                                className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                                                    isPresent
                                                        ? 'bg-green-500/10 border-green-500/30'
                                                        : 'bg-red-500/10 border-red-500/30'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {record?.photo && (
                                                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-green-500">
                                                            <img src={record.photo} alt={student.name} className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-foreground">{student.name}</p>
                                                        {record && (
                                                            <p className="text-xs font-medium text-foreground/70">
                                                                {new Date(record.timestamp).toLocaleTimeString()}
                                                                {record.markedBy === 'teacher' && ' (Manual)'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isPresent ? (
                                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                                    ) : (
                                                        <>
                                                            <XCircle className="h-5 w-5 text-red-600" />
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleManualAttendance(student.id, student.name)}
                                                            >
                                                                Mark Present
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
                
                {!activeSession && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="font-semibold text-lg">No Active Session</h3>
                            <p className="text-muted-foreground text-sm mt-2">
                                Start a session from your schedule to begin taking attendance
                            </p>
                        </CardContent>
                    </Card>
                )}
                </div>
            </div>
        </div>
    );
}
