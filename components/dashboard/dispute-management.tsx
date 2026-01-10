'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    getPendingDisputesAction,
    approveDisputeAction,
    rejectDisputeAction,
    unlockSessionForEditingAction,
    lockSessionAction
} from '@/app/actions/disputes';
import { getAllSessionsAction } from '@/app/actions/attendance';
import { Dispute, Session } from '@/lib/db';
import { toast } from 'sonner';
import { MessageSquare, CheckCircle, XCircle, Lock, Unlock, AlertTriangle } from 'lucide-react';

export function DisputeManagement({ adminId }: { adminId: string }) {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [disputesData, sessionsData] = await Promise.all([
            getPendingDisputesAction(),
            getAllSessionsAction()
        ]);
        setDisputes(disputesData);
        setSessions(sessionsData);
        setLoading(false);
    };

    const handleApprove = async (disputeId: string) => {
        const result = await approveDisputeAction(disputeId, adminId);
        if (result.success) {
            toast.success(result.message);
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const handleReject = async (disputeId: string) => {
        const result = await rejectDisputeAction(disputeId, adminId);
        if (result.success) {
            toast.success(result.message);
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const handleUnlockSession = async (sessionId: string) => {
        const result = await unlockSessionForEditingAction(sessionId);
        if (result.success) {
            toast.success(result.message);
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const handleLockSession = async (sessionId: string) => {
        const result = await lockSessionAction(sessionId);
        if (result.success) {
            toast.success(result.message);
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const lockedSessions = sessions.filter(s => s.locked && !s.unlockedByAdmin);
    const unlockedSessions = sessions.filter(s => s.locked && s.unlockedByAdmin);

    if (loading) {
        return <div className="text-center p-8">Loading disputes...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Pending Disputes */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Pending Disputes ({disputes.length})
                    </CardTitle>
                    <CardDescription>
                        Students reporting attendance issues - review and approve/reject
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {disputes.length > 0 ? (
                            disputes.map(dispute => {
                                const session = sessions.find(s => s.id === dispute.sessionId);
                                const daysAgo = Math.floor((Date.now() - dispute.createdAt) / (1000 * 60 * 60 * 24));
                                
                                return (
                                    <div key={dispute.id} className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/10">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-semibold">{dispute.studentName}</p>
                                                    {daysAgo >= 1 && (
                                                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs rounded-full">
                                                            {daysAgo} day{daysAgo > 1 ? 's' : ''} ago
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Session: {session?.subject} ({new Date(session?.startTime || 0).toLocaleDateString()})
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-gray-900 p-3 rounded-md mb-3">
                                            <p className="text-sm font-medium mb-1">Reason:</p>
                                            <p className="text-sm text-muted-foreground">{dispute.reason}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => handleApprove(dispute.id)}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Approve & Unlock
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleReject(dispute.id)}
                                            >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12">
                                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                                <p className="text-muted-foreground">No pending disputes</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Session Lock Management */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Unlock className="h-5 w-5 text-green-600" />
                            Unlocked Sessions
                        </CardTitle>
                        <CardDescription>
                            Sessions unlocked for teacher editing
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {unlockedSessions.map(session => (
                                <div key={session.id} className="flex justify-between items-center p-3 border rounded-lg bg-green-50 dark:bg-green-950/10">
                                    <div>
                                        <p className="font-medium text-sm">{session.subject}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(session.startTime).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleLockSession(session.id)}
                                    >
                                        <Lock className="h-4 w-4 mr-1" />
                                        Lock
                                    </Button>
                                </div>
                            ))}
                            {unlockedSessions.length === 0 && (
                                <p className="text-center text-muted-foreground py-4 text-sm">
                                    No unlocked sessions
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-red-600" />
                            Manual Unlock
                        </CardTitle>
                        <CardDescription>
                            Unlock sessions for teacher to edit attendance
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {lockedSessions.slice(-10).map(session => (
                                <div key={session.id} className="flex justify-between items-center p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium text-sm">{session.subject}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(session.startTime).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleUnlockSession(session.id)}
                                    >
                                        <Unlock className="h-4 w-4 mr-1" />
                                        Unlock
                                    </Button>
                                </div>
                            ))}
                            {lockedSessions.length === 0 && (
                                <p className="text-center text-muted-foreground py-4 text-sm">
                                    All sessions unlocked
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Info Card */}
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium">How Disputes Work:</p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                                <li>• Students can raise disputes for sessions marked as absent</li>
                                <li>• Disputed sessions are automatically unlocked for 2 days</li>
                                <li>• Teachers can edit attendance during grace period</li>
                                <li>• After 2 days, disputes auto-reject and lock again</li>
                                <li>• Admins can manually approve/reject anytime</li>
                                <li>• Approved disputes keep sessions unlocked for teachers</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
