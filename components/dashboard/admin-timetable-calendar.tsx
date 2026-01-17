'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    getTimeSlotsAction,
    createTimeSlotAction,
    deleteTimeSlotAction,
    getSectionsAction
} from '@/app/actions/timetable';
import { getUsersAction } from '@/app/actions/users';
import { getHolidaysAction, saveHolidayAction, deleteHolidayAction } from '@/app/actions/holidays';
import { TimeSlot, Section, Holiday } from '@/lib/db';
import { User } from '@/lib/storage';
import { toast } from 'sonner';
import {
    Calendar,
    Copy,
    Edit,
    Trash2,
    Save,
    X,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Check,
    Settings,
    Plus
} from 'lucide-react';

interface ConfirmDialog {
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS_RANGE = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

interface DraggedSlot {
    slot: TimeSlot;
    originalDay: string;
}

// Use Holiday type from db
// interface Holiday {
//     date: string;
//     message: string;
// }

interface WeekTemplate {
    id: string;
    name: string;
    slots: Omit<TimeSlot, 'id'>[];
    isDefault: boolean;
}

interface CreateSlotForm {
    day: string;
    time: string;
    subject: string;
    teacherId: string;
    sectionId: string;
    show: boolean;
}

export function AdminTimetableCalendar() {
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSection, setSelectedSection] = useState<string>('all');
    const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
    const [draggedSlot, setDraggedSlot] = useState<DraggedSlot | null>(null);
    const [editingSlot, setEditingSlot] = useState<string | null>(null);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [showHolidayForm, setShowHolidayForm] = useState(false);
    const [holidayForm, setHolidayForm] = useState({ date: '', message: '' });
    const [templates, setTemplates] = useState<WeekTemplate[]>([]);
    const [showTemplateForm, setShowTemplateForm] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [createSlotForm, setCreateSlotForm] = useState<CreateSlotForm>({
        day: '',
        time: '',
        subject: '',
        teacherId: '',
        sectionId: '',
        show: false
    });

    const [editForm, setEditForm] = useState({
        subject: '',
        teacherId: '',
        startTime: '',
        endTime: ''
    });

    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
        show: false,
        title: '',
        message: '',
        onConfirm: () => {},
        variant: 'info'
    });

    const showConfirm = (title: string, message: string, onConfirm: () => void, variant: 'danger' | 'warning' | 'info' = 'info') => {
        setConfirmDialog({ show: true, title, message, onConfirm, variant });
    };

    const hideConfirm = () => {
        setConfirmDialog({ ...confirmDialog, show: false });
    };

    useEffect(() => {
        loadData();
        loadHolidays();
        loadTemplates();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [slotsData, sectionsData, usersData] = await Promise.all([
            getTimeSlotsAction(),
            getSectionsAction(),
            getUsersAction()
        ]);
        setTimeSlots(slotsData);
        setSections(sectionsData);
        setUsers(usersData);
        setLoading(false);
    };

    const loadHolidays = async () => {
        const holidaysData = await getHolidaysAction();
        setHolidays(holidaysData);
    };

    const loadTemplates = () => {
        const stored = localStorage.getItem('timetable_templates');
        if (stored) setTemplates(JSON.parse(stored));
    };

    const saveTemplates = (newTemplates: WeekTemplate[]) => {
        localStorage.setItem('timetable_templates', JSON.stringify(newTemplates));
        setTemplates(newTemplates);
    };

    const getCurrentWeekDates = () => {
        const today = new Date();
        const currentDay = today.getDay();
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset + (currentWeekOffset * 7));

        return DAYS.map((_, i) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            return date;
        });
    };

    const weekDates = getCurrentWeekDates();

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getDateString = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const isHoliday = (date: Date) => {
        return holidays.find(h => h.date === getDateString(date));
    };

    const teachers = users.filter(u => u.role === 'teacher');

    const filteredSlots = selectedSection === 'all'
        ? timeSlots
        : timeSlots.filter(slot => slot.sectionId === selectedSection);

    const handleDragStart = (slot: TimeSlot, day: string) => {
        setDraggedSlot({ slot, originalDay: day });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (targetDay: string, targetTime: string) => {
        if (!draggedSlot) return;

        showConfirm(
            'Clone Slot',
            `Clone this slot to ${targetDay} at ${targetTime}?`,
            async () => {
                const newSlot = {
                    day: targetDay as TimeSlot['day'],
                    startTime: targetTime,
                    endTime: getEndTime(targetTime),
                    subject: draggedSlot.slot.subject,
                    teacherId: draggedSlot.slot.teacherId,
                    sectionId: draggedSlot.slot.sectionId
                };

                const result = await createTimeSlotAction(newSlot);
                if (result.success) {
                    toast.success('Slot cloned successfully');
                    loadData();
                } else {
                    toast.error(result.error);
                }
                hideConfirm();
                setDraggedSlot(null);
            },
            'info'
        );
    };

    const getEndTime = (startTime: string) => {
        const index = TIME_SLOTS_RANGE.indexOf(startTime);
        return TIME_SLOTS_RANGE[index + 1] || '18:00';
    };

    const handleEdit = (slot: TimeSlot) => {
        setEditingSlot(slot.id);
        setEditForm({
            subject: slot.subject,
            teacherId: slot.teacherId,
            startTime: slot.startTime,
            endTime: slot.endTime
        });
    };

    const handleSaveEdit = async (slotId: string) => {
        const slot = timeSlots.find(s => s.id === slotId);
        if (!slot) return;

        await deleteTimeSlotAction(slotId);
        const result = await createTimeSlotAction({
            day: slot.day,
            startTime: editForm.startTime,
            endTime: editForm.endTime,
            subject: editForm.subject,
            teacherId: editForm.teacherId,
            sectionId: slot.sectionId
        });

        if (result.success) {
            toast.success('Slot updated successfully');
            setEditingSlot(null);
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const handleDeleteDay = async (day: string) => {
        const daySlots = filteredSlots.filter(s => s.day === day);
        if (daySlots.length === 0) return;

        showConfirm(
            'Delete All Slots',
            `Are you sure you want to delete all ${daySlots.length} slots for ${day}? This action cannot be undone.`,
            async () => {
                for (const slot of daySlots) {
                    await deleteTimeSlotAction(slot.id);
                }
                toast.success(`Deleted all slots for ${day}`);
                loadData();
                hideConfirm();
            },
            'danger'
        );
    };

    const handleAddHoliday = async () => {
        if (!holidayForm.date || !holidayForm.message) {
            toast.error('Please fill all fields');
            return;
        }

        const result = await saveHolidayAction(holidayForm.date, holidayForm.message);
        if (result.success) {
            await loadHolidays();
            setHolidayForm({ date: '', message: '' });
            setShowHolidayForm(false);
            toast.success('Holiday added');
        } else {
            toast.error(result.error || 'Failed to add holiday');
        }
    };

    const handleRemoveHoliday = async (date: string) => {
        const result = await deleteHolidayAction(date);
        if (result.success) {
            await loadHolidays();
            toast.success('Holiday removed');
        } else {
            toast.error(result.error || 'Failed to remove holiday');
        }
    };

    const handleSaveAsTemplate = () => {
        if (!templateName.trim()) {
            toast.error('Please enter template name');
            return;
        }

        const weekSlots = selectedSection === 'all' 
            ? timeSlots.map(({ id, ...slot }) => slot)
            : timeSlots.filter(s => s.sectionId === selectedSection).map(({ id, ...slot }) => slot);

        if (weekSlots.length === 0) {
            toast.error('No slots to save as template');
            return;
        }

        const newTemplate: WeekTemplate = {
            id: Math.random().toString(36).substring(7),
            name: templateName,
            slots: weekSlots,
            isDefault: false
        };

        const newTemplates = [...templates, newTemplate];
        saveTemplates(newTemplates);
        setTemplateName('');
        setShowTemplateForm(false);
        toast.success(`Template saved with ${weekSlots.length} slots`);
    };

    const handleSetDefaultTemplate = (templateId: string) => {
        const newTemplates = templates.map(t => ({
            ...t,
            isDefault: t.id === templateId
        }));
        saveTemplates(newTemplates);
        toast.success('Default template set');
    };

    const handleApplyTemplate = async (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (!template) return;

        showConfirm(
            'Apply Template',
            `Apply template "${template.name}"? This will add ${template.slots.length} slots.\n\nNote: Template days will match calendar days (Monday → Monday, Sunday → Sunday, etc.)`,
            async () => {

        let successCount = 0;
        let skipCount = 0;

        for (const slot of template.slots) {
            const dayIndex = DAYS.indexOf(slot.day);
            if (dayIndex === -1) {
                skipCount++;
                continue;
            }

            const targetDate = weekDates[dayIndex];
            const targetDayName = DAYS[targetDate.getDay() === 0 ? 6 : targetDate.getDay() - 1];

            if (slot.day !== targetDayName) {
                skipCount++;
                continue;
            }

            const exists = timeSlots.some(
                s => s.day === slot.day && 
                     s.startTime === slot.startTime && 
                     s.sectionId === slot.sectionId
            );

            if (!exists) {
                const result = await createTimeSlotAction(slot);
                if (result.success) {
                    successCount++;
                } else {
                    skipCount++;
                }
            } else {
                skipCount++;
            }
        }

                toast.success(`Applied ${successCount} slots${skipCount > 0 ? `, skipped ${skipCount}` : ''}`);
                loadData();
                hideConfirm();
            },
            'warning'
        );
    };

    const handleDeleteTemplate = (templateId: string) => {
        showConfirm(
            'Delete Template',
            'Are you sure you want to delete this template? This action cannot be undone.',
            () => {
                saveTemplates(templates.filter(t => t.id !== templateId));
                toast.success('Template deleted');
                hideConfirm();
            },
            'danger'
        );
    };

    const handleCreateSlotInGrid = (day: string, time: string) => {
        setCreateSlotForm({
            day,
            time,
            subject: '',
            teacherId: teachers[0]?.id || '',
            sectionId: selectedSection === 'all' ? sections[0]?.id || '' : selectedSection,
            show: true
        });
    };

    const handleSaveNewSlot = async () => {
        if (!createSlotForm.subject || !createSlotForm.teacherId || !createSlotForm.sectionId) {
            toast.error('Please fill all fields');
            return;
        }

        const result = await createTimeSlotAction({
            day: createSlotForm.day as TimeSlot['day'],
            startTime: createSlotForm.time,
            endTime: getEndTime(createSlotForm.time),
            subject: createSlotForm.subject,
            teacherId: createSlotForm.teacherId,
            sectionId: createSlotForm.sectionId
        });

        if (result.success) {
            toast.success('Slot created');
            setCreateSlotForm({ day: '', time: '', subject: '', teacherId: '', sectionId: '', show: false });
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    if (loading) {
        return <div className="text-center p-8">Loading calendar...</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Timetable Calendar
                            </CardTitle>
                            <CardDescription>Manage weekly schedules with drag & drop</CardDescription>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowTemplateForm(!showTemplateForm)}
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                Templates
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowHolidayForm(!showHolidayForm)}
                            >
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Holidays
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Label>Section:</Label>
                        <select
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                        >
                            <option value="all">All Sections</option>
                            {sections.map(section => (
                                <option key={section.id} value={section.id}>{section.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentWeekOffset(prev => prev - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-sm font-medium">
                            Week of {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentWeekOffset(prev => prev + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {showHolidayForm && (
                        <Card className="bg-accent/50">
                            <CardContent className="pt-4">
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                        <Label>Date</Label>
                                        <Input
                                            type="date"
                                            value={holidayForm.date}
                                            onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Message</Label>
                                        <Input
                                            placeholder="e.g., National Holiday"
                                            value={holidayForm.message}
                                            onChange={(e) => setHolidayForm({ ...holidayForm, message: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <Button size="sm" onClick={handleAddHoliday}>
                                        <Check className="h-4 w-4 mr-2" /> Add
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setShowHolidayForm(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {showTemplateForm && (
                        <Card className="bg-accent/50">
                            <CardContent className="pt-4 space-y-3">
                                <div>
                                    <Label>Save Current View as Template</Label>
                                    <div className="flex gap-2 mt-2">
                                        <Input
                                            placeholder="Template name"
                                            value={templateName}
                                            onChange={(e) => setTemplateName(e.target.value)}
                                        />
                                        <Button size="sm" onClick={handleSaveAsTemplate}>
                                            <Save className="h-4 w-4 mr-2" /> Save
                                        </Button>
                                    </div>
                                </div>

                                {templates.length > 0 && (
                                    <div>
                                        <Label className="mb-2 block">Saved Templates</Label>
                                        <div className="space-y-2">
                                            {templates.map(template => (
                                                <div key={template.id} className="flex items-center justify-between p-2 border rounded">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">{template.name}</span>
                                                        {template.isDefault && (
                                                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                                                                Default
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-muted-foreground">
                                                            ({template.slots.length} slots)
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleApplyTemplate(template.id)}
                                                        >
                                                            Apply
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleSetDefaultTemplate(template.id)}
                                                        >
                                                            {template.isDefault ? '✓' : 'Set Default'}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleDeleteTemplate(template.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>

            <div className="overflow-x-auto">
                <div className="min-w-[1000px]">
                    <div className="grid grid-cols-8 gap-2">
                        <div className="font-semibold text-sm p-2">Time</div>
                        
                        {DAYS.map((day, idx) => {
                            const date = weekDates[idx];
                            const holiday = isHoliday(date);
                            
                            return (
                                <div key={day} className="space-y-1">
                                    <div className={`p-2 rounded-lg text-center ${holiday ? 'bg-red-500/10' : 'bg-accent'}`}>
                                        <div className="font-semibold text-sm">{day}</div>
                                        <div className="text-xs text-muted-foreground">{formatDate(date)}</div>
                                        {holiday && (
                                            <div className="text-xs text-red-600 font-medium mt-1 flex items-center justify-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {holiday.message}
                                                <button
                                                    onClick={() => handleRemoveHoliday(holiday.date)}
                                                    className="ml-1 hover:text-red-800"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-xs"
                                        onClick={() => handleDeleteDay(day)}
                                    >
                                        <Trash2 className="h-3 w-3 mr-1" /> Clear Day
                                    </Button>
                                </div>
                            );
                        })}

                        {TIME_SLOTS_RANGE.slice(0, -1).map((time) => (
                            <>
                                <div key={`time-${time}`} className="p-2 text-sm font-medium text-muted-foreground">
                                    {time}
                                </div>
                                
                                {DAYS.map((day) => {
                                    const daySlot = filteredSlots.find(
                                        s => s.day === day && s.startTime === time
                                    );
                                    const holiday = isHoliday(weekDates[DAYS.indexOf(day)]);
                                    const isCreating = createSlotForm.show && createSlotForm.day === day && createSlotForm.time === time;

                                    return (
                                        <div
                                            key={`${day}-${time}`}
                                            className={`min-h-[80px] p-2 border-2 border-dashed rounded-lg transition-colors ${
                                                holiday
                                                    ? 'bg-red-500/5 border-red-300'
                                                    : daySlot
                                                    ? 'border-border'
                                                    : 'border-border hover:border-primary/50 hover:bg-accent/50 cursor-pointer'
                                            }`}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                if (!holiday) handleDrop(day, time);
                                            }}
                                            onClick={() => {
                                                if (!holiday && !daySlot && !isCreating) {
                                                    handleCreateSlotInGrid(day, time);
                                                }
                                            }}
                                        >
                                            {!holiday && isCreating && (
                                                <div className="bg-card border-2 border-primary rounded p-2">
                                                    <div className="space-y-2">
                                                        <Input
                                                            placeholder="Subject"
                                                            value={createSlotForm.subject}
                                                            onChange={(e) => setCreateSlotForm({ ...createSlotForm, subject: e.target.value })}
                                                            className="text-xs h-7"
                                                            autoFocus
                                                        />
                                                        <select
                                                            className="w-full text-xs rounded border px-2 py-1"
                                                            value={createSlotForm.teacherId}
                                                            onChange={(e) => setCreateSlotForm({ ...createSlotForm, teacherId: e.target.value })}
                                                        >
                                                            {teachers.map(t => (
                                                                <option key={t.id} value={t.id}>{t.name}</option>
                                                            ))}
                                                        </select>
                                                        <select
                                                            className="w-full text-xs rounded border px-2 py-1"
                                                            value={createSlotForm.sectionId}
                                                            onChange={(e) => setCreateSlotForm({ ...createSlotForm, sectionId: e.target.value })}
                                                        >
                                                            {sections.map(s => (
                                                                <option key={s.id} value={s.id}>{s.name}</option>
                                                            ))}
                                                        </select>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                size="sm"
                                                                className="h-6 text-xs flex-1"
                                                                onClick={handleSaveNewSlot}
                                                            >
                                                                <Save className="h-3 w-3 mr-1" /> Save
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-6 text-xs"
                                                                onClick={() => setCreateSlotForm({ ...createSlotForm, show: false })}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {!holiday && !isCreating && daySlot && (
                                                <div
                                                    draggable
                                                    onDragStart={() => handleDragStart(daySlot, day)}
                                                    className="bg-card border border-border rounded p-2 cursor-move hover:shadow-md transition-shadow"
                                                >
                                                    {editingSlot === daySlot.id ? (
                                                        <div className="space-y-2">
                                                            <Input
                                                                value={editForm.subject}
                                                                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                                                                placeholder="Subject"
                                                                className="text-xs h-6"
                                                            />
                                                            <select
                                                                className="w-full text-xs rounded border px-1 py-1"
                                                                value={editForm.teacherId}
                                                                onChange={(e) => setEditForm({ ...editForm, teacherId: e.target.value })}
                                                            >
                                                                {teachers.map(t => (
                                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                                ))}
                                                            </select>
                                                            <div className="flex gap-1">
                                                                <Button
                                                                    size="sm"
                                                                    className="h-6 text-xs"
                                                                    onClick={() => handleSaveEdit(daySlot.id)}
                                                                >
                                                                    <Save className="h-3 w-3" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-6 text-xs"
                                                                    onClick={() => setEditingSlot(null)}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="font-medium text-xs mb-1 text-primary">
                                                                {daySlot.subject}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {teachers.find(t => t.id === daySlot.teacherId)?.name}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                {sections.find(s => s.id === daySlot.sectionId)?.name}
                                                            </div>
                                                            <div className="flex gap-1 mt-2">
                                                                <button
                                                                    onClick={() => handleEdit(daySlot)}
                                                                    className="text-blue-600 hover:text-blue-800"
                                                                >
                                                                    <Edit className="h-3 w-3" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDragStart(daySlot, day)}
                                                                    className="text-green-600 hover:text-green-800"
                                                                >
                                                                    <Copy className="h-3 w-3" />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        showConfirm(
                                                                            'Delete Slot',
                                                                            'Are you sure you want to delete this time slot?',
                                                                            async () => {
                                                                                await deleteTimeSlotAction(daySlot.id);
                                                                                toast.success('Slot deleted');
                                                                                loadData();
                                                                                hideConfirm();
                                                                            },
                                                                            'danger'
                                                                        );
                                                                    }}
                                                                    className="text-red-600 hover:text-red-800"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                            {!holiday && !daySlot && !isCreating && (
                                                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                                                    <Plus className="h-4 w-4" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </>
                        ))}
                    </div>
                </div>
            </div>

            <Card>
                <CardContent className="pt-4 space-y-3">
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-dashed border-border bg-accent/50 rounded" />
                            <span>Click empty cell to create slot</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Copy className="h-4 w-4 text-green-600" />
                            <span>Drag to clone slot</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Edit className="h-4 w-4 text-blue-600" />
                            <span>Edit slot inline</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Trash2 className="h-4 w-4 text-red-600" />
                            <span>Delete slot/day</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span>Holiday (no scheduling)</span>
                        </div>
                    </div>
                    <div className="text-xs text-muted-foreground border-t pt-3">
                        <strong>Templates:</strong> Save current week schedule as a reusable template. When applying, 
                        template days will match calendar days (Monday template slots → Monday dates, Sunday → Sunday, etc.)
                    </div>
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            {confirmDialog.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                        onClick={hideConfirm}
                    />
                    <Card className="relative z-50 w-full max-w-md mx-4 shadow-2xl border-2">
                        <CardHeader className={`${
                            confirmDialog.variant === 'danger' ? 'bg-red-500/10 border-b-2 border-red-500/20' :
                            confirmDialog.variant === 'warning' ? 'bg-yellow-500/10 border-b-2 border-yellow-500/20' :
                            'bg-blue-500/10 border-b-2 border-blue-500/20'
                        }`}>
                            <CardTitle className="flex items-center gap-2">
                                {confirmDialog.variant === 'danger' && (
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                )}
                                {confirmDialog.variant === 'warning' && (
                                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                                )}
                                {confirmDialog.variant === 'info' && (
                                    <Check className="h-5 w-5 text-blue-600" />
                                )}
                                {confirmDialog.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground whitespace-pre-line mb-6">
                                {confirmDialog.message}
                            </p>
                            <div className="flex gap-3 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={hideConfirm}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant={confirmDialog.variant === 'danger' ? 'destructive' : 'default'}
                                    onClick={() => {
                                        confirmDialog.onConfirm();
                                    }}
                                    className={confirmDialog.variant === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                                >
                                    {confirmDialog.variant === 'danger' ? 'Delete' : 'Confirm'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
