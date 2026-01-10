'use client';

import QRCode from 'react-qr-code';
import { cn } from '@/lib/utils';

interface QRCodeProps {
    value: string;
    className?: string;
    size?: number;
}

export function QRCodeDisplay({ value, className, size = 200 }: QRCodeProps) {
    return (
        <div className={cn("relative flex items-center justify-center p-4 bg-white rounded-xl shadow-lg", className)}>
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-xl blur-xl animate-pulse" />
            <div className="relative z-10">
                <QRCode
                    value={value}
                    size={size}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 256 256`}
                />
            </div>
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-30 animate-pulse" />
        </div>
    );
}
