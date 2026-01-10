'use client';

import { WeeklyTimetableGrid } from '@/components/timetable/weekly-timetable-grid';
import { useState, useEffect } from 'react';
import { getTimetableForDateAction } from '@/app/actions/timetable-templates';
import { formatDate, getWeekDates } from '@/lib/utils/calendar';
import { getUsersAction } from '@/app/actions/users';

export function StudentTimetableViewEnhanced({ studentId, sectionId }: { studentId: string; sectionId?: string }) {
    const [timetableData, setTimetableData] = useState([]);
    const [currentWeek, setCurrentWeek] = useState(new Date());

    useEffect(() => {
        if (sectionId) {
            fetchTimetable();
        }
    }, [studentId, sectionId, currentWeek]);

    const fetchTimetable = async () => {
        if (!sectionId) return;

        const weekDates = getWeekDates(currentWeek);
        const results = [];

        // Fetch all users to get teacher names
        const users = await getUsersAction();
        const teacherMap = new Map(users.filter(u => u.role === 'teacher').map(u => [u.id, u.name]));

        for (const date of weekDates) {
            const dateStr = formatDate(date);
            const slots = await getTimetableForDateAction(dateStr, sectionId);
            
            // Add teacher names to slots
            const slotsWithNames = slots.map(slot => ({
                ...slot,
                teacherId: slot.teacher,
                teacherName: slot.teacher ? teacherMap.get(slot.teacher) || slot.teacher : 'Unknown'
            }));
            
            results.push({
                date: dateStr,
                slots: slotsWithNames
            });
        }

        setTimetableData(results as any);
    };

    if (!sectionId) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p>You are not assigned to any section yet.</p>
                <p className="text-sm">Please contact your administrator.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <WeeklyTimetableGrid 
                timetableData={timetableData}
                title="My Class Schedule"
            />
        </div>
    );
}
