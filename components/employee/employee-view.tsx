'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { User, MapPin, Clock, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { markAttendanceAction, getMyAttendanceAction, getTodayAttendanceAction } from '@/app/actions/attendance';
import { raiseDisputeAction, getMyDisputesAction } from '@/app/actions/disputes';
import { changeOwnPasswordAction } from '@/app/actions/users';
import { requestOTPAction } from '@/app/actions/email';
import ExportAttendanceDialog from '@/components/admin/export-attendance-dialog';
import OvertimeRequestManager from '@/components/employee/overtime-request-manager';

interface EmployeeViewProps {
    user: {
        id: string;
        name: string;
        email: string;
        profilePictureUrl?: string;
    };
}

export default function EmployeeView({ user }: EmployeeViewProps) {
    const [activeTab, setActiveTab] = useState<'mark' | 'calendar' | 'disputes' | 'overtime' | 'password'>('mark');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState<{latitude: number; longitude: number} | null>(null);
    const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
    const [todayAttendance, setTodayAttendance] = useState<any>(null);
    const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [disputes, setDisputes] = useState<any[]>([]);
    
    // Dispute form
    const [disputeDate, setDisputeDate] = useState('');
    const [disputeReason, setDisputeReason] = useState('');
    
    // Password change
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        loadTodayAttendance();
        loadMonthlyAttendance();
        loadDisputes();
        checkLocationPermission();
    }, []);

    async function checkLocationPermission() {
        if (!('geolocation' in navigator)) {
            setLocationPermission('denied');
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        // Check if Permissions API is available
        if ('permissions' in navigator) {
            try {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                
                if (result.state === 'granted') {
                    setLocationPermission('granted');
                    getLocation();
                } else if (result.state === 'denied') {
                    setLocationPermission('denied');
                } else {
                    setLocationPermission('prompt');
                }
                
                // Listen for permission changes
                result.onchange = () => {
                    if (result.state === 'granted') {
                        setLocationPermission('granted');
                        getLocation();
                    } else if (result.state === 'denied') {
                        setLocationPermission('denied');
                    } else {
                        setLocationPermission('prompt');
                    }
                };
            } catch (error) {
                // Permissions API not available or error
                setLocationPermission('prompt');
            }
        } else {
            // Fallback for browsers without Permissions API
            setLocationPermission('prompt');
        }
    }

    async function requestLocationPermission() {
        setLocationPermission('checking');
        getLocation();
    }

    async function getLocation() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                    setLocationPermission('granted');
                    toast.success('Location access granted');
                },
                (error) => {
                    setLocationPermission('denied');
                    
                    if (error.code === 1) {
                        toast.error('Location permission denied. Please enable it in your browser settings.', {
                            duration: 5000,
                            action: {
                                label: 'How to enable',
                                onClick: () => {
                                    const message = `To enable location:\n\n` +
                                        `Chrome: Click the lock icon in the address bar → Site settings → Location → Allow\n\n` +
                                        `Firefox: Click the shield/lock icon → Permissions → Location → Allow\n\n` +
                                        `Edge: Click the lock icon → Permissions → Location → Allow`;
                                    alert(message);
                                }
                            }
                        });
                    } else if (error.code === 2) {
                        toast.error('Location unavailable. Please check your device settings.');
                    } else if (error.code === 3) {
                        toast.error('Location request timeout. Please try again.');
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            setLocationPermission('denied');
            toast.error('Geolocation is not supported by your browser');
        }
    }

    async function loadTodayAttendance() {
        const result = await getTodayAttendanceAction();
        if (result.success) {
            setTodayAttendance(result.attendance);
        }
    }

    async function loadMonthlyAttendance() {
        const result = await getMyAttendanceAction();
        if (result.success && result.attendance) {
            setMonthlyAttendance(result.attendance);
        }
    }

    async function loadDisputes() {
        const result = await getMyDisputesAction();
        if (result.success && result.disputes) {
            setDisputes(result.disputes);
        }
    }

    async function handleMarkEntry() {
        if (!otp || otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        if (!location) {
            toast.error('Location not available. Please enable location services.');
            return;
        }

        setLoading(true);
        const result = await markAttendanceAction(otp, 'entry', location);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setOtp('');
            await loadTodayAttendance();
            await loadMonthlyAttendance();
        } else {
            toast.error(result.error);
        }
    }

    async function handleMarkExit() {
        if (!otp || otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        if (!location) {
            toast.error('Location not available. Please enable location services.');
            return;
        }

        setLoading(true);
        const result = await markAttendanceAction(otp, 'exit', location);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setOtp('');
            await loadTodayAttendance();
            await loadMonthlyAttendance();
        } else {
            toast.error(result.error);
        }
    }

    async function handleRequestOTP(type: 'entry' | 'exit') {
        setLoading(true);
        const result = await requestOTPAction(type);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.error);
        }
    }

    async function handleRaiseDispute() {
        if (!disputeDate || !disputeReason.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        setLoading(true);
        const result = await raiseDisputeAction(disputeDate, disputeReason);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setDisputeDate('');
            setDisputeReason('');
            await loadDisputes();
        } else {
            toast.error(result.error);
        }
    }

    async function handleChangePassword() {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        const result = await changeOwnPasswordAction(currentPassword, newPassword);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            toast.error(result.error);
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'present': return 'text-green-600';
            case 'incomplete': return 'text-yellow-600';
            case 'absent': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        {user.profilePictureUrl ? (
                            <img 
                                src={user.profilePictureUrl} 
                                alt={user.name}
                                className="w-16 h-16 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-8 h-8 text-primary" />
                            </div>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold">{user.name}</h2>
                            <p className="text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
                <Button
                    variant={activeTab === 'mark' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('mark')}
                >
                    Mark Attendance
                </Button>
                <Button
                    variant={activeTab === 'calendar' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('calendar')}
                >
                    My Attendance
                </Button>
                <Button
                    variant={activeTab === 'disputes' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('disputes')}
                >
                    Disputes
                </Button>
                <Button
                    variant={activeTab === 'overtime' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('overtime')}
                >
                    Overtime Requests
                </Button>
                <Button
                    variant={activeTab === 'password' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('password')}
                >
                    Change Password
                </Button>
            </div>

            {/* Mark Attendance Tab */}
            {activeTab === 'mark' && (
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Location Permission Alert */}
                    {locationPermission !== 'granted' && (
                        <Card className="md:col-span-2 border-amber-500 bg-amber-50 dark:bg-amber-950">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                    <MapPin className="w-5 h-5" />
                                    Location Permission Required
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    {locationPermission === 'denied' 
                                        ? 'Location access was denied. Please enable it in your browser settings to mark attendance.'
                                        : 'This app needs access to your location to verify your attendance. Your location is only used when marking attendance.'}
                                </p>
                                {locationPermission === 'denied' ? (
                                    <div className="space-y-2">
                                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                                            How to enable location:
                                        </p>
                                        <ul className="text-sm text-amber-600 dark:text-amber-400 space-y-1 list-disc list-inside">
                                            <li>Chrome/Edge: Click the lock icon in address bar → Site settings → Location → Allow</li>
                                            <li>Firefox: Click the shield/lock icon → Permissions → Location → Allow</li>
                                            <li>Safari: Safari menu → Settings for this website → Location → Allow</li>
                                        </ul>
                                        <Button 
                                            onClick={requestLocationPermission}
                                            variant="outline"
                                            className="mt-2"
                                        >
                                            Retry Location Access
                                        </Button>
                                    </div>
                                ) : (
                                    <Button 
                                        onClick={requestLocationPermission}
                                        disabled={locationPermission === 'checking'}
                                        className="bg-amber-600 hover:bg-amber-700 text-white"
                                    >
                                        {locationPermission === 'checking' ? 'Requesting...' : 'Enable Location Access'}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Today's Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Today's Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {todayAttendance ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Status:</span>
                                        <span className={`font-semibold ${getStatusColor(todayAttendance.status)}`}>
                                            {todayAttendance.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Entry:</span>
                                        <span className="font-semibold">
                                            {todayAttendance.entryTime 
                                                ? new Date(todayAttendance.entryTime).toLocaleTimeString('en-IN')
                                                : 'Not Marked'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Exit:</span>
                                        <span className="font-semibold">
                                            {todayAttendance.exitTime
                                                ? new Date(todayAttendance.exitTime).toLocaleTimeString('en-IN')
                                                : 'Not Marked'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No attendance marked yet today</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Mark Entry */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Mark Entry
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Entry OTP</Label>
                                <Input
                                    type="text"
                                    placeholder="Enter 6-digit OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    maxLength={6}
                                />
                            </div>
                            <div className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted">
                                <MapPin className={`w-4 h-4 ${location ? 'text-green-600' : 'text-amber-600'}`} />
                                <span className={location ? 'text-green-600 font-medium' : 'text-amber-600'}>
                                    {locationPermission === 'granted' && location
                                        ? '✓ Location enabled'
                                        : locationPermission === 'checking'
                                        ? 'Getting location...'
                                        : locationPermission === 'denied'
                                        ? '✗ Location disabled'
                                        : 'Waiting for permission...'}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {!todayAttendance?.entryTime && (
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => handleRequestOTP('entry')}
                                        disabled={loading}
                                    >
                                        Request OTP from Security
                                    </Button>
                                )}
                                <Button
                                    className="w-full"
                                    onClick={handleMarkEntry}
                                    disabled={loading || !location || todayAttendance?.entryTime}
                                    title={!location ? 'Please enable location access first' : todayAttendance?.entryTime ? 'Entry already marked' : 'Mark your entry'}
                                >
                                    {loading ? 'Marking...' : todayAttendance?.entryTime ? 'Entry Already Marked' : 'Mark Entry'}
                                </Button>
                                {!location && (
                                    <p className="text-xs text-amber-600">
                                        ⚠ Enable location access to mark attendance
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Mark Exit */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                Mark Exit
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Exit OTP</Label>
                                <Input
                                    type="text"
                                    placeholder="Enter 6-digit OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    maxLength={6}
                                />
                            </div>
                            <div className="space-y-2">
                                {!todayAttendance?.exitTime && todayAttendance?.entryTime && (
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => handleRequestOTP('exit')}
                                        disabled={loading}
                                    >
                                        Request OTP from Security
                                    </Button>
                                )}
                                <Button
                                    className="w-full"
                                    onClick={handleMarkExit}
                                    disabled={loading || !location || !todayAttendance?.entryTime || todayAttendance?.exitTime}
                                    title={!location ? 'Please enable location access first' : !todayAttendance?.entryTime ? 'Mark entry first' : todayAttendance?.exitTime ? 'Exit already marked' : 'Mark your exit'}
                                >
                                    {loading ? 'Marking...' : todayAttendance?.exitTime ? 'Exit Already Marked' : 'Mark Exit'}
                                </Button>
                                {!location && todayAttendance?.entryTime && (
                                    <p className="text-xs text-amber-600">
                                        ⚠ Enable location access to mark exit
                                    </p>
                                )}
                            </div>
                            {!todayAttendance?.entryTime && (
                                <p className="text-sm text-yellow-600">Mark entry first before marking exit</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
                <Card>
                    <CardHeader>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <CardTitle>Monthly Attendance Calendar</CardTitle>
                                <div className="flex items-center gap-2">
                                    <ExportAttendanceDialog employeeId={user.id} employeeName={user.name} />
                                    <Button onClick={goToToday} variant="outline" size="sm">
                                        Today
                                    </Button>
                                </div>
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
                        <div className="space-y-6">
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
                                    {generateCalendarDays().map((day, index) => {
                                        if (!day) {
                                            return <div key={`empty-${index}`} className="aspect-square" />;
                                        }
                                        
                                        const dateStr = day.toISOString().split('T')[0];
                                        const record = monthlyAttendance.find(a => a.date === dateStr);
                                        const isSelected = selectedDate.toISOString().split('T')[0] === dateStr;
                                        const isToday = new Date().toISOString().split('T')[0] === dateStr;
                                        
                                        let bgColor = 'bg-background';
                                        let textColor = '';
                                        
                                        if (record) {
                                            if (record.status === 'present') {
                                                bgColor = 'bg-green-500';
                                                textColor = 'text-white';
                                            } else if (record.status === 'incomplete') {
                                                bgColor = 'bg-orange-500';
                                                textColor = 'text-white';
                                            } else if (record.status === 'absent') {
                                                bgColor = 'bg-red-500';
                                                textColor = 'text-white';
                                            }
                                        }
                                        
                                        return (
                                            <button
                                                key={dateStr}
                                                onClick={() => setSelectedDate(day)}
                                                className={`
                                                    aspect-square p-1 rounded-lg border text-sm transition-all flex items-center justify-center
                                                    ${isSelected ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-primary/50'}
                                                    ${isToday ? 'font-bold' : ''}
                                                    ${bgColor} ${textColor}
                                                `}
                                            >
                                                {day.getDate()}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap gap-3 text-xs pt-4 border-t">
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

                            {/* Selected Date Details */}
                            {selectedDate && (() => {
                                const dateStr = selectedDate.toISOString().split('T')[0];
                                const record = monthlyAttendance.find(a => a.date === dateStr);
                                
                                return (
                                    <div className="p-4 border rounded-lg bg-muted/30">
                                        <h3 className="font-semibold mb-3">
                                            {selectedDate.toLocaleDateString('en-IN', { 
                                                weekday: 'long', 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                            })}
                                        </h3>
                                        
                                        {record ? (
                                            <div className="space-y-2">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
                                                    record.status === 'present' 
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                                        : record.status === 'incomplete'
                                                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                }`}>
                                                    {record.status === 'present' ? (
                                                        <CheckCircle className="h-4 w-4" />
                                                    ) : record.status === 'incomplete' ? (
                                                        <AlertCircle className="h-4 w-4" />
                                                    ) : (
                                                        <XCircle className="h-4 w-4" />
                                                    )}
                                                    <span className="font-semibold">
                                                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                                    </span>
                                                </div>
                                                
                                                <div className="mt-4 space-y-2">
                                                    {record.entryTime && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Clock className="h-4 w-4 text-green-600" />
                                                            <span className="font-medium">Entry:</span>
                                                            <span className="text-green-600 font-semibold">
                                                                {new Date(record.entryTime).toLocaleTimeString('en-IN', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
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
                                                                    minute: '2-digit'
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
                                                    {record.entryLocation?.address && (
                                                        <div className="flex items-start gap-2 text-sm mt-2 pt-2 border-t">
                                                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                            <span className="text-muted-foreground">{record.entryLocation.address}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <XCircle className="h-4 w-4" />
                                                <span>No attendance marked</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* List View */}
                            {monthlyAttendance.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-3">Recent Attendance</h4>
                                    <div className="grid gap-2">
                                        {monthlyAttendance.slice(0, 5).map((record) => (
                                            <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                                <div>
                                                    <p className="font-semibold">{new Date(record.date + 'T00:00:00').toLocaleDateString('en-IN', { 
                                                        weekday: 'short',
                                                        month: 'short', 
                                                        day: 'numeric' 
                                                    })}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {record.entryTime ? new Date(record.entryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'} - {record.exitTime ? new Date(record.exitTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                    </p>
                                                </div>
                                                <span className={`font-semibold ${getStatusColor(record.status)}`}>
                                                    {record.status.toUpperCase()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Disputes Tab */}
            {activeTab === 'disputes' && (
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Raise Dispute</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={disputeDate}
                                    onChange={(e) => setDisputeDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Reason</Label>
                                <Textarea
                                    placeholder="Explain why you're raising this dispute..."
                                    value={disputeReason}
                                    onChange={(e) => setDisputeReason(e.target.value)}
                                    rows={4}
                                />
                            </div>
                            <Button onClick={handleRaiseDispute} disabled={loading} className="w-full">
                                {loading ? 'Submitting...' : 'Raise Dispute'}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>My Disputes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {disputes.length > 0 ? (
                                    disputes.map((dispute) => (
                                        <div key={dispute.id} className="p-3 border rounded-lg space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold">{dispute.date}</span>
                                                <span className={`text-sm px-2 py-1 rounded ${
                                                    dispute.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    dispute.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {dispute.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{dispute.reason}</p>
                                            {dispute.rejectionMessage && (
                                                <p className="text-sm text-red-600">Admin: {dispute.rejectionMessage}</p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-muted-foreground">No disputes raised</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Overtime Requests Tab */}
            {activeTab === 'overtime' && (
                <OvertimeRequestManager />
            )}

            {/* Password Change Tab */}
            {activeTab === 'password' && (
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle>Change Password</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Current Password</Label>
                            <Input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirm New Password</Label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleChangePassword} disabled={loading} className="w-full">
                            {loading ? 'Changing...' : 'Change Password'}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
