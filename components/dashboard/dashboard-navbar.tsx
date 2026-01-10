'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, User, ChevronDown, Lock, LogOut } from 'lucide-react';
import { ThemeSelector } from '@/components/dashboard/theme-selector';
import { ThemeSelectorEnhanced } from '@/components/dashboard/theme-selector-enhanced';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logoutAction } from '@/app/actions/auth';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    link?: string;
    createdAt: number;
}

interface DashboardNavbarProps {
    userName: string;
    userRole: string;
    userId: string;
}

export function DashboardNavbar({ userName, userRole, userId }: DashboardNavbarProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [userId]);

    const loadNotifications = async () => {
        try {
            const response = await fetch(`/api/notifications?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                // Handle both array and object responses
                if (Array.isArray(data)) {
                    setNotifications(data);
                    setUnreadCount(data.filter((n: Notification) => !n.read).length);
                } else if (data.notifications && Array.isArray(data.notifications)) {
                    setNotifications(data.notifications);
                    setUnreadCount(data.unreadCount || 0);
                } else {
                    setNotifications([]);
                    setUnreadCount(0);
                }
            } else {
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            setNotifications([]);
            setUnreadCount(0);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            await fetch('/api/notifications/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId })
            });
            loadNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
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

    return (
        <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg sm:text-xl font-bold">
                        {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard
                    </h1>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Theme Selector */}
                    <ThemeSelectorEnhanced />
                    
                    {/* Notifications */}
                    <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80 sm:w-96">
                            <div className="flex items-center justify-between p-4 border-b">
                                <h3 className="font-semibold">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                        {unreadCount} unread
                                    </span>
                                )}
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-muted-foreground">
                                        No notifications
                                    </div>
                                ) : (
                                    Array.isArray(notifications) && notifications.slice(0, 10).map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                                                !notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                                            }`}
                                            onClick={() => {
                                                markAsRead(notification.id);
                                                if (notification.link) {
                                                    window.location.href = notification.link;
                                                }
                                                setShowNotifications(false);
                                            }}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        {getTimeAgo(notification.createdAt)}
                                                    </p>
                                                </div>
                                                {!notification.read && (
                                                    <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            {notifications.length > 0 && (
                                <div className="p-2 border-t">
                                    <Link href={`/${userRole}/notifications`} className="block">
                                        <Button variant="ghost" className="w-full text-sm" size="sm">
                                            View all notifications
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Profile Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-2">
                                <div className="hidden sm:flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-medium leading-none">{userName}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                                    </div>
                                </div>
                                <div className="sm:hidden h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-4 w-4" />
                                </div>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <div className="sm:hidden px-2 py-1.5 border-b">
                                <p className="text-sm font-medium">{userName}</p>
                                <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                            </div>
                            <DropdownMenuItem asChild>
                                <Link href={`/${userRole}/profile`} className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile Settings</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/${userRole}/change-password`} className="cursor-pointer">
                                    <Lock className="mr-2 h-4 w-4" />
                                    <span>Change Password</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <form action={logoutAction} className="w-full">
                                    <button type="submit" className="w-full flex items-center cursor-pointer">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Sign Out</span>
                                    </button>
                                </form>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </nav>
    );
}
