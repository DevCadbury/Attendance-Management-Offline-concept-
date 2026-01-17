'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { QRCodeDisplay } from '@/components/dashboard/qr-code';
import { UpcomingHolidays } from '@/components/dashboard/upcoming-holidays';
import { toast } from 'sonner';
import { Users, Clock, CheckCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { startSessionAction, endSessionAction, getAttendanceAction, rotateQRCodeAction } from '@/app/actions/attendance';
import { Session, Attendance } from '@/lib/db';
import { useRouter } from 'next/navigation';

export function TeacherView({ teacherId }: { teacherId: string }) {
    const router = useRouter();
    const [subject, setSubject] = useState('');
    const [session, setSession] = useState<Session | null>(null);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(false);

    // Poll for attendance updates when session is active
    // Poll for attendance updates and rotate QR code when session is active
    useEffect(() => {
        let attendanceInterval: NodeJS.Timeout;
        let qrInterval: NodeJS.Timeout;

        if (session?.active) {
            // Poll attendance every 2 seconds
            attendanceInterval = setInterval(async () => {
                const records = await getAttendanceAction(session.id);
                setAttendance(records);
            }, 2000);

            // Rotate QR code every 10 seconds
            qrInterval = setInterval(async () => {
                const result = await rotateQRCodeAction(session.id);
                if (result.success && result.qrCode) {
                    setSession(prev => prev ? { ...prev, qrCode: result.qrCode! } : null);
                }
            }, 10000);
        }

        return () => {
            clearInterval(attendanceInterval);
            clearInterval(qrInterval);
        };
    }, [session?.active, session?.id]); // Only re-run if active state or ID changes

    const handleStartSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject) return;

        setLoading(true);
        try {
            // Use a default section ID if none specified
            const result = await startSessionAction(subject, teacherId, 'default-section');
            if (result.success && result.session) {
                setSession(result.session);
                setAttendance([]);
                toast.success('Session started successfully');
            }
        } catch (error) {
            toast.error('Failed to start session');
        } finally {
            setLoading(false);
        }
    };

    const handleEndSession = async () => {
        if (!session) return;
        setLoading(true);
        try {
            const result = await endSessionAction(session.id);
            if (result.success) {
                setSession(null);
                toast.success('Session ended');
            }
        } catch (error) {
            toast.error('Failed to end session');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
                <Card className="border-zinc-800/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Class Session</CardTitle>
                        <CardDescription>Manage your active class session and attendance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!session ? (
                            <form onSubmit={handleStartSession} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject / Class Name</Label>
                                    <Input
                                        id="subject"
                                        placeholder="e.g. Advanced Physics 101"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Start Session
                                </Button>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border border-border/50">
                                    <div>
                                        <h3 className="font-semibold text-lg">{session.subject}</h3>
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Clock className="h-3 w-3" /> Started {new Date(session.startTime).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-primary">{attendance.length}</p>
                                        <p className="text-xs text-muted-foreground">Present</p>
                                    </div>
                                </div>

                                <div className="flex justify-center py-4">
                                    <QRCodeDisplay value={session.qrCode} size={200} />
                                </div>

                                <div className="space-y-2">
                                    <Button 
                                        className="w-full" 
                                        onClick={() => router.push(`/teacher/session/${session.id}`)}
                                    >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Open Full Attendance Manager
                                    </Button>
                                    <Button variant="destructive" className="w-full" onClick={handleEndSession} disabled={loading}>
                                        End Session
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                {/* Upcoming Holidays */}
                <UpcomingHolidays limit={3} />
            </div>

            <div className="space-y-6">
                <Card className="h-full border-zinc-800/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Live Attendance</span>
                            {session && <span className="text-xs font-normal px-2 py-1 bg-green-500/10 text-green-500 rounded-full animate-pulse">Live</span>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {attendance.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>No students have marked attendance yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                                    {attendance.map((record) => (
                                        <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 border border-border/50">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                    {record.studentName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{record.studentName}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(record.timestamp).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
