'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QRCodeDisplay } from '@/components/dashboard/qr-code';
import { Scanner } from '@/components/dashboard/scanner';
import { compressAndUploadImage } from '@/lib/cloudinary';
import { 
    getAttendanceAction,
    endSessionAction,
    markAttendanceAction,
    updateAttendanceAction,
    rotateQRCodeAction,
    getAllSessionsAction
} from '@/app/actions/attendance';
import { getUsersAction } from '@/app/actions/users';
import { getDisputesAction, teacherApproveDisputeAction, teacherRejectDisputeAction } from '@/app/actions/disputes';
import { toast } from 'sonner';
import { 
    QrCode, 
    UserCheck, 
    Users, 
    X, 
    CheckCircle, 
    XCircle,
    RefreshCw,
    Clock,
    Unlock,
    Lock,
    Calendar,
    Search,
    Edit,
    Save,
    Eye
} from 'lucide-react';

interface Attendance {
    id: string;
    sessionId: string;
    studentId: string;
    studentName: string;
    timestamp: number;
    status: 'present' | 'absent';
    photo?: string;
    markedBy?: 'student' | 'teacher';
}

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
    rejectionMessage?: string;
}

interface Student {
    id: string;
    name: string;
    email: string;
    sectionId?: string;
}

interface Session {
    id: string;
    subject?: string;
    teacherId: string;
    sectionId?: string;
    slotId?: string;
    startTime: number;
    qrCode: string;
    active: boolean;
    locked?: boolean;
    unlockedByAdmin?: boolean;
}

export function SessionAttendanceManager({
    sessionId,
    teacherId,
    teacherName
}: {
    sessionId: string;
    teacherId: string;
    teacherName: string;
}) {
    const [session, setSession] = useState<Session | null>(null);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'qr' | 'manual'>('qr');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showAllSessions, setShowAllSessions] = useState(false);
    const [allSessions, setAllSessions] = useState<Session[]>([]);
    const [rejectingDispute, setRejectingDispute] = useState<{disputeId: string; studentName: string} | null>(null);
    const [rejectionMessage, setRejectionMessage] = useState('');
    const [lastAttendanceCount, setLastAttendanceCount] = useState(0);

    useEffect(() => {
        loadData();
        const dataInterval = setInterval(loadData, 5000);
        
        return () => {
            clearInterval(dataInterval);
        };
    }, [sessionId]);

    const loadData = async () => {
        const [sessionData, attendanceData, usersData, sessionsData, disputesData] = await Promise.all([
            getAllSessionsAction(),
            getAttendanceAction(sessionId),
            getUsersAction(),
            getAllSessionsAction(),
            getDisputesAction()
        ]);

        const currentSession = sessionData.find(s => s.id === sessionId);
        setSession(currentSession || null);
        
        // Check for new attendance entries
        if (lastAttendanceCount > 0 && attendanceData.length > lastAttendanceCount) {
            const newEntries = attendanceData.slice(lastAttendanceCount);
            newEntries.forEach(entry => {
                toast.success(`${entry.studentName} marked ${entry.status}`, {
                    description: entry.markedBy === 'student' ? 'Scanned QR code' : 'Marked by teacher'
                });
            });
        }
        setLastAttendanceCount(attendanceData.length);
        setAttendance(attendanceData);
        
        // Filter disputes for this session
        const sessionDisputes = disputesData.filter(d => d.sessionId === sessionId);
        setDisputes(sessionDisputes);

        if (currentSession) {
            const sectionStudents = usersData.filter(
                u => u.role === 'student' && u.sectionId === (currentSession.sectionId || '')
            );
            setStudents(sectionStudents);
        }

        // Get teacher's sessions for the dialog
        const teacherSessions = sessionsData.filter(s => s.teacherId === teacherId);
        setAllSessions(teacherSessions);

        setLoading(false);
    };

    const handleRotateQR = async () => {
        const result = await rotateQRCodeAction(sessionId);
        if (result.success) {
            toast.success('QR code rotated');
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const handleEndSession = async () => {
        const result = await endSessionAction(sessionId);
        if (result.success) {
            toast.success('Session ended successfully');
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const handleMarkAttendance = async (studentId: string, status: 'present' | 'absent') => {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        if (status === 'present') {
            // Use markAttendanceAction for present
            const result = await markAttendanceAction(
                sessionId,
                studentId,
                student.name,
                undefined,
                'teacher'
            );

            if (result.success) {
                toast.success(`Marked ${student.name} as present`);
                loadData();
            } else {
                toast.error(result.error);
            }
        } else {
            // For absent, we need to create a record first as present then update to absent
            const markResult = await markAttendanceAction(
                sessionId,
                studentId,
                student.name,
                undefined,
                'teacher'
            );

            if (markResult.success) {
                // Reload data to get the new record
                const attendanceData = await getAttendanceAction(sessionId);
                const newRecord = attendanceData.find(a => a.studentId === studentId);
                
                if (newRecord) {
                    const updateResult = await updateAttendanceAction(newRecord.id, 'absent', false);
                    if (updateResult.success) {
                        toast.success(`Marked ${student.name} as absent`);
                        loadData();
                    } else {
                        toast.error(updateResult.error);
                    }
                }
            } else {
                toast.error(markResult.error);
            }
        }
    };

    const handleUpdateAttendance = async (recordId: string, status: 'present' | 'absent') => {
        const attendanceRecord = attendance.find(a => a.id === recordId);
        if (!attendanceRecord) return;

        const result = await updateAttendanceAction(recordId, status, false);
        if (result.success) {
            toast.success('Attendance updated');
            setEditingId(null);
            
            // Auto-approve dispute if marking as present
            if (status === 'present') {
                const dispute = disputes.find(d => 
                    d.studentId === attendanceRecord.studentId && 
                    d.status === 'pending'
                );
                if (dispute) {
                    await teacherApproveDisputeAction(dispute.id, teacherId);
                    toast.success('Dispute automatically approved');
                }
            }
            
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const handleRejectDispute = async () => {
        if (!rejectingDispute || !rejectionMessage.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }

        const result = await teacherRejectDisputeAction(
            rejectingDispute.disputeId,
            teacherId,
            rejectionMessage
        );

        if (result.success) {
            toast.success('Dispute rejected');
            setRejectingDispute(null);
            setRejectionMessage('');
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const getStudentDispute = (studentId: string) => {
        return disputes.find(d => d.studentId === studentId && d.status === 'pending');
    };

    const canEditStudent = (studentId: string) => {
        // Can edit if there's a pending dispute OR if attendance exists
        const dispute = getStudentDispute(studentId);
        const record = getAttendanceRecord(studentId);
        return dispute !== undefined || record !== undefined;
    };

    const getStudentStatus = (studentId: string): 'present' | 'absent' | 'unmarked' => {
        const record = attendance.find(a => a.studentId === studentId);
        if (!record) return 'unmarked';
        return record.status;
    };

    const getAttendanceRecord = (studentId: string) => {
        return attendance.find(a => a.studentId === studentId);
    };

    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: students.length,
        present: attendance.filter(a => a.status === 'present').length,
        absent: attendance.filter(a => a.status === 'absent').length,
        unmarked: students.length - attendance.length
    };

    if (loading) {
        return <div className="text-center p-8">Loading session...</div>;
    }

    if (!session) {
        return <div className="text-center p-8">Session not found</div>;
    }

    return (
        <div className="space-y-6">
            {/* Session Info */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                {session.subject || 'Attendance Session'}
                            </CardTitle>
                            <CardDescription>
                                Started at {new Date(session.startTime).toLocaleString()}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {session.locked ? (
                                <span className="flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-red-500/20 text-red-700">
                                    <Lock className="h-4 w-4" />
                                    Locked
                                </span>
                            ) : session.unlockedByAdmin ? (
                                <span className="flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-700">
                                    <Unlock className="h-4 w-4" />
                                    Unlocked by Admin
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-green-500/20 text-green-700">
                                    <Unlock className="h-4 w-4" />
                                    Active
                                </span>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAllSessions(true)}
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                View All Sessions
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Students</CardDescription>
                        <CardTitle className="text-3xl">{stats.total}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Present</CardDescription>
                        <CardTitle className="text-3xl text-green-600">{stats.present}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Absent</CardDescription>
                        <CardTitle className="text-3xl text-red-600">{stats.absent}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Unmarked</CardDescription>
                        <CardTitle className="text-3xl text-yellow-600">{stats.unmarked}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b">
                <button
                    className={`px-4 py-2 font-medium transition-colors ${
                        activeTab === 'qr'
                            ? 'border-b-2 border-primary text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setActiveTab('qr')}
                >
                    <QrCode className="h-4 w-4 inline mr-2" />
                    QR Code
                </button>
                <button
                    className={`px-4 py-2 font-medium transition-colors ${
                        activeTab === 'manual'
                            ? 'border-b-2 border-primary text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setActiveTab('manual')}
                >
                    <UserCheck className="h-4 w-4 inline mr-2" />
                    Manual Marking
                </button>
            </div>

            {/* QR Code Tab */}
            {activeTab === 'qr' && (
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>QR Code for Students</CardTitle>
                            <CardDescription>Students scan this to mark attendance</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-center">
                                <QRCodeDisplay value={session.qrCode} size={300} />
                            </div>
                            <Button 
                                onClick={handleRotateQR}
                                className="w-full"
                                variant="outline"
                                disabled={session.locked}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Rotate QR Code
                            </Button>
                            {session.active && (
                                <Button 
                                    onClick={handleEndSession}
                                    className="w-full"
                                    variant="destructive"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    End Session
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Scans</CardTitle>
                            <CardDescription>Students who scanned the QR code</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {attendance
                                    .filter(a => a.markedBy === 'student')
                                    .sort((a, b) => b.timestamp - a.timestamp)
                                    .map(record => (
                                        <div 
                                            key={record.id}
                                            className="flex items-center gap-3 p-3 border rounded-lg"
                                        >
                                            {record.photo && (
                                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-green-500/30 flex-shrink-0">
                                                    <img 
                                                        src={record.photo} 
                                                        alt={record.studentName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="font-medium">{record.studentName}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(record.timestamp).toLocaleTimeString()}
                                                </div>
                                            </div>
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        </div>
                                    ))}
                                {attendance.filter(a => a.markedBy === 'student').length === 0 && (
                                    <div className="text-center text-muted-foreground py-8">
                                        No scans yet
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Manual Marking Tab */}
            {activeTab === 'manual' && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Manual Attendance</CardTitle>
                                <CardDescription>Mark attendance for individual students</CardDescription>
                            </div>
                            <div className="w-64">
                                <div className="relative flex-1 mr-4">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search students..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                {editingId && (
                                    <Button
                                        onClick={() => {
                                            setEditingId(null);
                                            toast.success('Changes saved');
                                        }}
                                        size="sm"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-[600px] overflow-y-auto">
                            {filteredStudents.map(student => {
                                const status = getStudentStatus(student.id);
                                const record = getAttendanceRecord(student.id);
                                const isEditing = editingId === record?.id;
                                const dispute = getStudentDispute(student.id);
                                const canEdit = canEditStudent(student.id);

                                return (
                                    <div 
                                        key={student.id}
                                        className={`flex items-center justify-between p-4 border-2 rounded-lg transition-colors ${
                                            status === 'present' ? 'bg-green-500/10 border-green-500/30' :
                                            status === 'absent' ? 'bg-red-500/10 border-red-500/30' :
                                            'border-border'
                                        } ${dispute ? 'ring-2 ring-yellow-500' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {record?.photo && (
                                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 flex-shrink-0">
                                                    <img 
                                                        src={record.photo} 
                                                        alt={student.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-medium">{student.name}</div>
                                                    {dispute && (
                                                        <span className="text-xs px-2 py-0.5 rounded bg-yellow-500 text-white">
                                                            Disputed
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground">{student.email}</div>
                                                {dispute && (
                                                    <div className="text-xs text-yellow-700 dark:text-yellow-400 mt-1 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                                                        <strong>Reason:</strong> {dispute.reason}
                                                    </div>
                                                )}
                                                {record && (
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        <Clock className="h-3 w-3 inline mr-1" />
                                                        {new Date(record.timestamp).toLocaleString()}
                                                        {record.markedBy && ` • Marked by ${record.markedBy}`}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {status === 'unmarked' ? (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleMarkAttendance(student.id, 'present')}
                                                        className="bg-green-600 hover:bg-green-700"
                                                        disabled={session.locked && !canEdit}
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Present
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleMarkAttendance(student.id, 'absent')}
                                                        variant="destructive"
                                                        disabled={session.locked && !canEdit}
                                                    >
                                                        <XCircle className="h-4 w-4 mr-1" />
                                                        Absent
                                                    </Button>
                                                </>
                                            ) : isEditing && canEdit ? (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleUpdateAttendance(record!.id, status === 'present' ? 'absent' : 'present')}
                                                        className={status === 'present' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                                                    >
                                                        <Save className="h-4 w-4 mr-1" />
                                                        Save as {status === 'present' ? 'Absent' : 'Present'}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setEditingId(null)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                                                        status === 'present' 
                                                            ? 'bg-green-600 text-white' 
                                                            : 'bg-red-600 text-white'
                                                    }`}>
                                                        {status === 'present' ? (
                                                            <><CheckCircle className="h-4 w-4" /> Present</>
                                                        ) : (
                                                            <><XCircle className="h-4 w-4" /> Absent</>
                                                        )}
                                                    </span>
                                                    {canEdit && !session.locked && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setEditingId(record!.id)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            {dispute && dispute.status === 'pending' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() => setRejectingDispute({ disputeId: dispute.id, studentName: dispute.studentName })}
                                                                >
                                                                    Reject Dispute
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
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

            {/* All Sessions Dialog */}
            {showAllSessions && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                        onClick={() => setShowAllSessions(false)}
                    />
                    <Card className="relative z-50 w-full max-w-4xl mx-4 shadow-2xl border-2 max-h-[80vh] overflow-hidden flex flex-col">
                        <CardHeader className="bg-accent border-b">
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    All Attendance Sessions
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAllSessions(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <CardDescription>View and manage all your attendance sessions</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 overflow-y-auto">
                            <div className="space-y-3">
                                {allSessions
                                    .sort((a, b) => b.startTime - a.startTime)
                                    .map(s => (
                                        <div 
                                            key={s.id}
                                            className={`p-4 border-2 rounded-lg ${
                                                s.id === sessionId ? 'border-primary bg-primary/5' : 'border-border'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-medium text-lg">{s.subject || 'Attendance Session'}</div>
                                                    <div className="text-sm text-muted-foreground mt-1">
                                                        <Clock className="h-3 w-3 inline mr-1" />
                                                        {new Date(s.startTime).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {s.active && (
                                                        <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-700">
                                                            Active
                                                        </span>
                                                    )}
                                                    {s.locked ? (
                                                        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-700">
                                                            <Lock className="h-3 w-3" />
                                                            Locked
                                                        </span>
                                                    ) : s.unlockedByAdmin ? (
                                                        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-700">
                                                            <Unlock className="h-3 w-3" />
                                                            Unlocked
                                                        </span>
                                                    ) : null}
                                                    {s.id !== sessionId && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                window.location.href = `/teacher/session/${s.id}`;
                                                            }}
                                                        >
                                                            View
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                {allSessions.length === 0 && (
                                    <div className="text-center text-muted-foreground py-8">
                                        No sessions found
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Reject Dispute Dialog */}
            {rejectingDispute && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                        onClick={() => {
                            setRejectingDispute(null);
                            setRejectionMessage('');
                        }}
                    />
                    <Card className="relative z-50 w-full max-w-md mx-4 shadow-2xl border-2">
                        <CardHeader className="bg-accent border-b">
                            <CardTitle>Reject Dispute</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div>
                                <label htmlFor="rejectionMessage" className="block text-sm font-medium mb-2">
                                    Reason for Rejection
                                </label>
                                <textarea
                                    id="rejectionMessage"
                                    className="w-full min-h-[100px] p-3 border rounded-lg bg-background"
                                    placeholder="Explain why this dispute is being rejected..."
                                    value={rejectionMessage}
                                    onChange={(e) => setRejectionMessage(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setRejectingDispute(null);
                                        setRejectionMessage('');
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleRejectDispute()}
                                    disabled={!rejectionMessage.trim()}
                                >
                                    Reject Dispute
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
