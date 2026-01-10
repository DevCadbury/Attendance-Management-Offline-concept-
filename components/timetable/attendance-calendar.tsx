'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp } from 'lucide-react';
import { getWeekDates, formatDate, formatDisplayDate, isToday, addWeeks } from '@/lib/utils/calendar';

interface AttendanceDay {
    date: string;
    present: number;
    total: number;
    classes: {
        subject: string;
        status: 'present' | 'absent' | 'late';
    }[];
}

interface AttendanceCalendarProps {
    attendanceData: AttendanceDay[];
    onDateClick?: (date: string) => void;
}

export function AttendanceCalendar({ attendanceData, onDateClick }: AttendanceCalendarProps) {
    const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
    const weekDates = getWeekDates(currentWeekStart);

    const handlePreviousWeek = () => {
        setCurrentWeekStart(addWeeks(currentWeekStart, -1));
    };

    const handleNextWeek = () => {
        setCurrentWeekStart(addWeeks(currentWeekStart, 1));
    };

    const handleToday = () => {
        setCurrentWeekStart(new Date());
    };

    const getDayAttendance = (date: Date): AttendanceDay | null => {
        const dateStr = formatDate(date);
        return attendanceData.find(d => d.date === dateStr) || null;
    };

    const getAttendanceColor = (present: number, total: number): string => {
        if (total === 0) return 'bg-muted/50 border-muted-foreground/30';
        const percentage = (present / total) * 100;
        if (percentage >= 90) return 'bg-green-500/10 border-green-500/30';
        if (percentage >= 75) return 'bg-yellow-500/10 border-yellow-500/30';
        return 'bg-red-500/10 border-red-500/30';
    };

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Calculate weekly stats
    const weeklyStats = weekDates.reduce((acc, date) => {
        const dayData = getDayAttendance(date);
        if (dayData) {
            acc.present += dayData.present;
            acc.total += dayData.total;
        }
        return acc;
    }, { present: 0, total: 0 });

    const weeklyPercentage = weeklyStats.total > 0 
        ? ((weeklyStats.present / weeklyStats.total) * 100).toFixed(1)
        : '0';

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Attendance Calendar
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                Weekly: <span className="font-bold text-foreground">{weeklyPercentage}%</span>
                                {' '}({weeklyStats.present}/{weeklyStats.total})
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleToday}>
                            Today
                        </Button>
                        <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleNextWeek}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">
                    {formatDisplayDate(weekDates[0])} - {formatDisplayDate(weekDates[6])}
                </p>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-2">
                    {weekDates.map((date, index) => {
                        const attendance = getDayAttendance(date);
                        const today = isToday(date);
                        const percentage = attendance && attendance.total > 0
                            ? ((attendance.present / attendance.total) * 100).toFixed(0)
                            : null;

                        return (
                            <div
                                key={formatDate(date)}
                                className={`border-2 rounded-lg p-3 min-h-[140px] cursor-pointer hover:shadow-md transition-shadow ${
                                    today ? 'ring-2 ring-primary/50' : ''
                                } ${attendance ? getAttendanceColor(attendance.present, attendance.total) : 'bg-muted/30 border-muted-foreground/20'}`}
                                onClick={() => attendance && onDateClick?.(formatDate(date))}
                            >
                                <div className="text-center mb-2">
                                    <div className="text-xs font-bold text-foreground/80">
                                        {dayNames[index]}
                                    </div>
                                    <div className={`text-lg font-bold ${today ? 'text-primary' : 'text-foreground'}`}>
                                        {date.getDate()}
                                    </div>
                                </div>
                                {attendance ? (
                                    <div className="space-y-1">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-foreground drop-shadow-sm">{percentage}%</div>
                                            <div className="text-xs font-semibold text-foreground/80">
                                                {attendance.present}/{attendance.total} classes
                                            </div>
                                        </div>
                                        <div className="space-y-0.5">
                                            {attendance.classes.map((cls, idx) => (
                                                <div key={idx} className="flex items-center gap-1">
                                                    <div className={`w-2 h-2 rounded-full ${
                                                        cls.status === 'present' ? 'bg-green-500' : 
                                                        cls.status === 'late' ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`} />
                                                    <span className="text-xs text-foreground truncate">{cls.subject}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <div className="text-3xl font-bold text-foreground/40 mb-1">-</div>
                                        <div className="text-xs font-semibold text-foreground/60">No classes</div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
