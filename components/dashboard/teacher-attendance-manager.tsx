'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QRCodeDisplay } from '@/components/dashboard/qr-code';
import {
    startSessionAction,
    endSessionAction,
    getAttendanceAction,
    rotateQRCodeAction,
    markAttendanceAction,
    updateAttendanceAction,
    getAllSessionsAction
} from '@/app/actions/attendance';
import { getSlotsByTeacherAction, getSectionsAction } from '@/app/actions/timetable';
import { getUsersAction } from '@/app/actions/users';
import { getSettingsAction } from '@/app/actions/settings';
import { Session, Attendance, TimeSlot, Section } from '@/lib/db';
import { User } from '@/lib/storage';
import { toast } from 'sonner';
import {
    Play,
    Square,
    RefreshCw,
    Calendar,
    Users,
    CheckCircle,
    XCircle,
    Edit,
    Save,
    X,
    Search,
    Clock,
    QrCode,
    UserCheck
} from 'lucide-react';

interface AttendanceDialog {
    show: boolean;
    session: Session | null;
    students: User[];
    attendance: Attendance[];
}

export function TeacherAttendanceManager({ teacherId, teacherName }: { teacherId: string; teacherName: string }) {
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [students, setStudents] = useState<User[]>([]);
    const [allSessions, setAllSessions] = useState<Session[]>([]);
    const [qrRefreshInterval, setQrRefreshInterval] = useState(3000);
    const [attendanceDialog, setAttendanceDialog] = useState<AttendanceDialog>({
        show: false,
        session: null,
        students: [],
        attendance: []
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [editingAttendance, setEditingAttendance] = useState<{ [key: string]: 'present' | 'absent' }>({});
    const qrIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadData();
        
        return () => {
            if (qrIntervalRef.current) {
                clearInterval(qrIntervalRef.current);
            }
        };
    }, [teacherId]);

    const loadData = async () => {
        const [slotsData, sectionsData, usersData, sessionsData, settingsData] = await Promise.all([
            getSlotsByTeacherAction(teacherId),
            getSectionsAction(),
            getUsersAction(),
            getAllSessionsAction(),
            getSettingsAction()
        ]);
        
        setTimeSlots(slotsData);
        setSections(sectionsData);
        setStudents(usersData.filter(u => u.role === 'student'));
        setAllSessions(sessionsData.filter(s => {
            const slotIds = slotsData.map(slot => slot.id);
            return slotIds.includes(s.slotId || '');
        }));
        setQrRefreshInterval(settingsData.qrRefreshInterval || 3000);
    };

    const startQRRefresh = (sessionId: string) => {
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
            loadData();
        } else {
            toast.error('Failed to end session');
        }
    };

    const loadAttendance = async (sessionId: string) => {
        const records = await getAttendanceAction(sessionId);
        setAttendance(records);
    };

    const handleManualAttendance = async (studentId: string, studentName: string, sessionId: string) => {
        const result = await markAttendanceAction(sessionId, studentId, studentName, undefined, 'teacher');
        if (result.success) {
            toast.success(`Marked ${studentName} as present`);
            if (activeSession && activeSession.id === sessionId) {
                loadAttendance(sessionId);
            } else {
                // Reload attendance in dialog
                const records = await getAttendanceAction(sessionId);
                setAttendanceDialog(prev => ({ ...prev, attendance: records }));
            }
        } else {
            toast.error(result.error || 'Failed to mark attendance');
        }
    };

    const handleViewSession = async (session: Session) => {
        const records = await getAttendanceAction(session.id);
        const sectionStudents = students.filter(s => s.sectionId === session.sectionId);
        
        setAttendanceDialog({
            show: true,
            session,
            students: sectionStudents,
            attendance: records
        });
        
        // Initialize editing state
        const editing: { [key: string]: 'present' | 'absent' } = {};
        sectionStudents.forEach(student => {
            const record = records.find(r => r.studentId === student.id);
            editing[student.id] = record ? record.status : 'absent';
        });
        setEditingAttendance(editing);
    };

    const handleUpdateAttendance = async (recordId: string, status: 'present' | 'absent') => {
        const result = await updateAttendanceAction(recordId, status, false);
        if (result.success) {
            toast.success('Attendance updated');
            if (attendanceDialog.session) {
                const records = await getAttendanceAction(attendanceDialog.session.id);
                setAttendanceDialog(prev => ({ ...prev, attendance: records }));
            }
        } else {
            toast.error('Failed to update attendance');
        }
    };

    const handleToggleStatus = (studentId: string) => {
        setEditingAttendance(prev => ({
            ...prev,
            [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
        }));
    };

    const handleSaveAttendance = async (studentId: string, studentName: string) => {
        if (!attendanceDialog.session) return;

        const newStatus = editingAttendance[studentId];
        const existingRecord = attendanceDialog.attendance.find(r => r.studentId === studentId);

        if (existingRecord) {
            // Update existing record
            await handleUpdateAttendance(existingRecord.id, newStatus);
        } else if (newStatus === 'present') {
            // Create new record only if marking present
            await handleManualAttendance(studentId, studentName, attendanceDialog.session.id);
        }
    };

    const closeDialog = () => {
        setAttendanceDialog({ show: false, session: null, students: [], attendance: [] });
        setSearchTerm('');
        setEditingAttendance({});
    };

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

    const filteredSessions = allSessions.filter(session => {
        const slot = timeSlots.find(s => s.id === session.slotId);
        return slot && slot.subject.toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a, b) => b.startTime - a.startTime);

    const filteredStudents = attendanceDialog.students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Today's Schedule */}
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
                                    <CardTitle className="text-green-600 dark:text-green-400 flex items-center gap-2">
                                        <QrCode className="h-5 w-5" />
                                        Active Session
                                    </CardTitle>
                                    <CardDescription>{activeSession.subject}</CardDescription>
                                </div>
                                <Button onClick={handleEndSession} variant="destructive" size="sm">
                                    <Square className="h-4 w-4 mr-2" />
                                    End Session
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center mb-4">
                                <QRCodeDisplay value={activeSession.qrCode} />
                            </div>
                            <p className="text-center text-xs text-muted-foreground">
                                <RefreshCw className="h-3 w-3 inline mr-1 animate-spin" />
                                QR refreshes every {qrRefreshInterval / 1000} seconds
                            </p>
                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                    {attendance.length} / {sectionStudents.length} students marked present
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Live Attendance */}
            {activeSession && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5" />
                            Live Attendance - QR & Manual Marking
                        </CardTitle>
                        <CardDescription>
                            Students can scan QR or you can manually mark attendance
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
                                                <p className="font-semibold">{student.name}</p>
                                                {record && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(record.timestamp).toLocaleTimeString()}
                                                        {record.markedBy === 'teacher' ? ' (Manual)' : ' (QR Scan)'}
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
                                                        onClick={() => handleManualAttendance(student.id, student.name, activeSession.id)}
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
            )}

            {/* Past Sessions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Session History
                    </CardTitle>
                    <CardDescription>View and update past attendance records</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search sessions by subject..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {filteredSessions.map(session => {
                            const slot = timeSlots.find(s => s.id === session.slotId);
                            const section = sections.find(s => s.id === session.sectionId);
                            
                            return (
                                <div
                                    key={session.id}
                                    className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="font-semibold">{session.subject}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {section?.name} • {new Date(session.startTime).toLocaleDateString()} at {new Date(session.startTime).toLocaleTimeString()}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {session.locked && !session.unlockedByAdmin && (
                                                    <span className="px-2 py-0.5 bg-gray-500/20 text-gray-700 dark:text-gray-300 text-xs rounded">
                                                        Locked
                                                    </span>
                                                )}
                                                {session.unlockedByAdmin && (
                                                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-700 dark:text-orange-300 text-xs rounded">
                                                        Unlocked
                                                    </span>
                                                )}
                                                {session.active && (
                                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-700 dark:text-green-300 text-xs rounded animate-pulse">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleViewSession(session)}
                                        >
                                            <Edit className="h-4 w-4 mr-1" />
                                            View/Edit
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredSessions.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">
                                No sessions found
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Attendance Dialog */}
            {attendanceDialog.show && attendanceDialog.session && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                        onClick={closeDialog}
                    />
                    <Card className="relative z-50 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
                        <CardHeader className="border-b">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>{attendanceDialog.session.subject}</CardTitle>
                                    <CardDescription>
                                        {new Date(attendanceDialog.session.startTime).toLocaleDateString()} at {new Date(attendanceDialog.session.startTime).toLocaleTimeString()}
                                    </CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" onClick={closeDialog}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="mt-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search students..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto pt-6">
                            <div className="space-y-2">
                                {filteredStudents.map(student => {
                                    const record = attendanceDialog.attendance.find(r => r.studentId === student.id);
                                    const currentStatus = editingAttendance[student.id] || 'absent';
                                    const hasChanges = record?.status !== currentStatus || (!record && currentStatus === 'present');
                                    
                                    return (
                                        <div
                                            key={student.id}
                                            className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                                                currentStatus === 'present'
                                                    ? 'bg-green-500/10 border-green-500/30'
                                                    : 'bg-red-500/10 border-red-500/30'
                                            }`}
                                        >
                                            <div className="flex-1">
                                                <p className="font-semibold">{student.name}</p>
                                                {record && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(record.timestamp).toLocaleTimeString()}
                                                        {record.markedBy === 'teacher' ? ' (Manual)' : ' (QR Scan)'}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant={currentStatus === 'present' ? 'default' : 'outline'}
                                                    onClick={() => handleToggleStatus(student.id)}
                                                    className={currentStatus === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}
                                                >
                                                    {currentStatus === 'present' ? (
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                    ) : (
                                                        <XCircle className="h-4 w-4 mr-1" />
                                                    )}
                                                    {currentStatus === 'present' ? 'Present' : 'Absent'}
                                                </Button>
                                                {hasChanges && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleSaveAttendance(student.id, student.name)}
                                                    >
                                                        <Save className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
