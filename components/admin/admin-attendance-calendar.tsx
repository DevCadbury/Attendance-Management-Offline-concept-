'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle, XCircle, AlertCircle, Clock, MapPin, User, Edit, Save, Upload, BarChart3, ChevronLeft, ChevronRight, CalendarIcon, Eye } from 'lucide-react';
import { getAllAttendanceAction, updateAttendanceAction } from '@/app/actions/attendance';
import { getAllEmployeesAction } from '@/app/actions/users';
import { exportAttendanceToExcelAction } from '@/app/actions/export';
import { getAllDisputesAction } from '@/app/actions/disputes';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import ExportAttendanceDialog from '@/components/admin/export-attendance-dialog';

export function AdminAttendanceCalendar() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [attendance, setAttendance] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([]);
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [editStatus, setEditStatus] = useState<'present' | 'absent' | 'incomplete'>('present');
    const [editReason, setEditReason] = useState('');
    const [editMediaFile, setEditMediaFile] = useState<File | null>(null);
    const [editMediaPreview, setEditMediaPreview] = useState<string>('');
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const [hoveredDate, setHoveredDate] = useState<string | null>(null);
    const [showStaffComparison, setShowStaffComparison] = useState(false);
    const [disputes, setDisputes] = useState<any[]>([]);
    const [searchEmployee, setSearchEmployee] = useState('');

    useEffect(() => {
        loadData();
        loadDisputes();
    }, []);

    useEffect(() => {
        if (currentMonth) {
            loadMonthlyData();
        }
    }, [currentMonth]);

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
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        
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

    async function loadDisputes() {
        try {
            const result = await getAllDisputesAction();
            if (result.success && result.disputes) {
                setDisputes(result.disputes);
            }
        } catch (error) {
            console.error('Error loading disputes:', error);
        }
    }

    function previousMonth() {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    }

    function nextMonth() {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    }

    function goToToday() {
        const today = new Date();
        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
        setSelectedDate(today);
    }

    function generateCalendarDays() {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const firstDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();
        
        const days = [];
        
        // Empty cells for days before month starts
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null);
        }
        
        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }
        
        return days;
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

    function startEdit(record: any) {
        setEditingRecord(record);
        setEditStatus(record.status || 'present');
        setEditReason('');
        setEditMediaFile(null);
        setEditMediaPreview('');
    }

    async function uploadMediaToCloudinary(file: File): Promise<string | null> {
        setUploadingMedia(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'attendance_edits');
            formData.append('folder', 'attendance_edits');

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            const data = await response.json();
            if (data.secure_url) {
                return data.secure_url;
            }
            return null;
        } catch (error) {
            console.error('Error uploading to Cloudinary:', error);
            toast.error('Failed to upload media file');
            return null;
        } finally {
            setUploadingMedia(false);
        }
    }

    async function handleSaveEdit() {
        if (!editingRecord || !editReason.trim()) {
            toast.error('Please provide a reason for the edit');
            return;
        }

        setLoading(true);
        
        let mediaUrl = '';
        if (editMediaFile) {
            const uploaded = await uploadMediaToCloudinary(editMediaFile);
            if (uploaded) {
                mediaUrl = uploaded;
            }
        }
        
        const updates: any = {
            status: editStatus
        };
        
        if (mediaUrl) {
            updates.attachmentUrl = mediaUrl;
        }

        const result = await updateAttendanceAction(editingRecord.id, updates, editReason);
        setLoading(false);

        if (result.success) {
            toast.success('Attendance updated successfully');
            setEditingRecord(null);
            setEditReason('');
            setEditMediaFile(null);
            setEditMediaPreview('');
            loadData();
            loadMonthlyData();
        } else {
            toast.error(result.error || 'Failed to update attendance');
        }
    }

    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const dayAttendance = attendance.filter(a => {
        const matchesDate = a.date === selectedDateStr;
        const matchesSearch = searchEmployee === '' || 
            a.employeeName?.toLowerCase().includes(searchEmployee.toLowerCase()) ||
            a.employeeId?.toLowerCase().includes(searchEmployee.toLowerCase());
        return matchesDate && matchesSearch;
    });
    
    // Get unique dates with attendance
    const datesWithAttendance = [...new Set(monthlyAttendance.map(a => a.date))];
    
    // Calculate statistics for the selected month
    const presentCount = monthlyAttendance.filter(a => a.status === 'present').length;
    const incompleteCount = monthlyAttendance.filter(a => a.status === 'incomplete').length;
    const absentCount = monthlyAttendance.filter(a => a.status === 'absent').length;

    // Calculate monthly stats by employee for comparison graph
    const employeeStats = employees.map(emp => {
        const empAttendance = monthlyAttendance.filter(a => a.employeeId === emp.id);
        const present = empAttendance.filter(a => a.status === 'present').length;
        const absent = empAttendance.filter(a => a.status === 'absent').length;
        const incomplete = empAttendance.filter(a => a.status === 'incomplete').length;
        const total = empAttendance.length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        
        return {
            id: emp.id,
            name: emp.name,
            present,
            absent,
            incomplete,
            total,
            percentage
        };
    }).filter(stat => stat.total > 0).sort((a, b) => b.percentage - a.percentage);

    const calendarDays = generateCalendarDays();
    const attendanceByDate: Record<string, any[]> = {};
    monthlyAttendance.forEach(record => {
        if (!attendanceByDate[record.date]) {
            attendanceByDate[record.date] = [];
        }
        attendanceByDate[record.date].push(record);
    });

    // Filter pending disputes
    const pendingDisputes = disputes.filter(d => d.status === 'pending');

    return (
        <div className="space-y-6">
            {/* Header with Stats and Action Buttons */}
            <div className="grid md:grid-cols-5 gap-4">
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
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-8 w-8 text-amber-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Pending Disputes</p>
                                <p className="text-2xl font-bold">{pendingDisputes.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Action Buttons and Search */}
            <div className="flex flex-wrap gap-2 items-center">
                <Input 
                    placeholder="Search employee..."
                    value={searchEmployee}
                    onChange={(e) => setSearchEmployee(e.target.value)}
                    className="max-w-xs"
                />
                <ExportAttendanceDialog />
                <Link href="/admin/staff-comparison" target="_blank">
                    <Button variant="outline">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Staff Comparison
                    </Button>
                </Link>
                <Link href="/admin/disputes">
                    <Button variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        View All Disputes
                    </Button>
                </Link>
                <Link href="/admin/attendance-logs">
                    <Button variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        View Edit Logs
                    </Button>
                </Link>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Enhanced Calendar with Navigation */}
                <Card>
                    <CardHeader>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <CardTitle>Attendance Calendar</CardTitle>
                                <Button onClick={goToToday} variant="outline" size="sm">
                                    Today
                                </Button>
                            </div>
                            <div className="flex items-center justify-between">
                                <Button onClick={previousMonth} variant="ghost" size="sm">
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <h3 className="font-semibold text-lg">
                                    {currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                </h3>
                                <Button onClick={nextMonth} variant="ghost" size="sm">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Custom Calendar Grid */}
                        <div className="space-y-2">
                            {/* Weekday headers */}
                            <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground mb-2">
                                <div>Sun</div>
                                <div>Mon</div>
                                <div>Tue</div>
                                <div>Wed</div>
                                <div>Thu</div>
                                <div>Fri</div>
                                <div>Sat</div>
                            </div>
                            
                            {/* Calendar days */}
                            <div className="grid grid-cols-7 gap-1">
                                {calendarDays.map((day, index) => {
                                    if (!day) {
                                        return <div key={`empty-${index}`} className="aspect-square" />;
                                    }
                                    
                                    const dateStr = day.toISOString().split('T')[0];
                                    const dayRecords = attendanceByDate[dateStr] || [];
                                    const isSelected = selectedDate.toISOString().split('T')[0] === dateStr;
                                    const isToday = new Date().toISOString().split('T')[0] === dateStr;
                                    
                                    const presentCount = dayRecords.filter(r => r.status === 'present').length;
                                    const absentCount = dayRecords.filter(r => r.status === 'absent').length;
                                    const incompleteCount = dayRecords.filter(r => r.status === 'incomplete').length;
                                    
                                    return (
                                        <button
                                            key={dateStr}
                                            onClick={() => setSelectedDate(day)}
                                            className={`
                                                aspect-square p-0.5 rounded-lg border text-xs transition-all
                                                ${isSelected ? 'border-primary ring-2 ring-primary bg-primary/10' : 'border-border hover:border-primary/50'}
                                                ${isToday ? 'font-bold' : ''}
                                                ${dayRecords.length > 0 ? 'bg-muted/50' : ''}
                                            `}
                                        >
                                            <div className="flex flex-col h-full justify-between p-0.5">
                                                <span className={isToday ? 'text-primary' : ''}>{day.getDate()}</span>
                                                {dayRecords.length > 0 && (
                                                    <div className="space-y-0.5">
                                                        <div className="flex gap-0.5 justify-center">
                                                            {presentCount > 0 && (
                                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" title={`${presentCount} present`} />
                                                            )}
                                                            {incompleteCount > 0 && (
                                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" title={`${incompleteCount} incomplete`} />
                                                            )}
                                                            {absentCount > 0 && (
                                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" title={`${absentCount} absent`} />
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground">
                                                            {presentCount}/{dayRecords.length}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-3 text-xs mt-4 pt-4 border-t">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span>Present</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                <span>Incomplete</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span>Absent</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded border-2 border-primary"></div>
                                <span>Today</span>
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
                                        {editingRecord?.id === record.id ? (
                                            /* Edit Mode */
                                            <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-semibold text-blue-900">Editing: {record.employeeName}</h4>
                                                    <Button variant="ghost" size="sm" onClick={() => setEditingRecord(null)}>
                                                        Cancel
                                                    </Button>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">Status *</Label>
                                                    <select
                                                        value={editStatus}
                                                        onChange={(e) => setEditStatus(e.target.value as 'present' | 'absent' | 'incomplete')}
                                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="present">Present</option>
                                                        <option value="absent">Absent</option>
                                                        <option value="incomplete">Incomplete</option>
                                                    </select>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">Reason for Edit *</Label>
                                                    <textarea
                                                        value={editReason}
                                                        onChange={(e) => setEditReason(e.target.value)}
                                                        placeholder="Please provide a reason for editing this attendance record"
                                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                                                        required
                                                    />
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">Attachment (Optional)</Label>
                                                    <div className="flex gap-2">
                                                        <Input 
                                                            type="file"
                                                            accept="image/*,video/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    if (file.size > 10 * 1024 * 1024) {
                                                                        toast.error('File size must be less than 10MB');
                                                                        return;
                                                                    }
                                                                    setEditMediaFile(file);
                                                                    setEditMediaPreview(URL.createObjectURL(file));
                                                                }
                                                            }}
                                                            className="flex-1"
                                                        />
                                                        {editMediaPreview && (
                                                            <div className="relative w-16 h-16 border rounded overflow-hidden">
                                                                <img 
                                                                    src={editMediaPreview} 
                                                                    alt="Preview" 
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">Max 10MB. Images or videos only.</p>
                                                </div>
                                                
                                                <Button onClick={handleSaveEdit} disabled={loading || uploadingMedia} className="w-full">
                                                    {uploadingMedia ? (
                                                        <>Uploading media...</>
                                                    ) : (
                                                        <>
                                                            <Save className="h-4 w-4 mr-2" />
                                                            Save Changes
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        ) : (
                                            /* View Mode */
                                            <>
                                                {/* Employee Name and Status */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-semibold">{record.employeeName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
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
                                                        <Button variant="ghost" size="sm" onClick={() => startEdit(record)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </div>
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
                                            </>
                                        )}
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
