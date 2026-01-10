'use server';

import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { getUser } from '@/lib/storage';
import { redirect } from 'next/navigation';

const SECRET_KEY = new TextEncoder().encode('your-secret-key-change-this-in-prod');
const ALG = 'HS256';

export async function loginAction(prevState: any, formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!username || !password) {
        return { error: 'Username and password are required' };
    }

    const user = await getUser(username);

    if (!user || !user.password) {
        return { error: 'Invalid credentials' };
    }

    // Check if account is locked
    if (user.locked) {
        return { error: 'Account is locked. Please contact an administrator.' };
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
        return { error: 'Invalid credentials' };
    }

    // Create session
    const token = await new SignJWT({
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
    })
        .setProtectedHeader({ alg: ALG })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(SECRET_KEY);

    (await cookies()).set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
    });

    redirect(`/${user.role}`);
}

export async function logoutAction() {
    (await cookies()).delete('session');
    redirect('/login');
}
