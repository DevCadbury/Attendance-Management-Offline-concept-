import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getStudentDisputesAction } from '@/app/actions/disputes';
import { getAllSessionsAction } from '@/app/actions/attendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';

export default async function StudentDisputesPage() {
    const session = await getSession();
    if (!session || session.role !== 'student') redirect('/login');

    const disputes = await getStudentDisputesAction(session.id);
    const allSessions = await getAllSessionsAction();

    // Get session details for each dispute
    const disputesWithDetails = disputes.map(dispute => {
        const relatedSession = allSessions.find(s => s.id === dispute.sessionId);
        return {
            ...dispute,
            subject: relatedSession?.subject || 'Unknown',
            date: relatedSession?.startTime ? new Date(relatedSession.startTime).toLocaleDateString() : 'Unknown'
        };
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">My Attendance Disputes</h1>
                <p className="text-muted-foreground">View and track your attendance dispute requests</p>
            </div>

            {disputesWithDetails.length === 0 ? (
                <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>You have no disputes. Disputes can be raised from the attendance calendar.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {disputesWithDetails.map((dispute) => (
                        <Card key={dispute.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{dispute.subject}</CardTitle>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span>{dispute.date}</span>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        dispute.status === 'pending' ? 'bg-yellow-500/20 text-yellow-700' :
                                        dispute.status === 'approved' ? 'bg-green-500/20 text-green-700' :
                                        'bg-red-500/20 text-red-700'
                                    }`}>
                                        {dispute.status === 'pending' && <AlertCircle className="h-3 w-3 inline mr-1" />}
                                        {dispute.status === 'approved' && <CheckCircle className="h-3 w-3 inline mr-1" />}
                                        {dispute.status === 'rejected' && <XCircle className="h-3 w-3 inline mr-1" />}
                                        {dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium mb-1">Your Reason:</p>
                                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                                        {dispute.reason}
                                    </p>
                                </div>
                                {dispute.status === 'rejected' && dispute.rejectionMessage && (
                                    <div>
                                        <p className="text-sm font-medium mb-1 text-red-700 dark:text-red-400">Teacher's Response:</p>
                                        <p className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                                            {dispute.rejectionMessage}
                                        </p>
                                    </div>
                                )}
                                {dispute.status === 'approved' && (
                                    <div className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                                        <CheckCircle className="h-4 w-4 inline mr-2" />
                                        Your attendance has been updated to Present.
                                    </div>
                                )}
                                <div className="text-xs text-muted-foreground">
                                    Raised on {new Date(dispute.createdAt).toLocaleString()}
                                    {dispute.resolvedAt && (
                                        <> • Resolved on {new Date(dispute.resolvedAt).toLocaleString()}</>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
