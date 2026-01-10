'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

interface Dispute {
    id: string;
    studentId: string;
    studentName: string;
    sessionId: string;
    subject: string;
    date: string;
    reason: string;
    evidence?: string;
    status: 'pending' | 'teacher_approved' | 'teacher_rejected' | 'admin_reviewed';
    teacherResponse?: string;
    teacherReviewedAt?: number;
    createdAt: number;
}

interface AttendanceRecord {
    sessionId: string;
    subject: string;
    time: string;
    status: 'present' | 'absent';
}

interface TeacherDisputeReviewProps {
    disputes: Dispute[];
    onReview: (disputeId: string, approved: boolean, response: string) => Promise<void>;
    onViewDayAttendance: (studentId: string, date: string) => Promise<AttendanceRecord[]>;
}

export function TeacherDisputeReview({ disputes, onReview, onViewDayAttendance }: TeacherDisputeReviewProps) {
    const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
    const [dayAttendance, setDayAttendance] = useState<AttendanceRecord[]>([]);
    const [response, setResponse] = useState('');
    const [viewingAttendance, setViewingAttendance] = useState(false);

    const handleViewDayAttendance = async (dispute: Dispute) => {
        setViewingAttendance(true);
        try {
            const records = await onViewDayAttendance(dispute.studentId, dispute.date);
            setDayAttendance(records);
            setSelectedDispute(dispute.id);
        } catch (error) {
            console.error('Failed to load day attendance:', error);
        }
    };

    const handleReview = async (disputeId: string, approved: boolean) => {
        if (!response.trim()) {
            alert('Please provide a response');
            return;
        }

        try {
            await onReview(disputeId, approved, response);
            setResponse('');
            setSelectedDispute(null);
            setViewingAttendance(false);
        } catch (error) {
            console.error('Failed to review dispute:', error);
        }
    };

    const pendingDisputes = disputes.filter(d => d.status === 'pending');

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Pending Disputes ({pendingDisputes.length})
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Review student attendance disputes and view their daily attendance
                    </p>
                </CardHeader>
                <CardContent>
                    {pendingDisputes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No pending disputes</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingDisputes.map((dispute) => (
                                <Card key={dispute.id} className="border-2">
                                    <CardContent className="pt-6">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-semibold text-foreground">{dispute.studentName}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {dispute.subject} • {new Date(dispute.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <Badge variant="outline">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    Pending Review
                                                </Badge>
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-foreground mb-1">Reason:</p>
                                                <p className="text-sm text-muted-foreground">{dispute.reason}</p>
                                            </div>

                                            {dispute.evidence && (
                                                <div>
                                                    <p className="text-sm font-medium text-foreground mb-1">Evidence:</p>
                                                    <img 
                                                        src={dispute.evidence} 
                                                        alt="Evidence" 
                                                        className="max-w-xs rounded border"
                                                    />
                                                </div>
                                            )}

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleViewDayAttendance(dispute)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                View Full Day Attendance
                                            </Button>

                                            {selectedDispute === dispute.id && viewingAttendance && (
                                                <Card className="bg-muted/50">
                                                    <CardContent className="pt-4">
                                                        <h4 className="font-semibold text-foreground mb-3">
                                                            Attendance on {dispute.date}
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {dayAttendance.map((record) => (
                                                                <div key={record.sessionId} className="flex items-center justify-between text-sm">
                                                                    <span className="text-foreground">{record.subject}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-muted-foreground">{record.time}</span>
                                                                        <Badge variant={record.status === 'present' ? 'default' : 'destructive'}>
                                                                            {record.status}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="mt-4 space-y-3">
                                                            <div>
                                                                <label className="text-sm font-medium text-foreground">Your Response:</label>
                                                                <textarea
                                                                    className="w-full mt-1 p-2 border rounded-md bg-background text-foreground"
                                                                    rows={3}
                                                                    value={response}
                                                                    onChange={(e) => setResponse(e.target.value)}
                                                                    placeholder="Provide your decision reasoning..."
                                                                />
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    onClick={() => handleReview(dispute.id, true)}
                                                                    className="flex-1"
                                                                >
                                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleReview(dispute.id, false)}
                                                                    variant="destructive"
                                                                    className="flex-1"
                                                                >
                                                                    <XCircle className="h-4 w-4 mr-2" />
                                                                    Reject
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
