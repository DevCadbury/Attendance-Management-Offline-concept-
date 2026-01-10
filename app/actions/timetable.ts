'use server';

import {
    getSections,
    saveSection,
    deleteSection,
    getTimeSlots,
    saveTimeSlot,
    deleteTimeSlot,
    getSlotsBySection,
    getSlotsByTeacher,
    Section,
    TimeSlot
} from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getUsers, updateUser } from '@/lib/storage';

// Section Management
export async function createSectionAction(name: string) {
    try {
        const newSection: Section = {
            id: Math.random().toString(36).substring(7),
            name,
            studentIds: [],
            createdAt: Date.now()
        };

        await saveSection(newSection);
        revalidatePath('/admin');
        return { success: true, message: 'Section created successfully', section: newSection };
    } catch (error) {
        return { success: false, error: 'Failed to create section' };
    }
}

export async function updateSectionAction(sectionId: string, updates: Partial<Section>) {
    try {
        const sections = await getSections();
        const section = sections.find(s => s.id === sectionId);
        
        if (!section) {
            return { success: false, error: 'Section not found' };
        }

        const updatedSection = { ...section, ...updates };
        await saveSection(updatedSection);
        revalidatePath('/admin');
        return { success: true, message: 'Section updated successfully' };
    } catch (error) {
        return { success: false, error: 'Failed to update section' };
    }
}

export async function deleteSectionAction(sectionId: string) {
    try {
        // Remove section from all students
        const users = await getUsers();
        const studentsInSection = users.filter(u => u.sectionId === sectionId);
        
        for (const student of studentsInSection) {
            await updateUser(student.id, { sectionId: undefined });
        }

        await deleteSection(sectionId);
        revalidatePath('/admin');
        return { success: true, message: 'Section deleted successfully' };
    } catch (error) {
        return { success: false, error: 'Failed to delete section' };
    }
}

export async function assignStudentToSectionAction(studentId: string, sectionId: string) {
    try {
        await updateUser(studentId, { sectionId });
        revalidatePath('/admin');
        return { success: true, message: 'Student assigned to section' };
    } catch (error) {
        return { success: false, error: 'Failed to assign student to section' };
    }
}

export async function getSectionsAction() {
    return await getSections();
}

// Timetable Management
export async function createTimeSlotAction(slot: Omit<TimeSlot, 'id'>) {
    try {
        const newSlot: TimeSlot = {
            id: Math.random().toString(36).substring(7),
            ...slot
        };

        await saveTimeSlot(newSlot);
        revalidatePath('/admin');
        revalidatePath('/teacher');
        revalidatePath('/student');
        return { success: true, message: 'Time slot created successfully', slot: newSlot };
    } catch (error) {
        return { success: false, error: 'Failed to create time slot' };
    }
}

export async function updateTimeSlotAction(slotId: string, updates: Partial<TimeSlot>) {
    try {
        const slots = await getTimeSlots();
        const slot = slots.find(s => s.id === slotId);
        
        if (!slot) {
            return { success: false, error: 'Time slot not found' };
        }

        const updatedSlot = { ...slot, ...updates };
        await saveTimeSlot(updatedSlot);
        revalidatePath('/admin');
        revalidatePath('/teacher');
        revalidatePath('/student');
        return { success: true, message: 'Time slot updated successfully' };
    } catch (error) {
        return { success: false, error: 'Failed to update time slot' };
    }
}

export async function deleteTimeSlotAction(slotId: string) {
    try {
        await deleteTimeSlot(slotId);
        revalidatePath('/admin');
        revalidatePath('/teacher');
        revalidatePath('/student');
        return { success: true, message: 'Time slot deleted successfully' };
    } catch (error) {
        return { success: false, error: 'Failed to delete time slot' };
    }
}

export async function getTimeSlotsAction() {
    return await getTimeSlots();
}

export async function getSlotsBySectionAction(sectionId: string) {
    return await getSlotsBySection(sectionId);
}

export async function getSlotsByTeacherAction(teacherId: string) {
    return await getSlotsByTeacher(teacherId);
}

export async function getWeeklyTimetableAction(userId: string, role: 'teacher' | 'student') {
    try {
        const slots = role === 'teacher' 
            ? await getSlotsByTeacher(userId)
            : await getSlotsBySection(userId); // For student, pass their section ID
        
        // Group slots by day of week
        const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const timetableData = [];
        
        // Get current week dates
        const today = new Date();
        const currentDay = today.getDay(); // 0 = Sunday
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset);
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            
            const dayName = weekDays[i];
            const daySlots = slots.filter(slot => slot.day === dayName);
            
            timetableData.push({
                date: date.toISOString().split('T')[0],
                slots: daySlots.map(slot => ({
                    id: slot.id,
                    subject: slot.subject,
                    teacherId: slot.teacherId,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    sectionId: slot.sectionId,
                    day: slot.day
                }))
            });
        }
        
        return timetableData;
    } catch (error) {
        console.error('Error getting weekly timetable:', error);
        return [];
    }
}
