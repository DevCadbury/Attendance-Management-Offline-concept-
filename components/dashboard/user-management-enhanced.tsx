'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/storage';
import { 
    createUserAction, 
    deleteUserAction, 
    updateUserAction, 
    resetPasswordAction, 
    toggleUserLockAction 
} from '@/app/actions/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Trash2, Edit2, Lock, Unlock, Key, X, Check } from 'lucide-react';
import { useActionState } from 'react';

const initialState = {
    error: '',
    success: false,
    message: '',
};

export function UserManagementEnhanced({ initialUsers }: { initialUsers: User[] }) {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [state, formAction, isPending] = useActionState(createUserAction, initialState);

    // Edit form state
    const [editForm, setEditForm] = useState({ name: '', username: '', role: 'student' as User['role'] });

    useEffect(() => {
        if (state?.error) {
            toast.error(state.error);
        }
        if (state?.success) {
            toast.success(state.message);
            // Refresh the user list
            window.location.reload();
        }
    }, [state]);

    const handleDelete = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to delete ${userName}?`)) return;

        const result = await deleteUserAction(userId);
        if (result.success) {
            toast.success(result.message);
            setUsers(users.filter(u => u.id !== userId));
        } else {
            toast.error(result.error);
        }
    };

    const handleToggleLock = async (userId: string, currentlyLocked: boolean, userName: string) => {
        const action = currentlyLocked ? 'unlock' : 'lock';
        if (!confirm(`Are you sure you want to ${action} ${userName}?`)) return;

        const result = await toggleUserLockAction(userId);
        if (result.success) {
            toast.success(result.message);
            setUsers(users.map(u => u.id === userId ? { ...u, locked: result.locked } : u));
        } else {
            toast.error(result.error);
        }
    };

    const startEdit = (user: User) => {
        setEditingUser(user);
        setEditForm({ name: user.name, username: user.username, role: user.role });
    };

    const handleUpdate = async () => {
        if (!editingUser) return;

        const result = await updateUserAction(editingUser.id, editForm);
        if (result.success) {
            toast.success(result.message);
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...editForm } : u));
            setEditingUser(null);
        } else {
            toast.error(result.error);
        }
    };

    const handleResetPassword = async () => {
        if (!resetPasswordUser || !newPassword) {
            toast.error('Please enter a new password');
            return;
        }

        const result = await resetPasswordAction(resetPasswordUser.id, newPassword);
        if (result.success) {
            toast.success(result.message);
            setResetPasswordUser(null);
            setNewPassword('');
        } else {
            toast.error(result.error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Add New User</CardTitle>
                        <CardDescription>Create a new account for Admin, Teacher, or Student.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={formAction} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" name="name" placeholder="John Doe" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" name="username" placeholder="johndoe" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" name="password" type="password" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <select
                                    id="role"
                                    name="role"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    required
                                >
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? 'Creating...' : 'Create User'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>User Statistics</CardTitle>
                        <CardDescription>Overview of user accounts</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-primary/10 border-2 border-primary/20 rounded-lg">
                                <span className="font-semibold text-foreground">Total Users</span>
                                <span className="text-3xl font-bold text-foreground">{users.length}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-green-500/10 border-2 border-green-500/20 rounded-lg">
                                <span className="font-semibold text-foreground">Students</span>
                                <span className="text-3xl font-bold text-foreground">{users.filter(u => u.role === 'student').length}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-purple-500/10 border-2 border-purple-500/20 rounded-lg">
                                <span className="font-semibold text-foreground">Teachers</span>
                                <span className="text-3xl font-bold text-foreground">{users.filter(u => u.role === 'teacher').length}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-orange-500/10 border-2 border-orange-500/20 rounded-lg">
                                <span className="font-semibold text-foreground">Admins</span>
                                <span className="text-3xl font-bold text-foreground">{users.filter(u => u.role === 'admin').length}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Manage Users</CardTitle>
                    <CardDescription>Edit, delete, lock/unlock user accounts, and reset passwords.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {users.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <p className="font-medium">{user.name}</p>
                                        {user.locked && (
                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                Locked
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground capitalize">
                                        {user.role}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => startEdit(user)}
                                        title="Edit user"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setResetPasswordUser(user)}
                                        title="Reset password"
                                    >
                                        <Key className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggleLock(user.id, user.locked || false, user.name)}
                                        title={user.locked ? "Unlock user" : "Lock user"}
                                    >
                                        {user.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(user.id, user.name)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                        title="Delete user"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Edit User</CardTitle>
                            <CardDescription>Update user information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Full Name</Label>
                                <Input
                                    id="edit-name"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-username">Username</Label>
                                <Input
                                    id="edit-username"
                                    value={editForm.username}
                                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-role">Role</Label>
                                <select
                                    id="edit-role"
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as User['role'] })}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleUpdate} className="flex-1">
                                    <Check className="mr-2 h-4 w-4" /> Save Changes
                                </Button>
                                <Button variant="outline" onClick={() => setEditingUser(null)} className="flex-1">
                                    <X className="mr-2 h-4 w-4" /> Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Reset Password Modal */}
            {resetPasswordUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Reset Password</CardTitle>
                            <CardDescription>Set a new password for {resetPasswordUser.name}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleResetPassword} className="flex-1">
                                    <Key className="mr-2 h-4 w-4" /> Reset Password
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => {
                                        setResetPasswordUser(null);
                                        setNewPassword('');
                                    }} 
                                    className="flex-1"
                                >
                                    <X className="mr-2 h-4 w-4" /> Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
