import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUser, User } from './storage';

const SECRET_KEY = new TextEncoder().encode('your-secret-key-change-this-in-prod'); // In prod use process.env.JWT_SECRET
const ALG = 'HS256';

export async function login(formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    const user = await getUser(username);

    if (!user || !user.password) {
        return { error: 'Invalid credentials' };
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

    return { success: true, role: user.role };
}

export async function logout() {
    (await cookies()).delete('session');
}

export async function getSession() {
    const token = (await cookies()).get('session')?.value;
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, SECRET_KEY, {
            algorithms: [ALG],
        });
        return payload as any as User;
    } catch (error) {
        return null;
    }
}

export async function updateSession(request: NextRequest) {
    const token = request.cookies.get('session')?.value;
    if (!token) return;

    // Refresh session if needed (optional, keeping simple for now)
    const parsed = await getSession();
    if (!parsed) return;

    const res = NextResponse.next();
    res.cookies.set({
        name: 'session',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24,
        path: '/',
    });
    return res;
}
