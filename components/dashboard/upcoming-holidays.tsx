'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { getUpcomingHolidaysAction } from '@/app/actions/holidays';
import { Holiday } from '@/lib/db';

export function UpcomingHolidays({ limit = 3 }: { limit?: number }) {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHolidays();
    }, [limit]);

    const loadHolidays = async () => {
        setLoading(true);
        const data = await getUpcomingHolidaysAction(limit);
        setHolidays(data);
        setLoading(false);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getDaysUntil = (dateStr: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const holidayDate = new Date(dateStr);
        holidayDate.setHours(0, 0, 0, 0);
        const diffTime = holidayDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays > 0) return `in ${diffDays} days`;
        return '';
    };

    if (loading) {
        return (
            <Card className="border-zinc-800/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5" />
                        Upcoming Holidays
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (holidays.length === 0) {
        return null; // Don't show if no holidays
    }

    return (
        <Card className="border-zinc-800/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    Upcoming Holidays
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {holidays.map((holiday) => (
                        <div 
                            key={holiday.id} 
                            className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"
                        >
                            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-500/20 flex flex-col items-center justify-center">
                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                    {new Date(holiday.date).toLocaleDateString('en-US', { month: 'short' })}
                                </span>
                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {new Date(holiday.date).getDate()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-foreground">{holiday.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {formatDate(holiday.date)} • {getDaysUntil(holiday.date)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
