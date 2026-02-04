'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Clock, Plus, X, Edit } from 'lucide-react';
import { 
    createOvertimeRequestAction, 
    getOvertimeRequestsAction,
    cancelOvertimeRequestAction,
    extendOvertimeRequestAction
} from '@/app/actions/overtime';
import { IOvertimeRequest } from '@/lib/models';

export default function OvertimeRequestManager() {
    const [requests, setRequests] = useState<IOvertimeRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingRequest, setEditingRequest] = useState<IOvertimeRequest | null>(null);
    
    // Form state
    const [date, setDate] = useState('');
    const [requestedHours, setRequestedHours] = useState('');
    const [reason, setReason] = useState('');

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        const result = await getOvertimeRequestsAction();
        if (result.success && result.data) {
            setRequests(result.data as IOvertimeRequest[]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingRequest) {
                // Extend existing request
                const result = await extendOvertimeRequestAction(
                    editingRequest.id,
                    parseFloat(requestedHours),
                    reason
                );
                
                if (result.success) {
                    alert('Overtime request updated successfully!');
                    resetForm();
                    loadRequests();
                } else {
                    alert(result.error || 'Failed to update request');
                }
            } else {
                // Create new request
                const result = await createOvertimeRequestAction({
                    date,
                    requestedHours: parseFloat(requestedHours),
                    reason
                });

                if (result.success) {
                    alert('Overtime request submitted successfully!');
                    resetForm();
                    loadRequests();
                } else {
                    alert(result.error || 'Failed to submit request');
                }
            }
        } catch (error) {
            alert('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (requestId: string) => {
        if (!confirm('Are you sure you want to cancel this overtime request?')) {
            return;
        }

        setLoading(true);
        try {
            const result = await cancelOvertimeRequestAction(requestId);
            if (result.success) {
                alert('Overtime request canceled');
                loadRequests();
            } else {
                alert(result.error || 'Failed to cancel request');
            }
        } catch (error) {
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (request: IOvertimeRequest) => {
        setEditingRequest(request);
        setDate(request.date);
        setRequestedHours(request.requestedHours.toString());
        setReason(request.reason);
        setShowForm(true);
    };

    const resetForm = () => {
        setDate('');
        setRequestedHours('');
        setReason('');
        setShowForm(false);
        setEditingRequest(null);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Overtime Requests
                        </CardTitle>
                        {!showForm && (
                            <Button onClick={() => setShowForm(true)} size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                New Request
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {showForm && (
                        <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-lg bg-gray-50">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold">
                                    {editingRequest ? 'Edit Overtime Request' : 'New Overtime Request'}
                                </h3>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetForm}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    disabled={!!editingRequest}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="hours">Requested Overtime Hours</Label>
                                <Input
                                    id="hours"
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    max="8"
                                    value={requestedHours}
                                    onChange={(e) => setRequestedHours(e.target.value)}
                                    placeholder="e.g., 2.5"
                                    required
                                />
                                <p className="text-xs text-gray-500">
                                    Maximum 8 hours of overtime per day
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reason">Reason</Label>
                                <Textarea
                                    id="reason"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Explain why you need to work overtime..."
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Submitting...' : editingRequest ? 'Update Request' : 'Submit Request'}
                                </Button>
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    )}

                    <div className="space-y-3">
                        {requests.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">
                                No overtime requests yet
                            </p>
                        ) : (
                            requests.map((request) => (
                                <div
                                    key={request.id}
                                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-medium">
                                                    {new Date(request.date).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                                <Badge className={getStatusColor(request.status)}>
                                                    {request.status.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <div className="text-sm space-y-1">
                                                <p>
                                                    <span className="font-medium">Requested Hours:</span>{' '}
                                                    {request.requestedHours} hours
                                                </p>
                                                {request.actualOvertimeHours && (
                                                    <p>
                                                        <span className="font-medium">Actual Overtime:</span>{' '}
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
                                                    Requested on:{' '}
                                                    {new Date(request.requestedAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        {request.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEdit(request)}
                                                >
                                                    <Edit className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleCancel(request.id)}
                                                    disabled={loading}
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
