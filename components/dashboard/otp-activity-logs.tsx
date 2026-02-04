'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, LogIn, LogOut, Clock, User, Mail, MapPin } from 'lucide-react';
import { getOTPActivityLogsAction } from '@/app/actions/otp-logs';

interface OTPActivityLog {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeEmail: string;
    profilePictureUrl?: string;
    action: 'request' | 'validate';
    type: 'entry' | 'exit';
    otpCode?: string;
    timestamp: number;
    success: boolean;
    errorMessage?: string;
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
}

export function OTPActivityLogs({ limit }: { limit?: number }) {
    const [logs, setLogs] = useState<OTPActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLogs();
        const interval = setInterval(loadLogs, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const loadLogs = async () => {
        try {
            const result = await getOTPActivityLogsAction(50);
            if (result.success && result.logs) {
                setLogs(result.logs);
            }
        } catch (error) {
            console.error('Error loading OTP logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const displayLogs = limit ? logs.slice(0, limit) : logs;

    return (
        <div className="space-y-3">
            {displayLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                            No OTP activity logs yet
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div
                                key={log.id}
                                className={`p-4 rounded-lg border ${
                                    log.success
                                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                                        : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Profile Picture */}
                                    {log.profilePictureUrl ? (
                                        <img
                                            src={log.profilePictureUrl}
                                            alt={log.employeeName}
                                            className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                                            onError={(e) => {
                                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(log.employeeName)}&background=random&size=128`;
                                            }}
                                        />
                                    ) : (
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(log.employeeName)}&background=random&size=128`}
                                            alt={log.employeeName}
                                            className="h-10 w-10 rounded-full flex-shrink-0"
                                        />
                                    )}

                                    {/* Log Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-medium">{log.employeeName}</p>
                                            {log.success ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-600" />
                                            )}
                                            <Badge variant={log.type === 'entry' ? 'default' : 'secondary'}>
                                                {log.type === 'entry' ? (
                                                    <><LogIn className="h-3 w-3 mr-1" /> Entry</>
                                                ) : (
                                                    <><LogOut className="h-3 w-3 mr-1" /> Exit</>
                                                )}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {getTimeAgo(log.timestamp)}
                                            </span>
                                        </div>

                                        <div className="mt-1 space-y-1">
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                {log.employeeEmail}
                                            </p>
                                            {log.otpCode && (
                                                <p className="text-sm">
                                                    OTP: <span className="font-mono font-medium">{log.otpCode}</span>
                                                </p>
                                            )}
                                            {log.location?.address && (
                                                <p className="text-sm text-muted-foreground flex items-start gap-1">
                                                    <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                                    <span className="line-clamp-1">{log.location.address}</span>
                                                </p>
                                            )}
                                            {!log.success && log.errorMessage && (
                                                <p className="text-sm text-red-600 dark:text-red-400">
                                                    {log.errorMessage}
                                                </p>
                                            )}
                                        </div>

                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatTime(log.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
        );
}
