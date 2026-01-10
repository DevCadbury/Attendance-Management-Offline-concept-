'use client';

import { WeeklyTimetableGrid } from '@/components/timetable/weekly-timetable-grid';
import { useState, useEffect } from 'react';
import { getTimetableForDateAction } from '@/app/actions/timetable-templates';
import { formatDate, getWeekDates } from '@/lib/utils/calendar';
import { getUsersAction } from '@/app/actions/users';

export function TeacherTimetableViewEnhanced({ teacherId }: { teacherId: string }) {
    const [timetableData, setTimetableData] = useState([]);
    const [currentWeek, setCurrentWeek] = useState(new Date());

    useEffect(() => {
        fetchTimetable();
    }, [teacherId, currentWeek]);

    const fetchTimetable = async () => {
        const weekDates = getWeekDates(currentWeek);
        const results = [];

        // Fetch all users to get teacher names
        const users = await getUsersAction();
        const teacherMap = new Map(users.filter(u => u.role === 'teacher').map(u => [u.id, u.name]));

        for (const date of weekDates) {
            const dateStr = formatDate(date);
            const slots = await getTimetableForDateAction(dateStr, undefined, teacherId);
            
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

    return (
        <div className="space-y-6">
            <WeeklyTimetableGrid 
                timetableData={timetableData}
                title="My Teaching Schedule"
            />
        </div>
    );
}
