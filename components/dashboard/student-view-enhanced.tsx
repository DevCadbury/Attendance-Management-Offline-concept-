'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScannerWithPhoto } from '@/components/dashboard/scanner-with-photo';
import { toast } from 'sonner';
import { CheckCircle, History, Loader2, Camera } from 'lucide-react';
import { markAttendanceAction, getActiveSessionAction } from '@/app/actions/attendance';
import { Session, Attendance } from '@/lib/db';
import { compressAndUploadImage } from '@/lib/cloudinary';

export function StudentViewEnhanced({ studentId, studentName }: { studentId: string, studentName: string }) {
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            const session = await getActiveSessionAction();
            setActiveSession(session);
        };

        checkSession();
        const interval = setInterval(checkSession, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleScan = async (qrData: string, photo?: string) => {
        if (!activeSession) {
            toast.error('No active session found');
            return;
        }

        if (qrData !== activeSession.qrCode) {
            toast.error('Invalid QR Code');
            return;
        }

        setLoading(true);
        try {
            // Compress photo before uploading
            let compressedPhoto = photo;
            if (photo) {
                const compressed = await compressAndUploadImage(photo);
                if (compressed) {
                    compressedPhoto = compressed;
                }
            }
            
            const result = await markAttendanceAction(activeSession.id, studentId, studentName, compressedPhoto);
            if (result.success) {
                toast.success('Attendance marked successfully! 🎉');
                setAttendanceHistory(prev => [{
                    id: Date.now().toString(),
                    sessionId: activeSession.id,
                    studentId,
                    studentName,
                    timestamp: Date.now(),
                    status: 'present',
                    photo: compressedPhoto,
                    markedBy: 'student'
                }, ...prev]);
            } else {
                toast.error(result.error || 'Failed to mark attendance');
            }
        } catch (error) {
            toast.error('An error occurred');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
                <Card className="border-zinc-800/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Camera className="h-5 w-5" />
                            Attendance Scanner
                        </CardTitle>
                        <CardDescription>
                            Take your photo and scan the QR code displayed by your teacher.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                                <p className="text-sm text-muted-foreground">Marking attendance...</p>
                            </div>
                        ) : activeSession ? (
                            <ScannerWithPhoto onScan={handleScan} active={true} requirePhoto={true} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center p-6 border-2 border-dashed border-zinc-800 rounded-lg">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                                <h3 className="font-semibold text-lg">Waiting for Session</h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    No active class session detected. Please wait for your teacher to start.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {activeSession && (
                    <Card className="border-green-800/50 bg-green-950/20">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="inline-block px-3 py-1 rounded-full bg-green-600/20 text-green-400 text-sm font-medium mb-2">
                                    Active Session
                                </div>
                                <h3 className="text-xl font-bold">{activeSession.subject}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Started at {new Date(activeSession.startTime).toLocaleTimeString()}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="space-y-6">
                <Card className="h-full border-zinc-800/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Recent Attendance
                        </CardTitle>
                        <CardDescription>Your attendance history for this session</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {attendanceHistory.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="mx-auto w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
                                        <History className="h-8 w-8 text-zinc-500" />
                                    </div>
                                    <p className="text-muted-foreground">No attendance records yet.</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Mark your attendance when session starts.
                                    </p>
                                </div>
                            ) : (
                                attendanceHistory.map((record) => (
                                    <div key={record.id} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/10 border border-border/50">
                                        {record.photo && (
                                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-500">
                                                <img src={record.photo} alt="Student" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium text-sm flex items-center gap-2">
                                                Session: {record.sessionId.substring(0, 8)}...
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(record.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                            Present
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
