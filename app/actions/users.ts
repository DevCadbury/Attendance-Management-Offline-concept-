'use server';

import { getUsers, User, saveUsers, deleteUser, updateUser, getUserById } from '@/lib/storage';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

export async function createUserAction(prevState: any, formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as User['role'];
    const name = formData.get('name') as string;
    const email = formData.get('email') as string || `${username}@example.com`;

    if (!username || !password || !role || !name) {
        return { error: 'All fields are required', success: false, message: '' };
    }

    const users = await getUsers();
    if (users.find(u => u.username === username)) {
        return { error: 'Username already exists', success: false, message: '' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser: User = {
        id: Math.random().toString(36).substring(7),
        username,
        password: hashedPassword,
        role,
        name,
        email,
        locked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    users.push(newUser);
    await saveUsers(users);

    revalidatePath('/admin/users');
    return { success: true, message: 'User created successfully', error: '' };
}

export async function getUsersAction() {
    return await getUsers();
}

export async function deleteUserAction(userId: string) {
    try {
        // Prevent deleting the last admin
        const users = await getUsers();
        const user = users.find(u => u.id === userId);
        
        if (user?.role === 'admin') {
            const adminCount = users.filter(u => u.role === 'admin').length;
            if (adminCount <= 1) {
                return { success: false, error: 'Cannot delete the last admin user' };
            }
        }

        const result = await deleteUser(userId);
        if (result) {
            revalidatePath('/admin/users');
            return { success: true, message: 'User deleted successfully' };
        }
        return { success: false, error: 'User not found' };
    } catch (error) {
        return { success: false, error: 'Failed to delete user' };
    }
}

export async function updateUserAction(userId: string, updates: { name?: string; role?: User['role']; username?: string }) {
    try {
        // Check if username is being changed and already exists
        if (updates.username) {
            const users = await getUsers();
            const existing = users.find(u => u.username === updates.username && u.id !== userId);
            if (existing) {
                return { success: false, error: 'Username already exists' };
            }
        }

        const result = await updateUser(userId, updates);
        if (result) {
            revalidatePath('/admin/users');
            return { success: true, message: 'User updated successfully' };
        }
        return { success: false, error: 'User not found' };
    } catch (error) {
        return { success: false, error: 'Failed to update user' };
    }
}

export async function resetPasswordAction(userId: string, newPassword: string) {
    try {
        if (!newPassword || newPassword.length < 4) {
            return { success: false, error: 'Password must be at least 4 characters' };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const result = await updateUser(userId, { password: hashedPassword });
        
        if (result) {
            revalidatePath('/admin/users');
            return { success: true, message: 'Password reset successfully' };
        }
        return { success: false, error: 'User not found' };
    } catch (error) {
        return { success: false, error: 'Failed to reset password' };
    }
}

export async function toggleUserLockAction(userId: string) {
    try {
        const user = await getUserById(userId);
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        // Prevent locking the last admin
        if (user.role === 'admin' && !user.locked) {
            const users = await getUsers();
            const activeAdmins = users.filter(u => u.role === 'admin' && !u.locked).length;
            if (activeAdmins <= 1) {
                return { success: false, error: 'Cannot lock the last active admin' };
            }
        }

        const result = await updateUser(userId, { locked: !user.locked });
        if (result) {
            revalidatePath('/admin/users');
            return { 
                success: true, 
                message: `User ${user.locked ? 'unlocked' : 'locked'} successfully`,
                locked: !user.locked 
            };
        }
        return { success: false, error: 'Failed to update user' };
    } catch (error) {
        return { success: false, error: 'Failed to toggle lock status' };
    }
}
