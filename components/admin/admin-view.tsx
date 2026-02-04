'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { Key, Clock, Download, Settings, Users, FileText, UserPlus, Edit, Trash2, X, ExternalLink } from 'lucide-react';
import { generateOTPAction, getCurrentOTPAction, invalidateOTPAction } from '@/app/actions/otp-management';
import { getAllEmployeesAction, createEmployeeAction, updateEmployeeAction, deleteEmployeeAction, createAdminAction } from '@/app/actions/users';
import { getAllAttendanceAction } from '@/app/actions/attendance';
import { getSettingsAction, updateSettingsAction } from '@/app/actions/settings';
import { exportAttendanceToExcelAction } from '@/app/actions/export';
import { getAllDisputesAction, resolveDisputeAction } from '@/app/actions/disputes';
import { sendTestEmailAction } from '@/app/actions/email';
import { OTPActivityLogs } from '@/components/dashboard/otp-activity-logs';
import { AdminAttendanceCalendar } from '@/components/admin/admin-attendance-calendar';

interface AdminViewProps {
    userRole: 'admin' | 'dev';
}

export default function AdminView({ userRole }: AdminViewProps) {
    const searchParams = useSearchParams();
    const initialTab = (searchParams?.get('tab') as 'otp' | 'attendance' | 'users' | 'settings' | 'disputes') || 'otp';
    const [activeTab, setActiveTab] = useState<'otp' | 'attendance' | 'users' | 'settings' | 'disputes'>(initialTab);
    const [loading, setLoading] = useState(false);
    
    // OTP State
    const [entryOTP, setEntryOTP] = useState<string | null>(null);
    const [exitOTP, setExitOTP] = useState<string | null>(null);
    const [entryExpiry, setEntryExpiry] = useState<number | null>(null);
    const [exitExpiry, setExitExpiry] = useState<number | null>(null);
    const [countdown, setCountdown] = useState<{entry: number; exit: number}>({entry: 0, exit: 0});
    
    // Attendance State
    const [attendance, setAttendance] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    
    // Settings State
    const [settings, setSettings] = useState<any>(null);
    const [entryTimeStart, setEntryTimeStart] = useState('09:00');
    const [entryTimeEnd, setEntryTimeEnd] = useState('10:00');
    const [exitTimeStart, setExitTimeStart] = useState('17:00');
    const [exitTimeEnd, setExitTimeEnd] = useState('18:00');
    const [otpValidity, setOtpValidity] = useState(5);
    const [securityEmail, setSecurityEmail] = useState('');
    
    // Disputes State
    const [disputes, setDisputes] = useState<any[]>([]);
    const [filterDisputeStatus, setFilterDisputeStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

    // User Management State
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<'admin' | 'employee'>('employee');
    const [newUserProfilePicture, setNewUserProfilePicture] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadCurrentOTPs();
        loadAttendance();
        loadEmployees();
        loadSettings();
        loadDisputes();
    }, []);

    // Countdown timer for OTPs
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now() + (5.5 * 60 * 60 * 1000); // IST
            
            if (entryExpiry && entryExpiry > now) {
                setCountdown(prev => ({ ...prev, entry: Math.floor((entryExpiry - now) / 1000) }));
            } else {
                setCountdown(prev => ({ ...prev, entry: 0 }));
            }
            
            if (exitExpiry && exitExpiry > now) {
                setCountdown(prev => ({ ...prev, exit: Math.floor((exitExpiry - now) / 1000) }));
            } else {
                setCountdown(prev => ({ ...prev, exit: 0 }));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [entryExpiry, exitExpiry]);

    async function loadCurrentOTPs() {
        const entryResult = await getCurrentOTPAction('entry');
        if (entryResult.success && entryResult.otp) {
            setEntryOTP(entryResult.otp);
            setEntryExpiry(entryResult.expiryTime);
        } else {
            setEntryOTP(null);
        }

        const exitResult = await getCurrentOTPAction('exit');
        if (exitResult.success && exitResult.otp) {
            setExitOTP(exitResult.otp);
            setExitExpiry(exitResult.expiryTime);
        } else {
            setExitOTP(null);
        }
    }

    async function handleGenerateOTP(type: 'entry' | 'exit') {
        setLoading(true);
        const result = await generateOTPAction(type);
        setLoading(false);

        if (result.success && result.otp) {
            toast.success(`${type === 'entry' ? 'Entry' : 'Exit'} OTP generated and sent to security email!`);
            if (type === 'entry') {
                setEntryOTP(result.otp);
                setEntryExpiry(result.expiryTime);
            } else {
                setExitOTP(result.otp);
                setExitExpiry(result.expiryTime);
            }
        } else {
            toast.error(result.error || 'Failed to generate OTP');
        }
    }

    async function handleInvalidateOTP(type: 'entry' | 'exit') {
        setLoading(true);
        const result = await invalidateOTPAction(type);
        setLoading(false);

        if (result.success) {
            toast.success(`${type === 'entry' ? 'Entry' : 'Exit'} OTP invalidated`);
            if (type === 'entry') {
                setEntryOTP(null);
                setEntryExpiry(null);
            } else {
                setExitOTP(null);
                setExitExpiry(null);
            }
        } else {
            toast.error(result.error || 'Failed to invalidate OTP');
        }
    }

    async function loadAttendance() {
        const result = await getAllAttendanceAction();
        if (result.success && result.attendance) {
            setAttendance(result.attendance);
        }
    }

    async function loadEmployees() {
        const result = await getAllEmployeesAction();
        if (result.success && result.employees) {
            setEmployees(result.employees);
        }
    }

    async function loadSettings() {
        const result = await getSettingsAction();
        console.log('Loaded settings:', result);
        if (result.success && result.settings) {
            setSettings(result.settings);
            setEntryTimeStart(result.settings.entryTimeStart || '09:00');
            setEntryTimeEnd(result.settings.entryTimeEnd || '10:00');
            setExitTimeStart(result.settings.exitTimeStart || '17:00');
            setExitTimeEnd(result.settings.exitTimeEnd || '18:00');
            setOtpValidity(result.settings.otpValidityMinutes || 5);
            const emailValue = result.settings.securityEmail || '';
            console.log('Setting security email to:', emailValue);
            setSecurityEmail(emailValue);
        }
    }

    async function loadDisputes() {
        const statusFilter = filterDisputeStatus === 'all' ? undefined : filterDisputeStatus;
        const result = await getAllDisputesAction(statusFilter);
        if (result.success && result.disputes) {
            setDisputes(result.disputes);
        }
    }

    async function handleSaveSettings() {
        // Validate security email - it must be provided and valid
        if (!securityEmail || !securityEmail.includes('@')) {
            toast.error('Please enter a valid security email address');
            return;
        }

        console.log('Saving settings with security email:', securityEmail);
        setLoading(true);
        const result = await updateSettingsAction({
            entryTimeStart,
            entryTimeEnd,
            exitTimeStart,
            exitTimeEnd,
            otpValidityMinutes: otpValidity,
            securityEmail: securityEmail
        });
        setLoading(false);

        if (result.success) {
            toast.success('Settings updated successfully');
            await loadSettings();
        } else {
            console.error('Failed to save settings:', result.error);
            toast.error(result.error || 'Failed to update settings');
        }
    }

    async function handleExportExcel() {
        setLoading(true);
        const result = await exportAttendanceToExcelAction(
            filterEmployee || undefined,
            filterStartDate || undefined,
            filterEndDate || undefined,
            'excel'
        );
        setLoading(false);

        if (result.success && result.data) {
            // Download the file
            const uint8Array = new Uint8Array(result.data);
            const blob = new Blob([uint8Array], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result.filename || 'attendance.xlsx';
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Excel file downloaded successfully');
        } else {
            toast.error(result.error || 'Failed to export');
        }
    }

    async function handleResolveDispute(disputeId: string, decision: 'approved' | 'rejected', message?: string) {
        setLoading(true);
        const result = await resolveDisputeAction(disputeId, decision, undefined, message);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            await loadDisputes();
        } else {
            toast.error(result.error);
        }
    }

    async function handleSendTestEmail() {
        const email = prompt('Enter email address to send test email:');
        if (!email) return;

        setLoading(true);
        const result = await sendTestEmailAction(email);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.error);
        }
    }

    // User Management Functions
    function openUserModal(user?: any) {
        if (user) {
            setEditingUser(user);
            setNewUserName(user.name);
            setNewUserEmail(user.email);
            setNewUserPassword('');
            setNewUserProfilePicture(user.profilePictureUrl || '');
        } else {
            setEditingUser(null);
            setNewUserName('');
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserRole('employee');
            setNewUserProfilePicture('');
        }
        setShowUserModal(true);
    }

    function closeUserModal() {
        setShowUserModal(false);
        setEditingUser(null);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserRole('employee');
        setNewUserProfilePicture('');
    }

    async function handleSaveUser() {
        if (!newUserName || !newUserEmail) {
            toast.error('Name and email are required');
            return;
        }

        if (!editingUser && !newUserPassword) {
            toast.error('Password is required for new employees');
            return;
        }

        setLoading(true);
        
        if (editingUser) {
            // Update existing employee
            const result = await updateEmployeeAction(editingUser.id, {
                name: newUserName,
                email: newUserEmail,
                password: newUserPassword || undefined,
                profilePicture: newUserProfilePicture || undefined
            });
            
            if (result.success) {
                toast.success(result.message);
                closeUserModal();
                await loadEmployees();
            } else {
                toast.error(result.error);
            }
        } else {
            // Create new user (admin or employee based on role)
            const result = newUserRole === 'admin' && userRole === 'dev'
                ? await createAdminAction(
                    newUserName,
                    newUserEmail,
                    newUserPassword,
                    newUserProfilePicture || undefined
                )
                : await createEmployeeAction(
                    newUserName,
                    newUserEmail,
                    newUserPassword,
                    newUserProfilePicture || undefined
                );
            
            if (result.success) {
                toast.success(result.message);
                closeUserModal();
                await loadEmployees();
            } else {
                toast.error(result.error);
            }
        }
        
        setLoading(false);
    }

    async function handleDeleteUser(userId: string, userName: string) {
        if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
            return;
        }

        setLoading(true);
        const result = await deleteEmployeeAction(userId);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            await loadEmployees();
        } else {
            toast.error(result.error);
        }
    }

    function handleProfilePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setNewUserProfilePicture(reader.result as string);
        };
        reader.readAsDataURL(file);
    }

    function formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
                <Button variant={activeTab === 'otp' ? 'default' : 'outline'} onClick={() => setActiveTab('otp')}>
                    <Key className="w-4 h-4 mr-2" />
                    OTP Management
                </Button>
                <Button variant={activeTab === 'attendance' ? 'default' : 'outline'} onClick={() => setActiveTab('attendance')}>
                    <FileText className="w-4 h-4 mr-2" />
                    Attendance
                </Button>
                <Button variant={activeTab === 'users' ? 'default' : 'outline'} onClick={() => setActiveTab('users')}>
                    <Users className="w-4 h-4 mr-2" />
                    User Management
                </Button>
                <Button variant={activeTab === 'disputes' ? 'default' : 'outline'} onClick={() => setActiveTab('disputes')}>
                    <FileText className="w-4 h-4 mr-2" />
                    Disputes
                </Button>
                <Link href="/admin/overtime">
                    <Button variant="outline">
                        <Clock className="w-4 h-4 mr-2" />
                        Overtime Requests
                    </Button>
                </Link>
                <Button variant={activeTab === 'settings' ? 'default' : 'outline'} onClick={() => setActiveTab('settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                </Button>
            </div>

            {/* OTP Management Tab */}
            {activeTab === 'otp' && (
                <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Entry OTP */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    Entry OTP
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {entryOTP && countdown.entry > 0 ? (
                                    <>
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground">Current OTP:</p>
                                            <p className="text-4xl font-bold tracking-widest text-primary">{entryOTP}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground">Expires in:</p>
                                            <p className="text-2xl font-semibold text-yellow-600">{formatTime(countdown.entry)}</p>
                                        </div>
                                        <Button variant="destructive" className="w-full" onClick={() => handleInvalidateOTP('entry')}>
                                            Invalidate Entry OTP
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-center text-muted-foreground">No active entry OTP</p>
                                        <Button className="w-full" onClick={() => handleGenerateOTP('entry')} disabled={loading}>
                                            {loading ? 'Generating...' : 'Generate Entry OTP'}
                                        </Button>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Exit OTP */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    Exit OTP
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {exitOTP && countdown.exit > 0 ? (
                                    <>
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground">Current OTP:</p>
                                            <p className="text-4xl font-bold tracking-widest text-primary">{exitOTP}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground">Expires in:</p>
                                            <p className="text-2xl font-semibold text-yellow-600">{formatTime(countdown.exit)}</p>
                                        </div>
                                        <Button variant="destructive" className="w-full" onClick={() => handleInvalidateOTP('exit')}>
                                            Invalidate Exit OTP
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-center text-muted-foreground">No active exit OTP</p>
                                        <Button className="w-full" onClick={() => handleGenerateOTP('exit')} disabled={loading}>
                                            {loading ? 'Generating...' : 'Generate Exit OTP'}
                                        </Button>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Attendance Tab */}
            {activeTab === 'attendance' && (
                <AdminAttendanceCalendar />
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>System Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="font-semibold">Entry Time Window</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Time</Label>
                                    <Input 
                                        type="time" 
                                        value={entryTimeStart}
                                        onChange={(e) => setEntryTimeStart(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Time</Label>
                                    <Input 
                                        type="time"
                                        value={entryTimeEnd}
                                        onChange={(e) => setEntryTimeEnd(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold">Exit Time Window</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Time</Label>
                                    <Input 
                                        type="time"
                                        value={exitTimeStart}
                                        onChange={(e) => setExitTimeStart(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Time</Label>
                                    <Input 
                                        type="time"
                                        value={exitTimeEnd}
                                        onChange={(e) => setExitTimeEnd(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>OTP Validity (minutes)</Label>
                            <Input 
                                type="number"
                                min="1"
                                max="60"
                                value={otpValidity}
                                onChange={(e) => setOtpValidity(parseInt(e.target.value) || 5)}
                            />
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold">Security Email Configuration</h3>
                            <div className="space-y-2">
                                <Label>Security Guard Email</Label>
                                <Input 
                                    type="email"
                                    placeholder="security@company.com"
                                    value={securityEmail}
                                    onChange={(e) => setSecurityEmail(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    OTPs will be sent to this email. Employees will ask the security guard for OTP codes.
                                </p>
                            </div>
                            <Button 
                                variant="outline" 
                                onClick={handleSendTestEmail} 
                                disabled={loading}
                                className="w-full"
                            >
                                Send Test Email
                            </Button>
                        </div>

                        <Button onClick={handleSaveSettings} disabled={loading} className="w-full">
                            {loading ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Disputes Tab */}
            {activeTab === 'disputes' && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Employee Disputes</CardTitle>
                            <select 
                                className="border rounded-md p-2"
                                value={filterDisputeStatus}
                                onChange={(e) => {
                                    setFilterDisputeStatus(e.target.value as any);
                                    loadDisputes();
                                }}
                            >
                                <option value="all">All</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {disputes.length > 0 ? (
                                disputes.map((dispute) => (
                                    <div key={dispute.id} className="p-4 border rounded-lg space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold">{dispute.employeeName}</p>
                                                <p className="text-sm text-muted-foreground">{dispute.date}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded text-sm ${
                                                dispute.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                dispute.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {dispute.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-sm">{dispute.reason}</p>
                                        {dispute.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <Button 
                                                    size="sm"
                                                    onClick={() => handleResolveDispute(dispute.id, 'approved')}
                                                >
                                                    Approve
                                                </Button>
                                                <Button 
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => {
                                                        const message = prompt('Rejection message (optional):');
                                                        handleResolveDispute(dispute.id, 'rejected', message || undefined);
                                                    }}
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground">No disputes found</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* User Management Tab */}
            {activeTab === 'users' && (
                <>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Employee Management</CardTitle>
                                <Button onClick={() => openUserModal()}>
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Add Employee
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Search */}
                            <div className="space-y-2">
                                <Label>Search Employees</Label>
                                <Input 
                                    placeholder="Search by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Employee Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2">Profile</th>
                                            <th className="text-left p-2">Name</th>
                                            <th className="text-left p-2">Email</th>
                                            <th className="text-left p-2">Created At</th>
                                            <th className="text-right p-2">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees
                                            .filter(emp => 
                                                emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                emp.email.toLowerCase().includes(searchQuery.toLowerCase())
                                            )
                                            .map((emp) => (
                                                <tr key={emp.id} className="border-b hover:bg-muted/50">
                                                    <td className="p-2">
                                                        {emp.profilePictureUrl ? (
                                                            <img 
                                                                src={emp.profilePictureUrl} 
                                                                alt={emp.name}
                                                                className="w-10 h-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                                <span className="text-sm font-semibold">{emp.name.charAt(0)}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-2 font-medium">{emp.name}</td>
                                                    <td className="p-2 text-muted-foreground">{emp.email}</td>
                                                    <td className="p-2 text-sm">
                                                        {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                                                    </td>
                                                    <td className="p-2">
                                                        <div className="flex justify-end gap-2">
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline"
                                                                onClick={() => openUserModal(emp)}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <Button 
                                                                size="sm" 
                                                                variant="destructive"
                                                                onClick={() => handleDeleteUser(emp.id, emp.name)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>

                            {employees.length === 0 && (
                                <p className="text-center text-muted-foreground py-8">No employees found</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* User Modal */}
                    {showUserModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>
                                            {editingUser 
                                                ? 'Edit Employee' 
                                                : userRole === 'dev' && newUserRole === 'admin'
                                                    ? 'Add Admin'
                                                    : 'Add Employee'
                                            }
                                        </CardTitle>
                                        <Button variant="ghost" size="sm" onClick={closeUserModal}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Name *</Label>
                                        <Input 
                                            placeholder="Employee name"
                                            value={newUserName}
                                            onChange={(e) => setNewUserName(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Email *</Label>
                                        <Input 
                                            type="email"
                                            placeholder="employee@company.com"
                                            value={newUserEmail}
                                            onChange={(e) => setNewUserEmail(e.target.value)}
                                        />
                                    </div>

                                    {/* Role selector - only for dev users creating new users */}
                                    {userRole === 'dev' && !editingUser && (
                                        <div className="space-y-2">
                                            <Label>Role *</Label>
                                            <select
                                                className="w-full p-2 border rounded-md bg-background"
                                                value={newUserRole}
                                                onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'employee')}
                                            >
                                                <option value="employee">Employee</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label>Password {!editingUser && '*'}</Label>
                                        <Input 
                                            type="password"
                                            placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
                                            value={newUserPassword}
                                            onChange={(e) => setNewUserPassword(e.target.value)}
                                        />
                                        {editingUser && (
                                            <p className="text-xs text-muted-foreground">Leave blank to keep current password</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Profile Picture</Label>
                                        <Input 
                                            type="file"
                                            accept="image/*"
                                            onChange={handleProfilePictureChange}
                                        />
                                        {newUserProfilePicture && (
                                            <div className="mt-2">
                                                <img 
                                                    src={newUserProfilePicture} 
                                                    alt="Preview"
                                                    className="w-24 h-24 rounded-full object-cover mx-auto"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                        <Button className="flex-1" onClick={handleSaveUser} disabled={loading}>
                                            {loading ? 'Saving...' : editingUser ? 'Update' : 'Create'}
                                        </Button>
                                        <Button className="flex-1" variant="outline" onClick={closeUserModal}>
                                            Cancel
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
