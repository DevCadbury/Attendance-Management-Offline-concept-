'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getWeekDates, formatDate, formatDisplayDate, isToday, addWeeks } from '@/lib/utils/calendar';

interface TimeSlot {
    id: string;
    subject: string;
    teacher?: string;
    startTime: string;
    endTime: string;
    room?: string;
}

interface DaySchedule {
    date: string;
    slots: TimeSlot[];
}

interface WeeklyCalendarProps {
    timetableData: DaySchedule[];
    onDateChange?: (date: string) => void;
    title?: string;
}

export function WeeklyCalendar({ timetableData, onDateChange, title = "Weekly Timetable" }: WeeklyCalendarProps) {
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

    const getDaySchedule = (date: Date): TimeSlot[] => {
        const dateStr = formatDate(date);
        const dayData = timetableData.find(d => d.date === dateStr);
        return dayData?.slots || [];
    };

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {title}
                    </CardTitle>
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
                        const schedule = getDaySchedule(date);
                        const today = isToday(date);

                        return (
                            <div
                                key={formatDate(date)}
                                className={`border rounded-lg p-2 min-h-[200px] ${
                                    today ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-500' : 'bg-card'
                                }`}
                                onClick={() => onDateChange?.(formatDate(date))}
                            >
                                <div className="text-center mb-2">
                                    <div className={`text-xs font-medium ${today ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                                        {dayNames[index]}
                                    </div>
                                    <div className={`text-lg font-bold ${today ? 'text-blue-600 dark:text-blue-400' : 'text-foreground'}`}>
                                        {date.getDate()}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    {schedule.length === 0 ? (
                                        <div className="text-xs text-center text-muted-foreground py-4">
                                            No classes
                                        </div>
                                    ) : (
                                        schedule.map((slot) => (
                                            <div
                                                key={slot.id}
                                                className="text-xs p-2 bg-primary/10 rounded border border-primary/20 hover:bg-primary/20 cursor-pointer transition-colors"
                                            >
                                                <div className="font-medium text-foreground truncate">{slot.subject}</div>
                                                <div className="text-muted-foreground">
                                                    {slot.startTime} - {slot.endTime}
                                                </div>
                                                {slot.teacher && (
                                                    <div className="text-muted-foreground truncate">{slot.teacher}</div>
                                                )}
                                                {slot.room && (
                                                    <div className="text-muted-foreground">{slot.room}</div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
