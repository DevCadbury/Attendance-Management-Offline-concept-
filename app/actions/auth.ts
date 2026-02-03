'use server';

import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import { UserModel } from '@/lib/models';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod');

export async function loginAction(prevState: any, formData: FormData) {
    try {
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        if (!email || !password) {
            return { success: false, error: 'Email and password are required' };
        }

        await connectDB();

        const user = await UserModel.findOne({ email }).lean();
        if (!user) {
            return { success: false, error: 'Invalid credentials' };
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return { success: false, error: 'Invalid credentials' };
        }

        if (user.locked) {
            return { success: false, error: 'Account is locked. Contact administrator.' };
        }

        // Create JWT token
        const token = await new SignJWT({ 
            id: user.id, 
            email: user.email, 
            role: user.role,
            name: user.name,
            profilePictureUrl: user.profilePictureUrl
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(secret);

        // Set cookie
        (await cookies()).set('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return { success: true };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Login failed. Please try again.' };
    }
}

export async function logoutAction() {
    (await cookies()).delete('session');
    redirect('/login');
}
