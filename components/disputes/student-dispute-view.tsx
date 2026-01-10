'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Dispute {
    id: string;
    sessionId: string;
    subject: string;
    date: string;
    reason: string;
    evidence?: string;
    status: 'pending' | 'teacher_approved' | 'teacher_rejected';
    teacherResponse?: string;
    teacherReviewedAt?: number;
    createdAt: number;
}

interface StudentDisputeViewProps {
    disputes: Dispute[];
    onCreateDispute: (sessionId: string, reason: string, evidence?: File) => Promise<void>;
}

export function StudentDisputeView({ disputes, onCreateDispute }: StudentDisputeViewProps) {
    const [showCreateForm, setShowCreateForm] = useState(false);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Under Review</Badge>;
            case 'teacher_approved':
                return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
            case 'teacher_rejected':
                return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                My Disputes
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                View and track your attendance dispute submissions
                            </p>
                        </div>
                        <Button onClick={() => setShowCreateForm(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Raise Dispute
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {disputes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No disputes raised yet</p>
                            <p className="text-sm mt-1">You can raise a dispute if you believe your attendance was marked incorrectly</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {disputes.map((dispute) => (
                                <Card key={dispute.id} className="border">
                                    <CardContent className="pt-4">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-semibold text-foreground">{dispute.subject}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(dispute.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                {getStatusBadge(dispute.status)}
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-foreground">Your Reason:</p>
                                                <p className="text-sm text-muted-foreground">{dispute.reason}</p>
                                            </div>

                                            {dispute.teacherResponse && (
                                                <div className="bg-muted/50 p-3 rounded-md">
                                                    <p className="text-sm font-medium text-foreground mb-1">
                                                        Teacher's Response:
                                                    </p>
                                                    <p className="text-sm text-foreground">{dispute.teacherResponse}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Reviewed: {dispute.teacherReviewedAt && new Date(dispute.teacherReviewedAt).toLocaleString()}
                                                    </p>
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
        </div>
    );
}
