'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download } from 'lucide-react';
import { exportAttendanceToExcelAction } from '@/app/actions/export';
import { toast } from 'sonner';

interface ExportAttendanceDialogProps {
    employeeId?: string;
    employeeName?: string;
}

export default function ExportAttendanceDialog({ employeeId, employeeName }: ExportAttendanceDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [exportType, setExportType] = useState<'all' | 'dateRange' | 'weekly' | 'monthly'>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [format, setFormat] = useState<'excel' | 'csv' | 'pdf'>('excel');

    async function handleExport() {
        setLoading(true);
        
        let start = '';
        let end = '';
        
        if (exportType === 'dateRange') {
            if (!startDate || !endDate) {
                toast.error('Please select both start and end dates');
                setLoading(false);
                return;
            }
            start = startDate;
            end = endDate;
        } else if (exportType === 'weekly') {
            // Get current week
            const today = new Date();
            const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
            const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
            start = firstDay.toISOString().split('T')[0];
            end = lastDay.toISOString().split('T')[0];
        } else if (exportType === 'monthly') {
            // Get current month
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            start = firstDay.toISOString().split('T')[0];
            end = lastDay.toISOString().split('T')[0];
        }

        const result = await exportAttendanceToExcelAction(employeeId, start, end, format);
        setLoading(false);

        if (result.success && result.data) {
            const blob = new Blob([new Uint8Array(result.data)], { 
                type: format === 'excel' 
                    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    : format === 'csv'
                    ? 'text/csv'
                    : 'application/pdf'
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const fileName = employeeName 
                ? `${employeeName.replace(/\s+/g, '_')}_attendance_${new Date().toISOString().split('T')[0]}`
                : `attendance_${new Date().toISOString().split('T')[0]}`;
            a.download = `${fileName}.${format === 'excel' ? 'xlsx' : format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Attendance exported successfully');
            setOpen(false);
        } else {
            toast.error(result.error || 'Failed to export attendance');
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        Export Attendance {employeeName && `- ${employeeName}`}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Export Type */}
                    <div className="space-y-2">
                        <Label>Export Type</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant={exportType === 'all' ? 'default' : 'outline'}
                                onClick={() => setExportType('all')}
                                size="sm"
                            >
                                All Records
                            </Button>
                            <Button
                                variant={exportType === 'weekly' ? 'default' : 'outline'}
                                onClick={() => setExportType('weekly')}
                                size="sm"
                            >
                                This Week
                            </Button>
                            <Button
                                variant={exportType === 'monthly' ? 'default' : 'outline'}
                                onClick={() => setExportType('monthly')}
                                size="sm"
                            >
                                This Month
                            </Button>
                            <Button
                                variant={exportType === 'dateRange' ? 'default' : 'outline'}
                                onClick={() => setExportType('dateRange')}
                                size="sm"
                            >
                                Date Range
                            </Button>
                        </div>
                    </div>

                    {/* Date Range Inputs */}
                    {exportType === 'dateRange' && (
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label>From Date</Label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>To Date</Label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Format Selection */}
                    <div className="space-y-2">
                        <Label>Format</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                variant={format === 'excel' ? 'default' : 'outline'}
                                onClick={() => setFormat('excel')}
                                size="sm"
                            >
                                Excel
                            </Button>
                            <Button
                                variant={format === 'csv' ? 'default' : 'outline'}
                                onClick={() => setFormat('csv')}
                                size="sm"
                            >
                                CSV
                            </Button>
                            <Button
                                variant={format === 'pdf' ? 'default' : 'outline'}
                                onClick={() => setFormat('pdf')}
                                size="sm"
                            >
                                PDF
                            </Button>
                        </div>
                    </div>

                    {/* Export Button */}
                    <Button
                        onClick={handleExport}
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? 'Exporting...' : 'Export Attendance'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
