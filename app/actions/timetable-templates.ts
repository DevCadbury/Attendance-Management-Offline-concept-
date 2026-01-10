'use server';

import { TimetableTemplateModel, TimetableOverrideModel } from '@/lib/models-extended';
import { getTimeSlots, saveTimeSlot, TimeSlot } from '@/lib/db';
import connectDB from '@/lib/mongodb';
import { revalidatePath } from 'next/cache';
import { formatDate, getWeekDates } from '@/lib/utils/calendar';

// Get all timetable templates
export async function getTemplatesAction() {
    try {
        await connectDB();
        const templates = await TimetableTemplateModel.find({}).lean();
        
        return templates.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description,
            schedule: t.schedule,
            createdAt: t.createdAt
        }));
    } catch (error) {
        console.error('Error fetching templates:', error);
        return [];
    }
}

// Create a new template
export async function createTemplateAction(name: string, description?: string) {
    try {
        await connectDB();
        
        const template = await TimetableTemplateModel.create({
            id: Math.random().toString(36).substring(2, 15),
            name,
            description,
            schedule: [],
            createdAt: Date.now()
        });
        
        revalidatePath('/admin/timetable');
        return { success: true, templateId: template.id };
    } catch (error) {
        console.error('Error creating template:', error);
        return { success: false, error: 'Failed to create template' };
    }
}

// Delete template
export async function deleteTemplateAction(templateId: string) {
    try {
        await connectDB();
        await TimetableTemplateModel.deleteOne({ id: templateId });
        revalidatePath('/admin/timetable');
        return { success: true };
    } catch (error) {
        console.error('Error deleting template:', error);
        return { success: false, error: 'Failed to delete template' };
    }
}

// Apply template to a specific week
export async function applyTemplateAction(templateId: string, weekStartDate: string) {
    try {
        await connectDB();
        
        const template = await TimetableTemplateModel.findOne({ id: templateId }).lean();
        if (!template) {
            return { success: false, error: 'Template not found' };
        }
        
        const weekStart = new Date(weekStartDate);
        const weekDates = getWeekDates(weekStart);
        
        // Create overrides for each day in the week based on template
        for (let i = 0; i < weekDates.length; i++) {
            const date = formatDate(weekDates[i]);
            const dayName = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][i];
            const daySchedule = template.schedule.find((s: any) => s.day.toLowerCase() === dayName);
            
            if (daySchedule && daySchedule.slots.length > 0) {
                // Check if override already exists
                const existing = await TimetableOverrideModel.findOne({ date });
                
                if (existing) {
                    // Update existing override
                    await TimetableOverrideModel.updateOne(
                        { date },
                        { $set: { slots: daySchedule.slots } }
                    );
                } else {
                    // Create new override
                    await TimetableOverrideModel.create({
                        id: Math.random().toString(36).substring(2, 15),
                        date,
                        sectionId: 'all', // Apply to all sections or make it section-specific
                        slots: daySchedule.slots,
                        createdAt: Date.now()
                    });
                }
            }
        }
        
        revalidatePath('/admin/timetable');
        revalidatePath('/teacher/timetable');
        revalidatePath('/student/timetable');
        
        return { success: true };
    } catch (error) {
        console.error('Error applying template:', error);
        return { success: false, error: 'Failed to apply template' };
    }
}

// Get timetable for a specific date (checks overrides first, then regular slots)
export async function getTimetableForDateAction(date: string, sectionId?: string, teacherId?: string) {
    try {
        await connectDB();
        
        // First check for date-specific overrides
        const override = await TimetableOverrideModel.findOne({ 
            date,
            $or: [{ sectionId: 'all' }, { sectionId }]
        }).lean();
        
        if (override) {
            return override.slots.map((slot: any) => ({
                id: slot.id || Math.random().toString(36).substring(2, 15),
                subject: slot.subject,
                teacher: slot.teacher,
                startTime: slot.startTime,
                endTime: slot.endTime,
                room: slot.room
            }));
        }
        
        // If no override, get regular timetable
        const dateObj = new Date(date);
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dateObj.getDay()];
        
        let slots: TimeSlot[] = [];
        
        if (teacherId) {
            const allSlots = await getTimeSlots();
            slots = allSlots.filter(s => 
                s.teacherId === teacherId && 
                s.day.toLowerCase() === dayName
            );
        } else if (sectionId) {
            const allSlots = await getTimeSlots();
            slots = allSlots.filter(s => 
                s.sectionId === sectionId && 
                s.day.toLowerCase() === dayName
            );
        }
        
        return slots.map(slot => ({
            id: slot.id,
            subject: slot.subject,
            startTime: slot.startTime,
            endTime: slot.endTime,
            teacher: slot.teacherId,
            room: ''
        }));
    } catch (error) {
        console.error('Error fetching timetable for date:', error);
        return [];
    }
}

// Edit specific date timetable without affecting template
export async function editDateTimetableAction(date: string, sectionId: string, slots: any[]) {
    try {
        await connectDB();
        
        const existing = await TimetableOverrideModel.findOne({ date, sectionId });
        
        if (existing) {
            await TimetableOverrideModel.updateOne(
                { date, sectionId },
                { $set: { slots } }
            );
        } else {
            await TimetableOverrideModel.create({
                id: Math.random().toString(36).substring(2, 15),
                date,
                sectionId,
                slots,
                createdAt: Date.now()
            });
        }
        
        revalidatePath('/admin/timetable');
        revalidatePath('/teacher/timetable');
        revalidatePath('/student/timetable');
        
        return { success: true };
    } catch (error) {
        console.error('Error editing date timetable:', error);
        return { success: false, error: 'Failed to edit timetable' };
    }
}
