'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Dispute {
    id: string;
    studentId: string;
    studentName: string;
    sessionId: string;
    subject: string;
    date: string;
    reason: string;
    status: 'pending' | 'teacher_approved' | 'teacher_rejected' | 'admin_reviewed';
    teacherResponse?: string;
    teacherReviewedAt?: number;
    createdAt: number;
}

interface AdminDisputeLogsProps {
    disputes: Dispute[];
}

export function AdminDisputeLogs({ disputes }: AdminDisputeLogsProps) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending Teacher Review</Badge>;
            case 'teacher_approved':
                return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Teacher Approved</Badge>;
            case 'teacher_rejected':
                return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Teacher Rejected</Badge>;
            case 'admin_reviewed':
                return <Badge><CheckCircle className="h-3 w-3 mr-1" />Admin Reviewed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Dispute Review Logs
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    All dispute submissions and teacher responses
                </p>
            </CardHeader>
            <CardContent>
                {disputes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No disputes to review</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {disputes.map((dispute) => (
                            <Card key={dispute.id} className="border">
                                <CardContent className="pt-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-foreground">{dispute.studentName}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {dispute.subject} • {new Date(dispute.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {getStatusBadge(dispute.status)}
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-foreground">Student's Reason:</p>
                                            <p className="text-sm text-muted-foreground">{dispute.reason}</p>
                                        </div>

                                        {dispute.teacherResponse && (
                                            <div className="bg-muted/50 p-3 rounded-md">
                                                <p className="text-sm font-medium text-foreground mb-1">Teacher's Response:</p>
                                                <p className="text-sm text-foreground">{dispute.teacherResponse}</p>
                                                {dispute.teacherReviewedAt && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Reviewed: {new Date(dispute.teacherReviewedAt).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
