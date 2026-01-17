'use server';

import { getHolidays, saveHoliday, deleteHoliday, getUpcomingHolidays, Holiday } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getHolidaysAction() {
    return await getHolidays();
}

export async function getUpcomingHolidaysAction(limit: number = 5) {
    return await getUpcomingHolidays(limit);
}

export async function saveHolidayAction(date: string, message: string) {
    try {
        const holiday: Holiday = {
            id: Math.random().toString(36).substring(7),
            date,
            message,
            createdAt: Date.now()
        };
        
        await saveHoliday(holiday);
        revalidatePath('/admin/timetable');
        revalidatePath('/teacher');
        revalidatePath('/student');
        return { success: true, message: 'Holiday added successfully' };
    } catch (error) {
        return { success: false, error: 'Failed to add holiday' };
    }
}

export async function deleteHolidayAction(date: string) {
    try {
        await deleteHoliday(date);
        revalidatePath('/admin/timetable');
        revalidatePath('/teacher');
        revalidatePath('/student');
        return { success: true, message: 'Holiday deleted successfully' };
    } catch (error) {
        return { success: false, error: 'Failed to delete holiday' };
    }
}
