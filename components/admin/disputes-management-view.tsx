'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, User, AlertCircle } from 'lucide-react';
import { resolveDisputeAction } from '@/app/actions/disputes';
import { toast } from 'sonner';
import Link from 'next/link';

interface DisputesManagementViewProps {
    initialDisputes: any[];
    employees: any[];
}

export default function DisputesManagementView({ initialDisputes, employees }: DisputesManagementViewProps) {
    const [disputes, setDisputes] = useState(initialDisputes);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [search, setSearch] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectionMessage, setRejectionMessage] = useState('');
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    async function handleApprove(disputeId: string) {
        setProcessingId(disputeId);
        const result = await resolveDisputeAction(disputeId, 'approved');
        setProcessingId(null);

        if (result.success) {
            toast.success('Dispute approved');
            setDisputes(disputes.map(d => 
                d.id === disputeId ? { ...d, status: 'approved' } : d
            ));
        } else {
            toast.error(result.error || 'Failed to approve dispute');
        }
    }

    async function handleReject(disputeId: string) {
        if (!rejectionMessage.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        setProcessingId(disputeId);
        const result = await resolveDisputeAction(disputeId, 'rejected', '', rejectionMessage);
        setProcessingId(null);

        if (result.success) {
            toast.success('Dispute rejected');
            setDisputes(disputes.map(d => 
                d.id === disputeId ? { ...d, status: 'rejected', rejectionMessage } : d
            ));
            setRejectingId(null);
            setRejectionMessage('');
        } else {
            toast.error(result.error || 'Failed to reject dispute');
        }
    }

    const filteredDisputes = disputes.filter(dispute => {
        const matchesFilter = filter === 'all' || dispute.status === filter;
        const matchesSearch = search === '' || 
            dispute.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
            dispute.reason?.toLowerCase().includes(search.toLowerCase()) ||
            dispute.date?.includes(search);
        return matchesFilter && matchesSearch;
    });

    const stats = {
        total: disputes.length,
        pending: disputes.filter(d => d.status === 'pending').length,
        approved: disputes.filter(d => d.status === 'approved').length,
        rejected: disputes.filter(d => d.status === 'rejected').length,
    };

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Total Disputes</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Clock className="h-8 w-8 text-amber-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Pending</p>
                                <p className="text-2xl font-bold">{stats.pending}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Approved</p>
                                <p className="text-2xl font-bold">{stats.approved}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <XCircle className="h-8 w-8 text-red-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Rejected</p>
                                <p className="text-2xl font-bold">{stats.rejected}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        <Input 
                            placeholder="Search by employee, date, or reason..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-md"
                        />
                        <div className="flex gap-2">
                            <Button 
                                variant={filter === 'all' ? 'default' : 'outline'}
                                onClick={() => setFilter('all')}
                                size="sm"
                            >
                                All
                            </Button>
                            <Button 
                                variant={filter === 'pending' ? 'default' : 'outline'}
                                onClick={() => setFilter('pending')}
                                size="sm"
                            >
                                Pending
                            </Button>
                            <Button 
                                variant={filter === 'approved' ? 'default' : 'outline'}
                                onClick={() => setFilter('approved')}
                                size="sm"
                            >
                                Approved
                            </Button>
                            <Button 
                                variant={filter === 'rejected' ? 'default' : 'outline'}
                                onClick={() => setFilter('rejected')}
                                size="sm"
                            >
                                Rejected
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Disputes List */}
            <Card>
                <CardHeader>
                    <CardTitle>Disputes ({filteredDisputes.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                        {filteredDisputes.length > 0 ? (
                            filteredDisputes.map((dispute) => (
                                <div key={dispute.id} className="p-4 border rounded-lg space-y-3">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <Link 
                                                    href={`/admin/employee/${dispute.employeeId}`}
                                                    className="font-semibold hover:underline hover:text-primary"
                                                >
                                                    {dispute.employeeName}
                                                </Link>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Date: {new Date(dispute.date + 'T00:00:00').toLocaleDateString('en-IN', {
                                                    weekday: 'short',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <Badge className={
                                            dispute.status === 'pending' ? 'bg-amber-500' :
                                            dispute.status === 'approved' ? 'bg-green-500' :
                                            'bg-red-500'
                                        }>
                                            {dispute.status.toUpperCase()}
                                        </Badge>
                                    </div>

                                    {/* Reason */}
                                    <div className="p-3 bg-muted rounded-md">
                                        <p className="text-sm font-medium mb-1">Reason:</p>
                                        <p className="text-sm">{dispute.reason}</p>
                                    </div>

                                    {/* Rejection Message */}
                                    {dispute.rejectionMessage && (
                                        <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                                            <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Admin Response:</p>
                                            <p className="text-sm text-red-700 dark:text-red-300">{dispute.rejectionMessage}</p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    {dispute.status === 'pending' && (
                                        <div className="flex gap-2 pt-2 border-t">
                                            {rejectingId === dispute.id ? (
                                                <div className="flex-1 space-y-2">
                                                    <Textarea 
                                                        placeholder="Reason for rejection..."
                                                        value={rejectionMessage}
                                                        onChange={(e) => setRejectionMessage(e.target.value)}
                                                        rows={2}
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            onClick={() => handleReject(dispute.id)}
                                                            disabled={processingId === dispute.id}
                                                            variant="destructive"
                                                            size="sm"
                                                        >
                                                            Confirm Reject
                                                        </Button>
                                                        <Button 
                                                            onClick={() => {
                                                                setRejectingId(null);
                                                                setRejectionMessage('');
                                                            }}
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <Button 
                                                        onClick={() => handleApprove(dispute.id)}
                                                        disabled={processingId === dispute.id}
                                                        variant="default"
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-2" />
                                                        Approve
                                                    </Button>
                                                    <Button 
                                                        onClick={() => setRejectingId(dispute.id)}
                                                        disabled={processingId === dispute.id}
                                                        variant="destructive"
                                                        size="sm"
                                                    >
                                                        <XCircle className="h-4 w-4 mr-2" />
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Timestamp */}
                                    <p className="text-xs text-muted-foreground">
                                        Submitted: {new Date(dispute.createdAt).toLocaleString('en-IN')}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground">No disputes found</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
