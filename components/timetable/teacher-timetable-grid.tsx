'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Lock, Unlock, CheckCircle, Edit } from 'lucide-react';
import { getWeekDates, formatDate, formatDisplayDate, isToday, addWeeks } from '@/lib/utils/calendar';
import { startSessionAction, getSessionBySlotAction } from '@/app/actions/attendance';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface TimeSlot {
    id: string;
    subject: string;
    teacherId?: string;
    teacherName?: string;
    startTime: string;
    endTime: string;
    room?: string;
    sectionId?: string;
}

interface DaySchedule {
    date: string;
    slots: TimeSlot[];
}

interface TeacherTimetableGridProps {
    timetableData: DaySchedule[];
    teacherId: string;
    title?: string;
}

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

export function TeacherTimetableGrid({ timetableData, teacherId, title = "My Teaching Schedule" }: TeacherTimetableGridProps) {
    const router = useRouter();
    const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
    const [sessionStatuses, setSessionStatuses] = useState<Record<string, { exists: boolean; locked: boolean; unlocked: boolean }>>({});
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const weekDates = getWeekDates(currentWeekStart);

    useEffect(() => {
        loadSessionStatuses();
    }, [currentWeekStart, teacherId]);

    const loadSessionStatuses = async () => {
        const statuses: Record<string, { exists: boolean; locked: boolean; unlocked: boolean }> = {};
        
        for (const date of weekDates) {
            const dateStr = formatDate(date);
            const schedule = getDaySchedule(date);
            
            for (const slot of schedule) {
                if (slot.id) {
                    try {
                        const session = await getSessionBySlotAction(slot.id, teacherId, dateStr);
                        const key = `${dateStr}-${slot.id}`;
                        statuses[key] = {
                            exists: !!session,
                            locked: session?.locked || false,
                            unlocked: session?.unlockedByAdmin || false
                        };
                    } catch (error) {
                        console.error('Error loading session status:', error);
                    }
                }
            }
        }
        
        setSessionStatuses(statuses);
    };

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

    const handleMarkAttendance = async (slot: TimeSlot, date: Date) => {
        const dateStr = formatDate(date);
        const key = `${dateStr}-${slot.id}`;
        const status = sessionStatuses[key];

        if (status?.exists && status.locked && !status.unlocked) {
            toast.error('This session is locked. Cannot edit attendance.');
            return;
        }

        if (status?.exists) {
            // Navigate to edit attendance
            const session = await getSessionBySlotAction(slot.id!, teacherId, dateStr);
            if (session) {
                router.push(`/teacher/session/${session.id}`);
            }
        } else {
            // Start new session
            if (!slot.sectionId) {
                toast.error('No section assigned to this slot');
                return;
            }

            setLoading({ ...loading, [key]: true });
            try {
                const result = await startSessionAction(
                    slot.subject,
                    teacherId,
                    slot.sectionId,
                    slot.id
                );

                if (result.success === false) {
                    toast.error(result.error || 'Failed to start session');
                } else {
                    if (result.alreadyExists) {
                        toast.info('Opening existing attendance session');
                    } else {
                        toast.success('Attendance session started');
                    }
                    if (result.session) {
                        router.push(`/teacher/session/${result.session.id}`);
                    }
                }
            } catch (error) {
                toast.error('Failed to start attendance session');
            } finally {
                setLoading({ ...loading, [key]: false });
            }
        }
    };

    const getAttendanceButton = (slot: TimeSlot | null, date: Date) => {
        if (!slot || !slot.id) return null;

        const dateStr = formatDate(date);
        const key = `${dateStr}-${slot.id}`;
        const status = sessionStatuses[key];
        const isLoading = loading[key];
        const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

        if (!status?.exists) {
            return (
                <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleMarkAttendance(slot, date)}
                    disabled={isLoading || isPast}
                    className="w-full mt-2 text-xs"
                >
                    {isLoading ? 'Starting...' : 'Mark Attendance'}
                </Button>
            );
        }

        if (status.locked && !status.unlocked) {
            return (
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                    <Lock className="h-3 w-3" />
                    <span>Locked</span>
                </div>
            );
        }

        if (status.unlocked) {
            return (
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkAttendance(slot, date)}
                    className="w-full mt-2 text-xs border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                    <Unlock className="h-3 w-3 mr-1" />
                    Edit (Unlocked)
                </Button>
            );
        }

        return (
            <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkAttendance(slot, date)}
                className="w-full mt-2 text-xs border-green-500 text-green-600 hover:bg-green-50"
            >
                <Edit className="h-3 w-3 mr-1" />
                Update
            </Button>
        );
    };

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
            <CardContent>
                <div className="space-y-2 overflow-x-auto">
                    {/* Header */}
                    <div className="grid grid-cols-8 gap-2 min-w-[900px]">
                        <div className="p-2 font-semibold text-sm text-muted-foreground">Time</div>
                        {weekDates.map((date, idx) => (
                            <div
                                key={formatDate(date)}
                                className={`p-2 text-center rounded-lg ${
                                    isToday(date) 
                                        ? 'bg-primary text-primary-foreground font-bold' 
                                        : 'bg-muted/30 font-semibold'
                                }`}
                            >
                                <div className="text-xs">{dayNames[idx]}</div>
                                <div className="text-sm">{date.getDate()}</div>
                            </div>
                        ))}
                    </div>

                    {/* Time Slots */}
                    {TIME_SLOTS.map((timeSlot) => (
                        <div key={timeSlot} className="grid grid-cols-8 gap-2 min-w-[900px]">
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
                                        className={`min-h-[120px] border-2 rounded-xl p-3 transition-all ${
                                            today 
                                                ? 'border-primary/50 ring-2 ring-primary/20' 
                                                : 'border-muted-foreground/20'
                                        } ${
                                            classData
                                                ? 'bg-primary/5 hover:bg-primary/10'
                                                : 'bg-muted/10 border-dashed'
                                        }`}
                                    >
                                        {classData ? (
                                            <div className="h-full flex flex-col">
                                                <div className="flex-1">
                                                    <div className="font-bold text-sm text-foreground mb-1">
                                                        {classData.subject}
                                                    </div>
                                                    <div className="text-xs font-medium text-foreground/80">
                                                        {classData.startTime} - {classData.endTime}
                                                    </div>
                                                    {classData.room && (
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            Room: {classData.room}
                                                        </div>
                                                    )}
                                                </div>
                                                {getAttendanceButton(classData, date)}
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center">
                                                <span className="text-xs font-medium text-muted-foreground">No class</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
