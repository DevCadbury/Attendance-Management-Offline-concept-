'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    getSectionsAction,
    createSectionAction,
    deleteSectionAction,
    assignStudentToSectionAction,
    getTimeSlotsAction,
    createTimeSlotAction,
    deleteTimeSlotAction
} from '@/app/actions/timetable';
import { getUsersAction } from '@/app/actions/users';
import { Section, TimeSlot } from '@/lib/db';
import { User } from '@/lib/storage';
import { toast } from 'sonner';
import { Plus, Trash2, Calendar, Users as UsersIcon, Clock } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
    { start: '08:00', end: '09:00' },
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' },
    { start: '12:00', end: '13:00' },
    { start: '13:00', end: '14:00' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
    { start: '16:00', end: '17:00' },
];

export function TimetableManagement() {
    const [sections, setSections] = useState<Section[]>([]);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Section form
    const [newSectionName, setNewSectionName] = useState('');
    
    // Slot form
    const [showSlotForm, setShowSlotForm] = useState(false);
    const [slotForm, setSlotForm] = useState({
        day: 'Monday' as TimeSlot['day'],
        startTime: '09:00',
        endTime: '10:00',
        subject: '',
        teacherId: '',
        sectionId: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [sectionsData, slotsData, usersData] = await Promise.all([
            getSectionsAction(),
            getTimeSlotsAction(),
            getUsersAction()
        ]);
        setSections(sectionsData);
        setTimeSlots(slotsData);
        setUsers(usersData);
        setLoading(false);
    };

    const handleCreateSection = async () => {
        if (!newSectionName.trim()) {
            toast.error('Please enter section name');
            return;
        }

        const result = await createSectionAction(newSectionName);
        if (result.success) {
            toast.success(result.message);
            setNewSectionName('');
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const handleDeleteSection = async (sectionId: string, sectionName: string) => {
        if (!confirm(`Delete ${sectionName}? All students will be unassigned.`)) return;

        const result = await deleteSectionAction(sectionId);
        if (result.success) {
            toast.success(result.message);
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const handleAssignStudent = async (studentId: string, sectionId: string) => {
        const result = await assignStudentToSectionAction(studentId, sectionId);
        if (result.success) {
            toast.success(result.message);
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const handleCreateSlot = async () => {
        if (!slotForm.subject || !slotForm.teacherId || !slotForm.sectionId) {
            toast.error('Please fill all fields');
            return;
        }

        const result = await createTimeSlotAction(slotForm);
        if (result.success) {
            toast.success(result.message);
            setShowSlotForm(false);
            setSlotForm({
                day: 'Monday',
                startTime: '09:00',
                endTime: '10:00',
                subject: '',
                teacherId: '',
                sectionId: ''
            });
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const handleDeleteSlot = async (slotId: string) => {
        if (!confirm('Delete this time slot?')) return;

        const result = await deleteTimeSlotAction(slotId);
        if (result.success) {
            toast.success(result.message);
            loadData();
        } else {
            toast.error(result.error);
        }
    };

    const teachers = users.filter(u => u.role === 'teacher');
    const students = users.filter(u => u.role === 'student');

    if (loading) {
        return <div className="text-center p-8">Loading timetable...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Sections Management */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UsersIcon className="h-5 w-5" />
                        Sections Management
                    </CardTitle>
                    <CardDescription>Create sections and assign students</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Section name (e.g., Section A)"
                                value={newSectionName}
                                onChange={(e) => setNewSectionName(e.target.value)}
                            />
                            <Button onClick={handleCreateSection}>
                                <Plus className="h-4 w-4 mr-2" /> Add Section
                            </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {sections.map((section) => (
                                <Card key={section.id} className="border-2">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg">{section.name}</CardTitle>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteSection(section.id, section.name)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                        <CardDescription>{section.studentIds.length} students</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Assign Students:</Label>
                                            <select
                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                onChange={(e) => handleAssignStudent(e.target.value, section.id)}
                                                value=""
                                            >
                                                <option value="">Select student...</option>
                                                {students.map((student) => (
                                                    <option key={student.id} value={student.id}>
                                                        {student.name} {student.sectionId === section.id && '✓'}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="text-xs text-muted-foreground mt-2">
                                                {students.filter(s => s.sectionId === section.id).map(s => (
                                                    <div key={s.id} className="py-1">{s.name}</div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Timetable Slots */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Timetable Slots
                            </CardTitle>
                            <CardDescription>Assign teachers to sections for specific time slots</CardDescription>
                        </div>
                        <Button onClick={() => setShowSlotForm(!showSlotForm)}>
                            <Plus className="h-4 w-4 mr-2" /> Add Slot
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {showSlotForm && (
                        <Card className="mb-6 bg-accent/50">
                            <CardContent className="pt-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label>Day</Label>
                                        <select
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={slotForm.day}
                                            onChange={(e) => setSlotForm({ ...slotForm, day: e.target.value as TimeSlot['day'] })}
                                        >
                                            {DAYS.map(day => (
                                                <option key={day} value={day}>{day}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Time Slot</Label>
                                        <select
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={slotForm.startTime}
                                            onChange={(e) => {
                                                const slot = TIME_SLOTS.find(s => s.start === e.target.value);
                                                if (slot) {
                                                    setSlotForm({ ...slotForm, startTime: slot.start, endTime: slot.end });
                                                }
                                            }}
                                        >
                                            {TIME_SLOTS.map(slot => (
                                                <option key={slot.start} value={slot.start}>
                                                    {slot.start} - {slot.end}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Subject</Label>
                                        <Input
                                            placeholder="e.g., Mathematics"
                                            value={slotForm.subject}
                                            onChange={(e) => setSlotForm({ ...slotForm, subject: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Teacher</Label>
                                        <select
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={slotForm.teacherId}
                                            onChange={(e) => setSlotForm({ ...slotForm, teacherId: e.target.value })}
                                        >
                                            <option value="">Select teacher...</option>
                                            {teachers.map(teacher => (
                                                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Section</Label>
                                        <select
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={slotForm.sectionId}
                                            onChange={(e) => setSlotForm({ ...slotForm, sectionId: e.target.value })}
                                        >
                                            <option value="">Select section...</option>
                                            {sections.map(section => (
                                                <option key={section.id} value={section.id}>{section.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Button onClick={handleCreateSlot}>Create Slot</Button>
                                    <Button variant="outline" onClick={() => setShowSlotForm(false)}>Cancel</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Timetable View */}
                    <div className="space-y-4">
                        {DAYS.map(day => {
                            const daySlots = timeSlots.filter(slot => slot.day === day);
                            if (daySlots.length === 0) return null;

                            return (
                                <div key={day}>
                                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        {day}
                                    </h3>
                                    <div className="grid gap-2">
                                        {daySlots.map(slot => {
                                            const teacher = teachers.find(t => t.id === slot.teacherId);
                                            const section = sections.find(s => s.id === slot.sectionId);
                                            
                                            return (
                                                <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-medium">{slot.startTime} - {slot.endTime}</span>
                                                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                                                                {slot.subject}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground mt-1">
                                                            {teacher?.name} • {section?.name}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteSlot(slot.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                        {timeSlots.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">
                                No time slots created yet. Click "Add Slot" to get started.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
