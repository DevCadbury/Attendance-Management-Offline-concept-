'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle, XCircle, AlertCircle, Clock, MapPin, User } from 'lucide-react';
import { getAllAttendanceAction } from '@/app/actions/attendance';
import { getAllEmployeesAction } from '@/app/actions/users';
import { exportAttendanceToExcelAction } from '@/app/actions/export';
import { toast } from 'sonner';

export function AdminAttendanceCalendar() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [attendance, setAttendance] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedDate) {
            loadMonthlyData();
        }
    }, [selectedDate]);

    async function loadData() {
        try {
            setLoading(true);
            const [empResult, attResult] = await Promise.all([
                getAllEmployeesAction(),
                getAllAttendanceAction({})
            ]);

            if (empResult.success && empResult.employees) {
                setEmployees(empResult.employees);
            }

            if (attResult.success && attResult.attendance) {
                setAttendance(attResult.attendance);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    }

    async function loadMonthlyData() {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1;
        
        // Get first and last day of the month
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        
        const startDate = firstDay.toISOString().split('T')[0];
        const endDate = lastDay.toISOString().split('T')[0];
        
        try {
            const result = await getAllAttendanceAction({
                startDate,
                endDate
            });

            if (result.success && result.attendance) {
                setMonthlyAttendance(result.attendance);
            }
        } catch (error) {
            console.error('Error loading monthly data:', error);
        }
    }

    async function handleExport() {
        setLoading(true);
        const result = await exportAttendanceToExcelAction();
        setLoading(false);

        if (result.success && result.data) {
            const blob = new Blob([Buffer.from(result.data)], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `attendance-${new Date().toISOString().split('T')[0]}.xlsx`;
            a.click();
            toast.success('Attendance exported successfully');
        } else {
            toast.error(result.error || 'Failed to export attendance');
        }
    }

    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const dayAttendance = attendance.filter(a => a.date === selectedDateStr);
    
    // Get unique dates with attendance
    const datesWithAttendance = [...new Set(monthlyAttendance.map(a => a.date))];
    
    // Calculate statistics for the selected month
    const presentCount = monthlyAttendance.filter(a => a.status === 'present').length;
    const incompleteCount = monthlyAttendance.filter(a => a.status === 'incomplete').length;
    const absentCount = monthlyAttendance.filter(a => a.status === 'absent').length;

    return (
        <div className="space-y-6">
            {/* Header with Stats */}
            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Present</p>
                                <p className="text-2xl font-bold">{presentCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-8 w-8 text-orange-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Incomplete</p>
                                <p className="text-2xl font-bold">{incompleteCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <XCircle className="h-8 w-8 text-red-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Absent</p>
                                <p className="text-2xl font-bold">{absentCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <User className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Total Records</p>
                                <p className="text-2xl font-bold">{monthlyAttendance.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Calendar */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Attendance Calendar</CardTitle>
                            <Button onClick={handleExport} disabled={loading} variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => date && setSelectedDate(date)}
                            modifiers={{
                                hasAttendance: datesWithAttendance.map(d => new Date(d + 'T00:00:00'))
                            }}
                            modifiersStyles={{
                                hasAttendance: {
                                    backgroundColor: 'rgb(59, 130, 246)',
                                    color: 'white',
                                    borderRadius: '50%',
                                    fontWeight: 'bold'
                                }
                            }}
                            className="rounded-md border"
                        />

                        {/* Legend */}
                        <div className="flex gap-4 text-sm mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-500"></div>
                                <span>Has Attendance</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Selected Date Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {selectedDate.toLocaleDateString('en-IN', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto">
                            {dayAttendance.length > 0 ? (
                                dayAttendance.map((record) => (
                                    <div key={record.id} className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors">
                                        {/* Employee Name and Status */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-semibold">{record.employeeName}</span>
                                            </div>
                                            <Badge className={
                                                record.status === 'present' 
                                                    ? 'bg-green-500' 
                                                    : record.status === 'incomplete'
                                                    ? 'bg-orange-500'
                                                    : 'bg-red-500'
                                            }>
                                                {record.status === 'present' && <CheckCircle className="h-3 w-3 mr-1" />}
                                                {record.status === 'incomplete' && <AlertCircle className="h-3 w-3 mr-1" />}
                                                {record.status === 'absent' && <XCircle className="h-3 w-3 mr-1" />}
                                                {record.status.toUpperCase()}
                                            </Badge>
                                        </div>

                                        {/* Timing */}
                                        <div className="space-y-2">
                                            {record.entryTime && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Clock className="h-4 w-4 text-green-600" />
                                                    <span className="font-medium">Entry:</span>
                                                    <span className="text-green-600 font-semibold">
                                                        {new Date(record.entryTime).toLocaleTimeString('en-IN', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            )}
                                            {record.exitTime && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Clock className="h-4 w-4 text-red-600" />
                                                    <span className="font-medium">Exit:</span>
                                                    <span className="text-red-600 font-semibold">
                                                        {new Date(record.exitTime).toLocaleTimeString('en-IN', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            )}
                                            {!record.exitTime && record.entryTime && (
                                                <p className="text-sm text-orange-600 flex items-center gap-2">
                                                    <AlertCircle className="h-4 w-4" />
                                                    Exit not marked
                                                </p>
                                            )}
                                        </div>

                                        {/* Location */}
                                        {record.entryLocation?.address && (
                                            <div className="flex items-start gap-2 text-sm pt-2 border-t">
                                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                <span className="text-muted-foreground">{record.entryLocation.address}</span>
                                            </div>
                                        )}

                                        {/* Marked By */}
                                        <div className="text-xs text-muted-foreground pt-2 border-t">
                                            Marked by: {record.markedBy}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-muted-foreground">No attendance records for this date</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
