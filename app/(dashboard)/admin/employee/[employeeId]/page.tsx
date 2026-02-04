'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    User, 
    Mail, 
    Calendar as CalendarIcon, 
    TrendingUp, 
    Clock, 
    CheckCircle, 
    XCircle, 
    AlertCircle,
    ArrowLeft,
    FileText,
    Activity,
    BarChart3,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { getAllAttendanceAction, getAttendanceLogsAction } from '@/app/actions/attendance';
import { getAllDisputesAction } from '@/app/actions/disputes';
import { getAllEmployeesAction } from '@/app/actions/users';
import { toast } from 'sonner';
import ExportAttendanceDialog from '@/components/admin/export-attendance-dialog';

export default function EmployeeProfilePage() {
    const params = useParams();
    const router = useRouter();
    const employeeId = params?.employeeId as string;
    
    const [employee, setEmployee] = useState<any>(null);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [disputes, setDisputes] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [stats, setStats] = useState({
        totalDays: 0,
        present: 0,
        absent: 0,
        incomplete: 0,
        presentPercentage: 0,
        avgEntryTime: '',
        avgExitTime: ''
    });

    useEffect(() => {
        loadEmployeeData();
    }, [employeeId]);

    async function loadEmployeeData() {
        setLoading(true);
        try {
            // Load employee details
            const employeesResult = await getAllEmployeesAction();
            if (employeesResult.success && employeesResult.employees) {
                const emp = employeesResult.employees.find((e: any) => e.id === employeeId);
                setEmployee(emp);
            }

            // Load attendance
            const attendanceResult = await getAllAttendanceAction();
            if (attendanceResult.success && attendanceResult.attendance) {
                const empAttendance = attendanceResult.attendance.filter(
                    (a: any) => a.employeeId === employeeId
                );
                setAttendance(empAttendance);
                calculateStats(empAttendance);
            }

            // Load disputes
            const disputesResult = await getAllDisputesAction();
            if (disputesResult.success && disputesResult.disputes) {
                const empDisputes = disputesResult.disputes.filter(
                    (d: any) => d.employeeId === employeeId
                );
                setDisputes(empDisputes);
            }

            // Load logs
            const logsResult = await getAttendanceLogsAction({ employeeId });
            if (logsResult.success && logsResult.logs) {
                setLogs(logsResult.logs);
            }
        } catch (error) {
            console.error('Error loading employee data:', error);
            toast.error('Failed to load employee data');
        } finally {
            setLoading(false);
        }
    }

    function calculateStats(attendanceData: any[]) {
        const total = attendanceData.length;
        const present = attendanceData.filter(a => a.status === 'present').length;
        const absent = attendanceData.filter(a => a.status === 'absent').length;
        const incomplete = attendanceData.filter(a => a.status === 'incomplete').length;
        
        const presentPercentage = total > 0 ? Math.round((present / total) * 100) : 0;
        
        // Calculate average times
        const entryTimes = attendanceData
            .filter(a => a.entryTime)
            .map(a => new Date(a.entryTime));
        const exitTimes = attendanceData
            .filter(a => a.exitTime)
            .map(a => new Date(a.exitTime));
        
        let avgEntryTime = '';
        let avgExitTime = '';
        
        if (entryTimes.length > 0) {
            const avgEntry = new Date(
                entryTimes.reduce((sum, time) => sum + time.getTime(), 0) / entryTimes.length
            );
            avgEntryTime = avgEntry.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        }
        
        if (exitTimes.length > 0) {
            const avgExit = new Date(
                exitTimes.reduce((sum, time) => sum + time.getTime(), 0) / exitTimes.length
            );
            avgExitTime = avgExit.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        }
        
        setStats({
            totalDays: total,
            present,
            absent,
            incomplete,
            presentPercentage,
            avgEntryTime,
            avgExitTime
        });
    }

    function previousMonth() {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() - 1);
        setCurrentMonth(newMonth);
    }

    function nextMonth() {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + 1);
        setCurrentMonth(newMonth);
    }

    function generateCalendarDays() {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const startingDayOfWeek = firstDay.getDay();
        const monthLength = lastDay.getDate();
        
        const days = [];
        
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        
        for (let day = 1; day <= monthLength; day++) {
            days.push(new Date(year, month, day));
        }
        
        return days;
    }

    const attendanceByDate = attendance.reduce((acc: any, record) => {
        if (!acc[record.date]) {
            acc[record.date] = [];
        }
        acc[record.date].push(record);
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="p-6">
                <div className="text-center">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Employee Not Found</h2>
                    <Button onClick={() => router.back()}>Go Back</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-3xl font-bold">Employee Profile</h1>
                </div>
                <ExportAttendanceDialog employeeId={employeeId} employeeName={employee?.name} />
            </div>

            {/* Employee Info Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-start gap-6">
                        <img
                            src={employee.profilePictureUrl || '/default-avatar.png'}
                            alt={employee.name}
                            className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                        />
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold mb-2">{employee.name}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">ID:</span>
                                    <span>{employee.id}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Email:</span>
                                    <span>{employee.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={employee.locked ? 'destructive' : 'default'}>
                                        {employee.locked ? 'Locked' : 'Active'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Days</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-blue-600" />
                            <span className="text-2xl font-bold">{stats.totalDays}</span>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Present</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-2xl font-bold text-green-600">{stats.present}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.presentPercentage}% attendance
                        </p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Absent</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-600" />
                            <span className="text-2xl font-bold text-red-600">{stats.absent}</span>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Incomplete</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-orange-600" />
                            <span className="text-2xl font-bold text-orange-600">{stats.incomplete}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Average Times */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Average Entry Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-green-600" />
                            <span className="text-xl font-semibold">{stats.avgEntryTime || 'N/A'}</span>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Average Exit Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-red-600" />
                            <span className="text-xl font-semibold">{stats.avgExitTime || 'N/A'}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Attendance Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Attendance Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>Present</span>
                                <span className="font-medium">{stats.present} days</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-green-600 h-2 rounded-full transition-all"
                                    style={{ width: `${stats.totalDays > 0 ? (stats.present / stats.totalDays) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>Absent</span>
                                <span className="font-medium">{stats.absent} days</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-red-600 h-2 rounded-full transition-all"
                                    style={{ width: `${stats.totalDays > 0 ? (stats.absent / stats.totalDays) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>Incomplete</span>
                                <span className="font-medium">{stats.incomplete} days</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-orange-600 h-2 rounded-full transition-all"
                                    style={{ width: `${stats.totalDays > 0 ? (stats.incomplete / stats.totalDays) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Attendance Calendar */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            Attendance Calendar
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={previousMonth}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium min-w-32 text-center">
                                {currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                            </span>
                            <Button variant="outline" size="sm" onClick={nextMonth}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-7 gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center font-semibold text-sm p-2 border-b">
                                {day}
                            </div>
                        ))}
                        
                        {generateCalendarDays().map((date, index) => {
                            if (!date) {
                                return <div key={`empty-${index}`} className="p-2 min-h-20" />;
                            }
                            
                            const dateStr = date.toISOString().split('T')[0];
                            const dayRecords = attendanceByDate[dateStr] || [];
                            const dayStatus = dayRecords[0]?.status;
                            const isToday = dateStr === new Date().toISOString().split('T')[0];
                            
                            return (
                                <div
                                    key={dateStr}
                                    className={`
                                        p-2 min-h-20 border rounded-lg transition-all
                                        ${isToday ? 'border-primary border-2' : ''}
                                        ${dayStatus === 'present' ? 'bg-green-50 border-green-300' : ''}
                                        ${dayStatus === 'absent' ? 'bg-red-50 border-red-300' : ''}
                                        ${dayStatus === 'incomplete' ? 'bg-orange-50 border-orange-300' : ''}
                                        ${!dayStatus ? 'bg-white' : ''}
                                    `}
                                >
                                    <div className="font-semibold text-sm mb-1">
                                        {date.getDate()}
                                    </div>
                                    {dayRecords.length > 0 && (
                                        <div className="space-y-1">
                                            {dayStatus === 'present' && (
                                                <div className="flex items-center gap-1 text-xs text-green-700">
                                                    <CheckCircle className="h-3 w-3" />
                                                    <span>Present</span>
                                                </div>
                                            )}
                                            {dayStatus === 'absent' && (
                                                <div className="flex items-center gap-1 text-xs text-red-700">
                                                    <XCircle className="h-3 w-3" />
                                                    <span>Absent</span>
                                                </div>
                                            )}
                                            {dayStatus === 'incomplete' && (
                                                <div className="flex items-center gap-1 text-xs text-orange-700">
                                                    <AlertCircle className="h-3 w-3" />
                                                    <span>Incomplete</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Disputes */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Disputes ({disputes.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {disputes.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {disputes.map((dispute: any) => (
                                <div key={dispute.id} className="p-4 border rounded-lg">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-medium">{dispute.reason}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(dispute.timestamp).toLocaleDateString('en-IN')}
                                            </p>
                                        </div>
                                        <Badge 
                                            variant={
                                                dispute.status === 'approved' ? 'default' :
                                                dispute.status === 'rejected' ? 'destructive' :
                                                'secondary'
                                            }
                                        >
                                            {dispute.status}
                                        </Badge>
                                    </div>
                                    {dispute.adminResponse && (
                                        <p className="text-sm bg-muted p-2 rounded mt-2">
                                            <span className="font-medium">Admin Response:</span> {dispute.adminResponse}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No disputes found</p>
                    )}
                </CardContent>
            </Card>

            {/* Activity Logs */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Activity Logs ({logs.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {logs.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {logs.map((log: any) => (
                                <div key={log.id} className="p-4 border rounded-lg">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Badge>{log.action}</Badge>
                                                <span className="text-sm text-muted-foreground">
                                                    {new Date(log.timestamp).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                            {log.editedByName && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Edited by: {log.editedByName}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {log.reason && (
                                        <p className="text-sm bg-amber-50 border border-amber-200 p-2 rounded mt-2">
                                            <span className="font-medium">Reason:</span> {log.reason}
                                        </p>
                                    )}
                                    {log.attachmentUrl && (
                                        <div className="mt-2">
                                            <a 
                                                href={log.attachmentUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="inline-block"
                                            >
                                                <img 
                                                    src={log.attachmentUrl} 
                                                    alt="Attachment" 
                                                    className="max-w-xs max-h-32 rounded border object-cover cursor-pointer hover:opacity-90"
                                                />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No activity logs found</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
