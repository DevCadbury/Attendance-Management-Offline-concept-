'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, Clock, Users, BookOpen, User } from 'lucide-react';
import { getSlotsBySectionAction, getSectionsAction } from '@/app/actions/timetable';
import { getUsersAction } from '@/app/actions/users';
import { User as UserType } from '@/lib/storage';

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

interface StudentSectionViewProps {
    studentId: string;
    sectionId?: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function StudentSectionView({ studentId, sectionId }: StudentSectionViewProps) {
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [section, setSection] = useState<Section | null>(null);
    const [sectionStudents, setSectionStudents] = useState<UserType[]>([]);
    const [teachers, setTeachers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (sectionId) {
            loadTimetable();
        } else {
            setLoading(false);
        }
    }, [sectionId]);

    const loadTimetable = async () => {
        setLoading(true);
        try {
            const [slotsData, sectionsData, usersData] = await Promise.all([
                getSlotsBySectionAction(sectionId!),
                getSectionsAction(),
                getUsersAction()
            ]);

            setSlots(slotsData);
            
            const currentSection = sectionsData.find(s => s.id === sectionId);
            setSection(currentSection || null);

            const students = usersData.filter(u => 
                u.role === 'student' && u.sectionId === sectionId
            );
            setSectionStudents(students);

            const teachersList = usersData.filter(u => u.role === 'teacher');
            setTeachers(teachersList);
        } catch (error) {
            console.error('Error loading timetable:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTeacherName = (teacherId: string) => {
        return teachers.find(t => t.id === teacherId)?.name || 'Unknown';
    };

    const getSlotsByDay = (day: string) => {
        return slots
            .filter(slot => slot.day === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    // Get current day and time to highlight active slots
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5);

    const currentSlot = slots.find(slot => 
        slot.day === currentDay &&
        currentTime >= slot.startTime &&
        currentTime <= slot.endTime
    );

    if (!sectionId) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">You are not assigned to any section yet.</p>
                    <p className="text-sm text-muted-foreground mt-2">Please contact your administrator.</p>
                </CardContent>
            </Card>
        );
    }

    if (loading) {
        return <div className="text-center py-8">Loading timetable...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Section Info */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">My Section</p>
                                <p className="text-lg font-bold">{section?.name || 'N/A'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded">
                                <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Classmates</p>
                                <p className="text-lg font-bold">{sectionStudents.length}</p>
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
                                <p className="text-sm text-muted-foreground">Total Classes</p>
                                <p className="text-lg font-bold">{slots.length}</p>
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
                                <p className="text-sm text-muted-foreground">Subjects</p>
                                <p className="text-lg font-bold">
                                    {new Set(slots.map(s => s.subject)).size}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Weekly Timetable */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Weekly Timetable - {section?.name}
                    </CardTitle>
                    <CardDescription>Your complete class schedule for the week</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {DAYS.map(day => {
                            const daySlots = getSlotsByDay(day);
                            const isToday = day === currentDay;

                            return (
                                <div key={day} className={`space-y-3 ${isToday ? 'pb-6 border-b-2 border-blue-500' : ''}`}>
                                    <h3 className={`font-semibold text-base sm:text-lg flex items-center gap-2 ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                                        <Calendar className="h-4 w-4" />
                                        {day}
                                        {isToday && (
                                            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full ml-2">
                                                Today
                                            </span>
                                        )}
                                    </h3>
                                    
                                    {daySlots.length > 0 ? (
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {daySlots.map(slot => {
                                                const isCurrentSlot = currentSlot?.id === slot.id;
                                                return (
                                                    <Card 
                                                        key={slot.id} 
                                                        className={`border-l-4 ${
                                                            isCurrentSlot 
                                                                ? 'border-l-green-500 bg-green-50 dark:bg-green-950/20' 
                                                                : 'border-l-blue-500'
                                                        }`}
                                                    >
                                                        <CardContent className="p-4 space-y-2">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex items-center gap-2 text-sm font-medium flex-1 min-w-0">
                                                                    <BookOpen className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                                                    <span className="truncate">{slot.subject}</span>
                                                                </div>
                                                                {isCurrentSlot && (
                                                                    <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full flex-shrink-0">
                                                                        Now
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <Clock className="h-4 w-4 flex-shrink-0" />
                                                                <span className="text-xs sm:text-sm">{slot.startTime} - {slot.endTime}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <User className="h-4 w-4 flex-shrink-0" />
                                                                <span className="truncate text-xs sm:text-sm">{getTeacherName(slot.teacherId)}</span>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground pl-6">No classes scheduled</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Classmates List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Classmates
                    </CardTitle>
                    <CardDescription>Students in {section?.name}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {sectionStudents.map(student => (
                            <div 
                                key={student.id}
                                className={`p-3 rounded-lg border flex items-center gap-2 ${
                                    student.id === studentId 
                                        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-500' 
                                        : 'bg-muted/50'
                                }`}
                            >
                                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm truncate">
                                    {student.name}
                                    {student.id === studentId && ' (You)'}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
