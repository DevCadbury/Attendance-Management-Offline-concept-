'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, MapPin, Clock, User, Filter } from 'lucide-react';
import { getOTPActivityLogsAction, getOTPActivityLogsByEmployeeAction } from '@/app/actions/otp-logs';
import { getAllEmployeesAction } from '@/app/actions/users';

export default function OTPLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterAction, setFilterAction] = useState<'all' | 'request' | 'validate'>('all');
    const [filterType, setFilterType] = useState<'all' | 'entry' | 'exit'>('all');
    const [filterSuccess, setFilterSuccess] = useState<'all' | 'success' | 'failed'>('all');

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
        return () => clearInterval(interval);
    }, [filterEmployee]);

    async function loadData() {
        try {
            setLoading(true);
            
            // Load employees
            const empResult = await getAllEmployeesAction();
            if (empResult.success && empResult.employees) {
                setEmployees(empResult.employees);
            }

            // Load logs
            let logsResult;
            if (filterEmployee) {
                logsResult = await getOTPActivityLogsByEmployeeAction(filterEmployee);
            } else {
                logsResult = await getOTPActivityLogsAction();
            }

            if (logsResult.success && logsResult.logs) {
                setLogs(logsResult.logs);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }

    function getTimeAgo(timestamp: number): string {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    // Apply filters
    const filteredLogs = logs.filter(log => {
        if (filterAction !== 'all' && log.action !== filterAction) return false;
        if (filterType !== 'all' && log.type !== filterType) return false;
        if (filterSuccess === 'success' && !log.success) return false;
        if (filterSuccess === 'failed' && log.success) return false;
        return true;
    });

    // Calculate statistics
    const stats = {
        total: filteredLogs.length,
        requests: filteredLogs.filter(l => l.action === 'request').length,
        validations: filteredLogs.filter(l => l.action === 'validate').length,
        successful: filteredLogs.filter(l => l.success).length,
        failed: filteredLogs.filter(l => !l.success).length,
        entries: filteredLogs.filter(l => l.type === 'entry').length,
        exits: filteredLogs.filter(l => l.type === 'exit').length
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">OTP Activity Logs</h1>
                <Button onClick={loadData} disabled={loading} variant="outline">
                    Refresh
                </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-blue-100">
                                <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Logs</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-green-100">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Successful</p>
                                <p className="text-2xl font-bold">{stats.successful}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-red-100">
                                <XCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Failed</p>
                                <p className="text-2xl font-bold">{stats.failed}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Breakdown</p>
                            <div className="flex gap-3 text-sm">
                                <span>Requests: <strong>{stats.requests}</strong></span>
                                <span>Validations: <strong>{stats.validations}</strong></span>
                            </div>
                            <div className="flex gap-3 text-sm">
                                <span>Entry: <strong>{stats.entries}</strong></span>
                                <span>Exit: <strong>{stats.exits}</strong></span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>Employee</Label>
                            <select 
                                className="w-full border rounded-md p-2"
                                value={filterEmployee}
                                onChange={(e) => setFilterEmployee(e.target.value)}
                            >
                                <option value="">All Employees</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Action</Label>
                            <select 
                                className="w-full border rounded-md p-2"
                                value={filterAction}
                                onChange={(e) => setFilterAction(e.target.value as any)}
                            >
                                <option value="all">All Actions</option>
                                <option value="request">OTP Requests</option>
                                <option value="validate">OTP Validations</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <select 
                                className="w-full border rounded-md p-2"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as any)}
                            >
                                <option value="all">All Types</option>
                                <option value="entry">Entry</option>
                                <option value="exit">Exit</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <select 
                                className="w-full border rounded-md p-2"
                                value={filterSuccess}
                                onChange={(e) => setFilterSuccess(e.target.value as any)}
                            >
                                <option value="all">All Status</option>
                                <option value="success">Successful</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Logs List */}
            <Card>
                <CardHeader>
                    <CardTitle>Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {filteredLogs.length > 0 ? (
                            filteredLogs.map((log) => (
                                <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    {/* Profile Picture */}
                                    <div className="flex-shrink-0">
                                        <img
                                            src={log.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(log.employeeName)}&background=random`}
                                            alt={log.employeeName}
                                            className="w-12 h-12 rounded-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(log.employeeName)}&background=random`;
                                            }}
                                        />
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-semibold">{log.employeeName}</p>
                                                <p className="text-sm text-muted-foreground">{log.employeeEmail}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className={log.type === 'entry' ? 'bg-blue-500' : 'bg-purple-500'}>
                                                    {log.type.toUpperCase()}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {log.action === 'request' ? 'OTP Request' : 'OTP Validation'}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground">
                                                    {getTimeAgo(log.timestamp)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span>{new Date(log.timestamp).toLocaleString('en-IN')}</span>
                                            </div>
                                            {log.success ? (
                                                <div className="flex items-center gap-1 text-green-600">
                                                    <CheckCircle className="h-4 w-4" />
                                                    <span>Success</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-red-600">
                                                    <XCircle className="h-4 w-4" />
                                                    <span>Failed</span>
                                                </div>
                                            )}
                                        </div>

                                        {log.errorMessage && (
                                            <p className="text-sm text-red-600">Error: {log.errorMessage}</p>
                                        )}

                                        {log.location && (
                                            <div className="flex items-start gap-2 text-sm text-muted-foreground pt-2 border-t">
                                                <MapPin className="h-4 w-4 mt-0.5" />
                                                <div>
                                                    <p>{log.location.address || 'Address not available'}</p>
                                                    <p className="text-xs">
                                                        Lat: {log.location.latitude}, Lng: {log.location.longitude}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No OTP activity logs found</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
