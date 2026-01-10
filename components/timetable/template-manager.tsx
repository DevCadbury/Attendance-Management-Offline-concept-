'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Plus, Edit, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface TimetableTemplate {
    id: string;
    name: string;
    description?: string;
    schedule: {
        day: string;
        slots: {
            subject: string;
            startTime: string;
            endTime: string;
            teacher?: string;
            room?: string;
        }[];
    }[];
    createdAt: number;
}

interface TemplateManagerProps {
    templates: TimetableTemplate[];
    onCreateTemplate: (template: Omit<TimetableTemplate, 'id' | 'createdAt'>) => Promise<void>;
    onUpdateTemplate: (id: string, template: Partial<TimetableTemplate>) => Promise<void>;
    onDeleteTemplate: (id: string) => Promise<void>;
    onApplyTemplate: (templateId: string, weekStart: string) => Promise<void>;
}

export function TemplateManager({ 
    templates, 
    onCreateTemplate, 
    onUpdateTemplate, 
    onDeleteTemplate,
    onApplyTemplate 
}: TemplateManagerProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    const handleCreate = async () => {
        if (!formData.name.trim()) {
            toast.error('Template name is required');
            return;
        }

        try {
            await onCreateTemplate({
                name: formData.name,
                description: formData.description,
                schedule: []
            });
            setFormData({ name: '', description: '' });
            setIsCreating(false);
            toast.success('Template created successfully');
        } catch (error) {
            toast.error('Failed to create template');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this template?')) {
            try {
                await onDeleteTemplate(id);
                toast.success('Template deleted successfully');
            } catch (error) {
                toast.error('Failed to delete template');
            }
        }
    };

    const handleApply = async (templateId: string) => {
        const weekStart = prompt('Enter week start date (YYYY-MM-DD):');
        if (weekStart) {
            try {
                await onApplyTemplate(templateId, weekStart);
                toast.success('Template applied to week successfully');
            } catch (error) {
                toast.error('Failed to apply template');
            }
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Timetable Templates
                    </CardTitle>
                    <Button onClick={() => setIsCreating(true)} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        New Template
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isCreating && (
                    <Card className="border-2 border-dashed">
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="template-name" className="text-foreground">Template Name</Label>
                                    <Input
                                        id="template-name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Spring 2026 Schedule"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="template-desc" className="text-foreground">Description (Optional)</Label>
                                    <Input
                                        id="template-desc"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief description of this template"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleCreate}>Create</Button>
                                    <Button variant="outline" onClick={() => setIsCreating(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {templates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No templates created yet</p>
                        <p className="text-sm">Create a template to reuse timetable structures</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {templates.map((template) => (
                            <Card key={template.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-foreground">{template.name}</h3>
                                            {template.description && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {template.description}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Created: {new Date(template.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleApply(template.id)}
                                                title="Apply to week"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setEditingId(template.id)}
                                                title="Edit template"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(template.id)}
                                                title="Delete template"
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
