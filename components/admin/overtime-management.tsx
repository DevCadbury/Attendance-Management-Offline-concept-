'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Clock, Check, X, Search } from 'lucide-react';
import { 
    getOvertimeRequestsAction,
    approveOvertimeRequestAction,
    rejectOvertimeRequestAction
} from '@/app/actions/overtime';
import { IOvertimeRequest } from '@/lib/models';

export default function OvertimeManagement() {
    const [requests, setRequests] = useState<IOvertimeRequest[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<IOvertimeRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        loadRequests();
    }, []);

    useEffect(() => {
        filterRequests();
    }, [requests, searchTerm, statusFilter]);

    const loadRequests = async () => {
        setLoading(true);
        const result = await getOvertimeRequestsAction();
        if (result.success && result.data) {
            setRequests(result.data as IOvertimeRequest[]);
        }
        setLoading(false);
    };

    const filterRequests = () => {
        let filtered = [...requests];

        if (statusFilter !== 'all') {
            filtered = filtered.filter(r => r.status === statusFilter);
        }

        if (searchTerm) {
            filtered = filtered.filter(r => 
                r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredRequests(filtered);
    };

    const handleApprove = async (requestId: string) => {
        if (!confirm('Are you sure you want to approve this overtime request?')) {
            return;
        }

        setLoading(true);
        try {
            const result = await approveOvertimeRequestAction(requestId);
            if (result.success) {
                alert('Overtime request approved successfully!');
                loadRequests();
            } else {
                alert(result.error || 'Failed to approve request');
            }
        } catch (error) {
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleRejectClick = (requestId: string) => {
        setRejectingId(requestId);
        setRejectionReason('');
    };

    const handleRejectSubmit = async () => {
        if (!rejectionReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        if (!rejectingId) return;

        setLoading(true);
        try {
            const result = await rejectOvertimeRequestAction(rejectingId, rejectionReason);
            if (result.success) {
                alert('Overtime request rejected');
                setRejectingId(null);
                setRejectionReason('');
                loadRequests();
            } else {
                alert(result.error || 'Failed to reject request');
            }
        } catch (error) {
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const pendingCount = requests.filter(r => r.status === 'pending').length;
    const approvedCount = requests.filter(r => r.status === 'approved').length;
    const rejectedCount = requests.filter(r => r.status === 'rejected').length;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Overtime Request Management
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="p-4 border rounded-lg">
                            <div className="text-2xl font-bold">{requests.length}</div>
                            <div className="text-sm text-gray-600">Total Requests</div>
                        </div>
                        <div className="p-4 border rounded-lg bg-yellow-50">
                            <div className="text-2xl font-bold text-yellow-700">{pendingCount}</div>
                            <div className="text-sm text-yellow-600">Pending</div>
                        </div>
                        <div className="p-4 border rounded-lg bg-green-50">
                            <div className="text-2xl font-bold text-green-700">{approvedCount}</div>
                            <div className="text-sm text-green-600">Approved</div>
                        </div>
                        <div className="p-4 border rounded-lg bg-red-50">
                            <div className="text-2xl font-bold text-red-700">{rejectedCount}</div>
                            <div className="text-sm text-red-600">Rejected</div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search by employee name or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={statusFilter === 'all' ? 'default' : 'outline'}
                                onClick={() => setStatusFilter('all')}
                                size="sm"
                            >
                                All
                            </Button>
                            <Button
                                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                                onClick={() => setStatusFilter('pending')}
                                size="sm"
                            >
                                Pending
                            </Button>
                            <Button
                                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                                onClick={() => setStatusFilter('approved')}
                                size="sm"
                            >
                                Approved
                            </Button>
                            <Button
                                variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                                onClick={() => setStatusFilter('rejected')}
                                size="sm"
                            >
                                Rejected
                            </Button>
                        </div>
                    </div>

                    {/* Requests List */}
                    <div className="space-y-3">
                        {loading && filteredRequests.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">Loading...</p>
                        ) : filteredRequests.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">
                                No overtime requests found
                            </p>
                        ) : (
                            filteredRequests.map((request) => (
                                <div
                                    key={request.id}
                                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-semibold">{request.employeeName}</span>
                                                <Badge className={getStatusColor(request.status)}>
                                                    {request.status.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <div className="text-sm space-y-1">
                                                <p>
                                                    <span className="font-medium">Date:</span>{' '}
                                                    {new Date(request.date).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                                <p>
                                                    <span className="font-medium">Requested Hours:</span>{' '}
                                                    {request.requestedHours} hours
                                                </p>
                                                {request.actualOvertimeHours && (
                                                    <p className="text-green-600">
                                                        <span className="font-medium">Actual Overtime Worked:</span>{' '}
                                                        {request.actualOvertimeHours} hours
                                                    </p>
                                                )}
                                                <p>
                                                    <span className="font-medium">Reason:</span> {request.reason}
                                                </p>
                                                {request.rejectionReason && (
                                                    <p className="text-red-600">
                                                        <span className="font-medium">Rejection Reason:</span>{' '}
                                                        {request.rejectionReason}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500">
                                                    Requested: {new Date(request.requestedAt).toLocaleString()}
                                                </p>
                                                {request.approvedAt && (
                                                    <p className="text-xs text-green-600">
                                                        Approved: {new Date(request.approvedAt).toLocaleString()}
                                                    </p>
                                                )}
                                                {request.rejectedAt && (
                                                    <p className="text-xs text-red-600">
                                                        Rejected: {new Date(request.rejectedAt).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {request.status === 'pending' && (
                                            <div className="flex gap-2 ml-4">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApprove(request.id)}
                                                    disabled={loading}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    <Check className="w-4 h-4 mr-1" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleRejectClick(request.id)}
                                                    disabled={loading}
                                                >
                                                    <X className="w-4 h-4 mr-1" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Rejection Form */}
                                    {rejectingId === request.id && (
                                        <div className="mt-4 p-3 border-t space-y-3">
                                            <Label>Rejection Reason</Label>
                                            <Textarea
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                placeholder="Explain why this overtime request is being rejected..."
                                                rows={3}
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={handleRejectSubmit}
                                                    disabled={loading || !rejectionReason.trim()}
                                                >
                                                    Confirm Rejection
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setRejectingId(null);
                                                        setRejectionReason('');
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
