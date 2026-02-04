'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    FileEdit, 
    Calendar, 
    User, 
    Clock, 
    Filter,
    Search,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { getAttendanceLogsAction } from '@/app/actions/attendance';

interface AttendanceLog {
    id: string;
    attendanceId: string;
    employeeId: string;
    employeeName?: string;
    action: string;
    editedBy: string;
    editedByName?: string;
    reason: string;
    timestamp: string;
    attachmentUrl?: string;
    changes?: {
        field: string;
        oldValue: string;
        newValue: string;
    }[];
}

export default function AttendanceLogsPage() {
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filteredLogs, setFilteredLogs] = useState<AttendanceLog[]>([]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const result = await getAttendanceLogsAction({
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            });
            if (result.success && result.logs) {
                setLogs(result.logs as AttendanceLog[]);
                setFilteredLogs(result.logs as AttendanceLog[]);
            }
        } catch (error) {
            console.error('Error fetching attendance logs:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    useEffect(() => {
        let filtered = logs;
        
        if (searchTerm) {
            filtered = filtered.filter(log => 
                log.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.editedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.reason?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        setFilteredLogs(filtered);
    }, [searchTerm, logs]);

    const getActionBadgeColor = (action: string) => {
        switch (action) {
            case 'edited':
                return 'bg-blue-500';
            case 'created':
                return 'bg-green-500';
            case 'deleted':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return {
            date: date.toLocaleDateString('en-IN', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            }),
            time: date.toLocaleTimeString('en-IN', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
            })
        };
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Attendance Edit Logs</h1>
                <p className="text-muted-foreground">View all attendance modifications and audit trail</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Edits</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <FileEdit className="h-5 w-5 text-blue-600" />
                            <span className="text-2xl font-bold">{logs.length}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Edits</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-green-600" />
                            <span className="text-2xl font-bold">
                                {logs.filter(log => {
                                    const logDate = new Date(log.timestamp).toDateString();
                                    const today = new Date().toDateString();
                                    return logDate === today;
                                }).length}
                            </span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Last 7 Days</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-600" />
                            <span className="text-2xl font-bold">
                                {logs.filter(log => {
                                    const logDate = new Date(log.timestamp);
                                    const weekAgo = new Date();
                                    weekAgo.setDate(weekAgo.getDate() - 7);
                                    return logDate >= weekAgo;
                                }).length}
                            </span>
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search by name, editor, or reason..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={fetchLogs}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Edit History ({filteredLogs.length} records)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                            </div>
                        ) : filteredLogs.length > 0 ? (
                            filteredLogs.map((log) => {
                                const { date, time } = formatTimestamp(log.timestamp);
                                return (
                                    <div key={log.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <FileEdit className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-semibold">{log.employeeName || log.employeeId}</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">Edited by: {log.editedByName || log.editedBy}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge className={getActionBadgeColor(log.action)}>
                                                    {log.action.toUpperCase()}
                                                </Badge>
                                                <div className="mt-1 text-xs text-muted-foreground">
                                                    <div>{date}</div>
                                                    <div>{time}</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {log.reason && (
                                            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                                                <div className="flex items-start gap-2">
                                                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-medium text-amber-900">Reason:</p>
                                                        <p className="text-sm text-amber-800">{log.reason}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {log.attachmentUrl && (
                                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                                <p className="text-sm font-medium text-blue-900 mb-2">Attachment:</p>
                                                <a 
                                                    href={log.attachmentUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-block"
                                                >
                                                    <img 
                                                        src={log.attachmentUrl} 
                                                        alt="Attachment" 
                                                        className="max-w-xs max-h-40 rounded border object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                    />
                                                </a>
                                            </div>
                                        )}
                                        
                                        {log.changes && log.changes.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                <p className="text-sm font-medium text-muted-foreground">Changes:</p>
                                                {log.changes.map((change, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-sm">
                                                        <span className="font-medium">{change.field}:</span>
                                                        <span className="text-red-600 line-through">{change.oldValue}</span>
                                                        <span>→</span>
                                                        <span className="text-green-600">{change.newValue}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12">
                                <FileEdit className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground">No attendance edit logs found</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
