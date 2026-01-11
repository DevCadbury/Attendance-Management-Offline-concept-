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
    assignStudentToSectionAction
} from '@/app/actions/timetable';
import { getUsersAction } from '@/app/actions/users';
import { Section } from '@/lib/db';
import { User } from '@/lib/storage';
import { toast } from 'sonner';
import { Plus, Trash2, Users as UsersIcon, GraduationCap } from 'lucide-react';

export function SectionsManagement() {
    const [sections, setSections] = useState<Section[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [newSectionName, setNewSectionName] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [sectionsData, usersData] = await Promise.all([
            getSectionsAction(),
            getUsersAction()
        ]);
        setSections(sectionsData);
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

    const students = users.filter(u => u.role === 'student');

    if (loading) {
        return <div className="text-center p-8">Loading sections...</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UsersIcon className="h-5 w-5" />
                        Sections Management
                    </CardTitle>
                    <CardDescription>Create sections and assign students to organize your classes</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Section name (e.g., Section A, Grade 10-A)"
                                value={newSectionName}
                                onChange={(e) => setNewSectionName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleCreateSection()}
                            />
                            <Button onClick={handleCreateSection}>
                                <Plus className="h-4 w-4 mr-2" /> Add Section
                            </Button>
                        </div>

                        {sections.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground mb-4">No sections created yet</p>
                                <p className="text-sm text-muted-foreground">Create your first section to get started</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {sections.map((section) => {
                                    const sectionStudents = students.filter(s => s.sectionId === section.id);
                                    const unassignedStudents = students.filter(s => !s.sectionId || s.sectionId === '');

                                    return (
                                        <Card key={section.id} className="border-2 hover:border-primary/50 transition-colors">
                                            <CardHeader className="pb-3">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <CardTitle className="text-lg">{section.name}</CardTitle>
                                                        <CardDescription className="flex items-center gap-1 mt-1">
                                                            <UsersIcon className="h-3 w-3" />
                                                            {sectionStudents.length} student{sectionStudents.length !== 1 ? 's' : ''}
                                                        </CardDescription>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteSection(section.id, section.name)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {/* Assign Students */}
                                                    {unassignedStudents.length > 0 && (
                                                        <div>
                                                            <Label className="text-xs mb-1 block">Assign Students:</Label>
                                                            <select
                                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                                onChange={(e) => {
                                                                    if (e.target.value) {
                                                                        handleAssignStudent(e.target.value, section.id);
                                                                        e.target.value = '';
                                                                    }
                                                                }}
                                                                value=""
                                                            >
                                                                <option value="">Select student...</option>
                                                                {unassignedStudents.map((student) => (
                                                                    <option key={student.id} value={student.id}>
                                                                        {student.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}

                                                    {/* Current Students */}
                                                    {sectionStudents.length > 0 ? (
                                                        <div>
                                                            <Label className="text-xs mb-2 block">Students in this section:</Label>
                                                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                                                {sectionStudents.map(student => (
                                                                    <div
                                                                        key={student.id}
                                                                        className="flex items-center justify-between p-2 bg-accent/50 rounded text-sm"
                                                                    >
                                                                        <span className="flex items-center gap-2">
                                                                            <GraduationCap className="h-3 w-3" />
                                                                            {student.name}
                                                                        </span>
                                                                        <button
                                                                            onClick={() => handleAssignStudent(student.id, '')}
                                                                            className="text-red-600 hover:text-red-800"
                                                                            title="Remove from section"
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded">
                                                            No students assigned yet
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Sections</CardDescription>
                        <CardTitle className="text-3xl">{sections.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Students</CardDescription>
                        <CardTitle className="text-3xl">{students.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Unassigned Students</CardDescription>
                        <CardTitle className="text-3xl text-orange-600">
                            {students.filter(s => !s.sectionId || s.sectionId === '').length}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}
