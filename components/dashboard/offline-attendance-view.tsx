'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WifiOff, Wifi, CheckCircle, Upload, Download, Trash2, Calendar, Users } from 'lucide-react';
import { toast } from 'sonner';

interface OfflineAttendanceRecord {
    id: string;
    subject: string;
    sectionId: string;
    slotId?: string;
    date: string;
    time: string;
    students: {
        id: string;
        name: string;
        status: 'present' | 'absent';
    }[];
    synced: boolean;
}

interface OfflineAttendanceViewProps {
    teacherId: string;
    teacherName: string;
}

export function OfflineAttendanceView({ teacherId, teacherName }: OfflineAttendanceViewProps) {
    const [isOnline, setIsOnline] = useState(true);
    const [records, setRecords] = useState<OfflineAttendanceRecord[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    
    // Form state
    const [subject, setSubject] = useState('');
    const [studentNames, setStudentNames] = useState('');
    
    useEffect(() => {
        // Check online status
        setIsOnline(navigator.onLine);
        
        const handleOnline = () => {
            setIsOnline(true);
            toast.success('Back online! You can now sync your data.');
        };
        
        const handleOffline = () => {
            setIsOnline(false);
            toast.warning('You are offline. Attendance will be saved locally.');
        };
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        // Load saved records from localStorage
        loadSavedRecords();
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const loadSavedRecords = () => {
        try {
            const saved = localStorage.getItem('offline-attendance-records');
            if (saved) {
                setRecords(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Error loading saved records:', error);
        }
    };

    const saveRecordsToLocalStorage = (updatedRecords: OfflineAttendanceRecord[]) => {
        try {
            localStorage.setItem('offline-attendance-records', JSON.stringify(updatedRecords));
            setRecords(updatedRecords);
        } catch (error) {
            console.error('Error saving records:', error);
            toast.error('Failed to save records locally');
        }
    };

    const handleCreateRecord = () => {
        if (!subject || !studentNames) {
            toast.error('Please enter subject and student names');
            return;
        }

        const students = studentNames.split('\n')
            .filter(name => name.trim())
            .map(name => ({
                id: Math.random().toString(36).substring(7),
                name: name.trim(),
                status: 'absent' as const
            }));

        if (students.length === 0) {
            toast.error('Please enter at least one student name');
            return;
        }

        const newRecord: OfflineAttendanceRecord = {
            id: Math.random().toString(36).substring(7),
            subject: subject.trim(),
            sectionId: 'offline-' + Date.now(),
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            students,
            synced: false
        };

        const updatedRecords = [...records, newRecord];
        saveRecordsToLocalStorage(updatedRecords);
        
        setSubject('');
        setStudentNames('');
        setShowCreateForm(false);
        toast.success('Attendance record created locally');
    };

    const toggleStudentStatus = (recordId: string, studentId: string) => {
        const updatedRecords = records.map(record => {
            if (record.id === recordId) {
                return {
                    ...record,
                    students: record.students.map(student => 
                        student.id === studentId 
                            ? { ...student, status: (student.status === 'present' ? 'absent' : 'present') as 'present' | 'absent' }
                            : student
                    )
                };
            }
            return record;
        });
        
        saveRecordsToLocalStorage(updatedRecords);
    };

    const syncRecord = async (recordId: string) => {
        if (!isOnline) {
            toast.error('Cannot sync while offline');
            return;
        }

        const record = records.find(r => r.id === recordId);
        if (!record) return;

        try {
            // TODO: Implement actual sync with server
            // For now, just mark as synced
            const updatedRecords = records.map(r => 
                r.id === recordId ? { ...r, synced: true } : r
            );
            saveRecordsToLocalStorage(updatedRecords);
            toast.success('Record synced successfully');
        } catch (error) {
            toast.error('Failed to sync record');
        }
    };

    const syncAllRecords = async () => {
        if (!isOnline) {
            toast.error('Cannot sync while offline');
            return;
        }

        const unsyncedRecords = records.filter(r => !r.synced);
        if (unsyncedRecords.length === 0) {
            toast.info('No records to sync');
            return;
        }

        try {
            // TODO: Implement actual sync with server
            const updatedRecords = records.map(r => ({ ...r, synced: true }));
            saveRecordsToLocalStorage(updatedRecords);
            toast.success(`${unsyncedRecords.length} record(s) synced successfully`);
        } catch (error) {
            toast.error('Failed to sync records');
        }
    };

    const deleteRecord = (recordId: string) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        
        const updatedRecords = records.filter(r => r.id !== recordId);
        saveRecordsToLocalStorage(updatedRecords);
        toast.success('Record deleted');
    };

    const exportToJSON = () => {
        const dataStr = JSON.stringify(records, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `offline-attendance-${Date.now()}.json`;
        link.click();
        toast.success('Data exported successfully');
    };

    const importFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target?.result as string);
                if (Array.isArray(imported)) {
                    saveRecordsToLocalStorage([...records, ...imported]);
                    toast.success(`Imported ${imported.length} record(s)`);
                }
            } catch (error) {
                toast.error('Invalid JSON file');
            }
        };
        reader.readAsText(file);
    };

    const unsyncedCount = records.filter(r => !r.synced).length;

    return (
        <div className="space-y-6">
            {/* Status Bar */}
            <Card className={`border-2 ${isOnline ? 'border-green-500' : 'border-orange-500'}`}>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {isOnline ? (
                                <Wifi className="h-6 w-6 text-green-600" />
                            ) : (
                                <WifiOff className="h-6 w-6 text-orange-600" />
                            )}
                            <div>
                                <p className="font-semibold text-foreground">
                                    {isOnline ? 'Online' : 'Offline Mode'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {isOnline 
                                        ? 'Data will sync automatically' 
                                        : 'Attendance saved locally, sync when back online'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {unsyncedCount > 0 && (
                                <Button
                                    onClick={syncAllRecords}
                                    disabled={!isOnline}
                                    variant="default"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Sync All ({unsyncedCount})
                                </Button>
                            )}
                            <Button onClick={exportToJSON} variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                            <label htmlFor="import-json" className="cursor-pointer">
                                <Button variant="outline" type="button" onClick={() => document.getElementById('import-json')?.click()}>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Import
                                </Button>
                                <input
                                    id="import-json"
                                    type="file"
                                    accept=".json"
                                    onChange={importFromJSON}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Create New Record */}
            {!showCreateForm ? (
                <Button onClick={() => setShowCreateForm(true)} size="lg" className="w-full">
                    <Calendar className="h-5 w-5 mr-2" />
                    Create New Attendance Record
                </Button>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>New Attendance Record</CardTitle>
                        <CardDescription>Create a new attendance session offline</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="subject">Subject/Class</Label>
                            <Input
                                id="subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="e.g., Mathematics, Physics"
                            />
                        </div>
                        <div>
                            <Label htmlFor="students">Student Names (one per line)</Label>
                            <textarea
                                id="students"
                                value={studentNames}
                                onChange={(e) => setStudentNames(e.target.value)}
                                placeholder="John Doe&#10;Jane Smith&#10;Bob Johnson"
                                className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleCreateRecord} className="flex-1">
                                Create Record
                            </Button>
                            <Button onClick={() => setShowCreateForm(false)} variant="outline" className="flex-1">
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Records List */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Attendance Records ({records.length})</h3>
                
                {records.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <WifiOff className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No offline attendance records</p>
                            <p className="text-sm mt-1">Create a record to mark attendance offline</p>
                        </CardContent>
                    </Card>
                ) : (
                    records.map((record) => {
                        const presentCount = record.students.filter(s => s.status === 'present').length;
                        
                        return (
                            <Card key={record.id} className={record.synced ? 'border-green-200' : 'border-orange-200'}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-foreground">{record.subject}</CardTitle>
                                            <CardDescription>
                                                {record.date} at {record.time} • {presentCount}/{record.students.length} present
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            {!record.synced && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => syncRecord(record.id)}
                                                    disabled={!isOnline}
                                                    variant="outline"
                                                >
                                                    <Upload className="h-4 w-4 mr-1" />
                                                    Sync
                                                </Button>
                                            )}
                                            {record.synced && (
                                                <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Synced
                                                </span>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => deleteRecord(record.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {record.students.map((student) => (
                                            <div
                                                key={student.id}
                                                className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                                    student.status === 'present'
                                                        ? 'bg-green-500/10 border-green-500/30'
                                                        : 'bg-red-500/10 border-red-500/30'
                                                }`}
                                                onClick={() => toggleStudentStatus(record.id, student.id)}
                                            >
                                                <span className="font-medium text-foreground">{student.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-semibold ${
                                                        student.status === 'present' ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                        {student.status === 'present' ? 'Present' : 'Absent'}
                                                    </span>
                                                    {student.status === 'present' && (
                                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
