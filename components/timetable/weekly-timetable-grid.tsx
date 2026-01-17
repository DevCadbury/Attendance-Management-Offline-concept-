'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getWeekDates, formatDate, formatDisplayDate, isToday, addWeeks } from '@/lib/utils/calendar';

interface TimeSlot {
    id: string;
    subject: string;
    teacherId?: string;
    teacherName?: string;
    startTime: string;
    endTime: string;
    room?: string;
}

interface DaySchedule {
    date: string;
    slots: TimeSlot[];
}

interface WeeklyTimetableGridProps {
    timetableData: DaySchedule[];
    title?: string;
}

// Standard time slots for display (8 AM to 6 PM)
const TIME_SLOTS = [
    '08:00 - 09:00',
    '09:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 12:00',
    '12:00 - 13:00',
    '13:00 - 14:00',
    '14:00 - 15:00',
    '15:00 - 16:00',
    '16:00 - 17:00',
    '17:00 - 18:00',
];

function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

function isTimeInSlot(slotStart: string, slotEnd: string, displaySlot: string): boolean {
    const [displayStart] = displaySlot.split(' - ');
    const slotStartMins = timeToMinutes(slotStart);
    const slotEndMins = timeToMinutes(slotEnd);
    const displayStartMins = timeToMinutes(displayStart);
    
    return displayStartMins >= slotStartMins && displayStartMins < slotEndMins;
}

export function WeeklyTimetableGrid({ timetableData, title = "Weekly Timetable" }: WeeklyTimetableGridProps) {
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

    const getClassForTimeSlot = (schedule: TimeSlot[], timeSlot: string): TimeSlot | null => {
        return schedule.find(slot => 
            isTimeInSlot(slot.startTime, slot.endTime, timeSlot)
        ) || null;
    };

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Check if there's any data at all
    const hasAnyData = timetableData.some(day => day.slots && day.slots.length > 0);

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
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
            <CardContent className="p-2 sm:p-6">
                {!hasAnyData ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Calendar className="h-16 w-16 text-muted-foreground/40 mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No Timetable Set</h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Your timetable hasn't been created yet. Please contact your administrator to set up your weekly schedule.
                        </p>
                    </div>
                ) : (
                <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                        {/* Header Row */}
                        <div className="grid grid-cols-8 gap-2 mb-2">
                            <div className="font-semibold text-sm text-muted-foreground p-2">
                                Time
                            </div>
                            {weekDates.map((date, index) => {
                                const today = isToday(date);
                                return (
                                    <div
                                        key={formatDate(date)}
                                        className={`text-center p-2 rounded-lg ${
                                            today 
                                                ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300' 
                                                : 'bg-muted/50'
                                        }`}
                                    >
                                        <div className="font-semibold text-sm">
                                            {dayNames[index]}
                                        </div>
                                        <div className={`text-lg font-bold ${today ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                                            {date.getDate()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Time Slots */}
                        {TIME_SLOTS.map((timeSlot) => (
                            <div key={timeSlot} className="grid grid-cols-8 gap-2 mb-2">
                                <div className="flex items-center text-xs font-medium text-muted-foreground p-2 border rounded-lg bg-muted/30">
                                    {timeSlot}
                                </div>
                                {weekDates.map((date) => {
                                    const schedule = getDaySchedule(date);
                                    const classData = getClassForTimeSlot(schedule, timeSlot);
                                    const today = isToday(date);

                                    return (
                                        <div
                                            key={`${formatDate(date)}-${timeSlot}`}
                                            className={`min-h-[80px] border-2 rounded-xl p-3 transition-all ${
                                                today 
                                                    ? 'border-primary/50 ring-2 ring-primary/20' 
                                                    : 'border-muted-foreground/20'
                                            } ${
                                                classData
                                                    ? 'bg-primary/5 hover:bg-primary/10 hover:shadow-lg hover:border-primary/40 cursor-pointer'
                                                    : 'bg-muted/10 border-dashed'
                                            }`}
                                        >
                                            {classData ? (
                                                <div className="h-full flex flex-col justify-between">
                                                    <div>
                                                        <div className="font-bold text-sm text-foreground mb-1.5">
                                                            {classData.subject}
                                                        </div>
                                                        <div className="text-xs font-medium text-foreground/80">
                                                            {classData.startTime} - {classData.endTime}
                                                        </div>
                                                    </div>
                                                    {classData.teacherName && (
                                                        <div className="text-xs text-primary font-semibold mt-2 bg-primary/10 px-2 py-1 rounded-md inline-block max-w-fit">
                                                            {classData.teacherName}
                                                        </div>
                                                    )}
                                                    {classData.room && (
                                                        <div className="text-xs text-muted-foreground">
                                                            Room: {classData.room}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="h-full flex items-center justify-center">
                                                    <span className="text-xs text-muted-foreground/50">
                                                        No class
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
                )}
            </CardContent>
        </Card>
    );
}
