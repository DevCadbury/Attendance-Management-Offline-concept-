'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Users, BookOpen } from 'lucide-react';
import { getSlotsByTeacherAction } from '@/app/actions/timetable';
import { getSectionsAction } from '@/app/actions/timetable';

interface TimeSlot {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    subject: string;
    teacherId: string;
    sectionId: string;
}

interface Section {
    id: string;
    name: string;
    studentIds: string[];
}

interface TeacherTimetableViewProps {
    teacherId: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function TeacherTimetableView({ teacherId }: TeacherTimetableViewProps) {
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTimetable();
    }, [teacherId]);

    const loadTimetable = async () => {
        setLoading(true);
        try {
            const [slotsData, sectionsData] = await Promise.all([
                getSlotsByTeacherAction(teacherId),
                getSectionsAction()
            ]);
            setSlots(slotsData);
            setSections(sectionsData);
        } catch (error) {
            console.error('Error loading timetable:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSectionName = (sectionId: string) => {
        return sections.find(s => s.id === sectionId)?.name || 'Unknown';
    };

    const getSlotsByDay = (day: string) => {
        return slots
            .filter(slot => slot.day === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    if (loading) {
        return <div className="text-center py-8">Loading timetable...</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        My Teaching Schedule
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {DAYS.map(day => {
                            const daySlots = getSlotsByDay(day);
                            if (daySlots.length === 0) return null;

                            return (
                                <div key={day} className="space-y-3">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        {day}
                                    </h3>
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {daySlots.map(slot => (
                                            <Card key={slot.id} className="border-l-4 border-l-blue-500">
                                                <CardContent className="p-4 space-y-2">
                                                    <div className="flex items-center gap-2 text-sm font-medium">
                                                        <BookOpen className="h-4 w-4 text-blue-600" />
                                                        <span className="truncate">{slot.subject}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Clock className="h-4 w-4" />
                                                        <span>{slot.startTime} - {slot.endTime}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Users className="h-4 w-4" />
                                                        <span className="truncate">Section: {getSectionName(slot.sectionId)}</span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {slots.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                No classes assigned yet.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Classes</p>
                                <p className="text-2xl font-bold">{slots.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded">
                                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Sections</p>
                                <p className="text-2xl font-bold">
                                    {new Set(slots.map(s => s.sectionId)).size}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded">
                                <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Subjects</p>
                                <p className="text-2xl font-bold">
                                    {new Set(slots.map(s => s.subject)).size}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded">
                                <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Days Active</p>
                                <p className="text-2xl font-bold">
                                    {new Set(slots.map(s => s.day)).size}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
