'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
    UserPlus, 
    Edit, 
    Trash2, 
    X, 
    Search, 
    ArrowLeft,
    Lock,
    Unlock,
    Mail,
    Calendar,
    Users,
    Eye
} from 'lucide-react';
import { 
    getAllEmployeesAction, 
    createEmployeeAction, 
    updateEmployeeAction, 
    deleteEmployeeAction,
    toggleEmployeeSuspensionAction
} from '@/app/actions/users';

export default function UserManagementView() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal state
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserProfilePicture, setNewUserProfilePicture] = useState<string>('');

    useEffect(() => {
        loadEmployees();
    }, []);

    async function loadEmployees() {
        setLoading(true);
        const result = await getAllEmployeesAction();
        if (result.success && result.employees) {
            setEmployees(result.employees);
        }
        setLoading(false);
    }

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
            // Create new employee
            const result = await createEmployeeAction(
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

    async function handleToggleSuspension(userId: string, userName: string, currentStatus: boolean) {
        const action = currentStatus ? 'activate' : 'suspend';
        if (!confirm(`Are you sure you want to ${action} ${userName}?`)) {
            return;
        }

        setLoading(true);
        const result = await toggleEmployeeSuspensionAction(userId);
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

    const filteredEmployees = employees.filter(emp => 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeEmployees = filteredEmployees.filter(emp => !emp.locked);
    const suspendedEmployees = filteredEmployees.filter(emp => emp.locked);

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Employee Management</h1>
                        <p className="text-muted-foreground">Manage employee accounts and permissions</p>
                    </div>
                </div>
                <Button onClick={() => openUserModal()}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Employee
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Employees</p>
                                <p className="text-2xl font-bold">{employees.length}</p>
                            </div>
                            <Users className="w-8 h-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active</p>
                                <p className="text-2xl font-bold text-green-600">{activeEmployees.length}</p>
                            </div>
                            <Unlock className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Suspended</p>
                                <p className="text-2xl font-bold text-red-600">{suspendedEmployees.length}</p>
                            </div>
                            <Lock className="w-8 h-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>All Employees</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search employees..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 w-64"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading && employees.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">Loading employees...</p>
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">
                                {searchQuery ? 'No employees found matching your search' : 'No employees found. Add your first employee!'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-3">Employee</th>
                                        <th className="text-left p-3">Email</th>
                                        <th className="text-left p-3">Created</th>
                                        <th className="text-left p-3">Status</th>
                                        <th className="text-right p-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEmployees.map((emp) => (
                                        <tr key={emp.id} className="border-b hover:bg-muted/50 transition-colors">
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    {emp.profilePictureUrl ? (
                                                        <img 
                                                            src={emp.profilePictureUrl} 
                                                            alt={emp.name}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <span className="text-sm font-semibold">
                                                                {emp.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium">{emp.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Mail className="w-4 h-4" />
                                                    {emp.email}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Calendar className="w-4 h-4" />
                                                    {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <Badge variant={emp.locked ? 'destructive' : 'default'}>
                                                    {emp.locked ? 'Suspended' : 'Active'}
                                                </Badge>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={`/admin/employee/${emp.id}`}>
                                                        <Button 
                                                            size="sm" 
                                                            variant="ghost"
                                                            title="View Profile"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        onClick={() => openUserModal(emp)}
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant={emp.locked ? 'default' : 'secondary'}
                                                        onClick={() => handleToggleSuspension(emp.id, emp.name, emp.locked)}
                                                        title={emp.locked ? 'Activate' : 'Suspend'}
                                                    >
                                                        {emp.locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="destructive"
                                                        onClick={() => handleDeleteUser(emp.id, emp.name)}
                                                        title="Delete"
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
                    )}
                </CardContent>
            </Card>

            {/* User Modal */}
            {showUserModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>{editingUser ? 'Edit Employee' : 'Add New Employee'}</CardTitle>
                                <Button variant="ghost" size="sm" onClick={closeUserModal}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Full Name *</Label>
                                <Input 
                                    placeholder="John Doe"
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Email Address *</Label>
                                <Input 
                                    type="email"
                                    placeholder="employee@company.com"
                                    value={newUserEmail}
                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                />
                            </div>

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
                                {(newUserProfilePicture || editingUser?.profilePictureUrl) && (
                                    <div className="mt-2">
                                        <img 
                                            src={newUserProfilePicture || editingUser?.profilePictureUrl} 
                                            alt="Preview"
                                            className="w-24 h-24 rounded-full object-cover mx-auto"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button className="flex-1" onClick={handleSaveUser} disabled={loading}>
                                    {loading ? 'Saving...' : editingUser ? 'Update Employee' : 'Create Employee'}
                                </Button>
                                <Button className="flex-1" variant="outline" onClick={closeUserModal}>
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
