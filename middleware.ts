import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod');

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('session')?.value;
    const { pathname } = request.nextUrl;

    // Public routes
    if (pathname === '/' || pathname === '/login' || pathname.startsWith('/api/auth')) {
        if (token) {
            try {
                const { payload } = await jwtVerify(token, SECRET_KEY);
                const role = (payload as any).role;
                return NextResponse.redirect(new URL(`/${role}`, request.url));
            } catch (e) {
                // Invalid token, clear it and proceed
                const response = NextResponse.next();
                response.cookies.delete('session');
                return response;
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

        // RBAC Logic for workplace roles
        if (pathname.startsWith('/dev') && role !== 'dev') {
            return NextResponse.redirect(new URL(`/${role}`, request.url));
        }
        if (pathname.startsWith('/admin') && role !== 'admin' && role !== 'dev') {
            return NextResponse.redirect(new URL(`/${role}`, request.url));
        }
        if (pathname.startsWith('/employee') && role !== 'employee') {
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
    matcher: ['/', '/dev/:path*', '/admin/:path*', '/employee/:path*', '/login'],
};
