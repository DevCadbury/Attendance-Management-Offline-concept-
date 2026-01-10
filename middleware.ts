import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode('your-secret-key-change-this-in-prod');

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('session')?.value;
    const { pathname } = request.nextUrl;

    // Public routes
    if (pathname === '/login' || pathname.startsWith('/api/auth')) {
        if (token) {
            // If already logged in, redirect to dashboard based on role? 
            // For now, let's just verify and maybe redirect if valid.
            // But usually we let them access login page to switch accounts or just redirect.
            // Let's verify first.
            try {
                const { payload } = await jwtVerify(token, SECRET_KEY);
                const role = (payload as any).role;
                return NextResponse.redirect(new URL(`/${role}`, request.url));
            } catch (e) {
                // Invalid token, proceed to login
            }
        }
        return NextResponse.next();
    }

    // Protected routes
    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        const role = (payload as any).role;

        // RBAC Logic
        if (pathname.startsWith('/admin') && role !== 'admin') {
            return NextResponse.redirect(new URL(`/${role}`, request.url)); // Redirect to their own dashboard
        }
        if (pathname.startsWith('/teacher') && role !== 'teacher') {
            return NextResponse.redirect(new URL(`/${role}`, request.url));
        }
        if (pathname.startsWith('/student') && role !== 'student') {
            return NextResponse.redirect(new URL(`/${role}`, request.url));
        }

        return NextResponse.next();
    } catch (error) {
        // Invalid token
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('session');
        return response;
    }
}

export const config = {
    matcher: ['/admin/:path*', '/teacher/:path*', '/student/:path*', '/login'],
};
