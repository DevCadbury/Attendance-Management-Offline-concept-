'use server';

import connectDB from '@/lib/mongodb';
import { AttendanceModel } from '@/lib/models';
import { getSession } from '@/lib/auth';
import * as XLSX from 'xlsx';

// Export attendance to Excel
export async function exportAttendanceToExcelAction(filters?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    status?: 'incomplete' | 'present' | 'absent';
}) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();
        
        const query: any = {};
        
        if (filters?.employeeId) {
            query.employeeId = filters.employeeId;
        }
        
        if (filters?.startDate || filters?.endDate) {
            query.date = {};
            if (filters.startDate) query.date.$gte = filters.startDate;
            if (filters.endDate) query.date.$lte = filters.endDate;
        }
        
        if (filters?.status) {
            query.status = filters.status;
        }
        
        const attendance = await AttendanceModel.find(query)
            .sort({ date: -1, employeeName: 1 })
            .lean();
        
        // Prepare data for Excel
        const excelData = attendance.map(record => {
            const entryTime = record.entryTime 
                ? new Date(record.entryTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                : 'Not Marked';
            
            const exitTime = record.exitTime
                ? new Date(record.exitTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                : 'Not Marked';
            
            return {
                'Employee ID': record.employeeId,
                'Employee Name': record.employeeName,
                'Date': record.date,
                'Entry Time': entryTime,
                'Exit Time': exitTime,
                'Status': record.status.toUpperCase(),
                'Entry Location': record.entryLocation 
                    ? `${record.entryLocation.latitude}, ${record.entryLocation.longitude}${record.entryLocation.address ? ' - ' + record.entryLocation.address : ''}`
                    : 'Not Recorded',
                'Exit Location': record.exitLocation
                    ? `${record.exitLocation.latitude}, ${record.exitLocation.longitude}${record.exitLocation.address ? ' - ' + record.exitLocation.address : ''}`
                    : 'Not Recorded',
                'Marked By': record.markedBy,
                'Edited By': record.editedBy || 'N/A',
                'Edited At': record.editedAt 
                    ? new Date(record.editedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                    : 'N/A'
            };
        });
        
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        
        // Auto-size columns
        const colWidths = [
            { wch: 15 }, // Employee ID
            { wch: 25 }, // Employee Name
            { wch: 12 }, // Date
            { wch: 20 }, // Entry Time
            { wch: 20 }, // Exit Time
            { wch: 12 }, // Status
            { wch: 40 }, // Entry Location
            { wch: 40 }, // Exit Location
            { wch: 12 }, // Marked By
            { wch: 15 }, // Edited By
            { wch: 20 }  // Edited At
        ];
        ws['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
        
        // Generate buffer
        const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        // Convert to base64 for download
        const base64 = excelBuffer.toString('base64');
        
        return { 
            success: true, 
            data: base64,
            filename: `attendance_${filters?.startDate || 'all'}_to_${filters?.endDate || 'all'}.xlsx`
        };
    } catch (error) {
        console.error('Error exporting attendance:', error);
        return { success: false, error: 'Failed to export attendance' };
    }
}

// Get attendance summary
export async function getAttendanceSummaryAction(filters?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
}) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();
        
        const query: any = {};
        
        if (filters?.employeeId) {
            query.employeeId = filters.employeeId;
        }
        
        if (filters?.startDate || filters?.endDate) {
            query.date = {};
            if (filters.startDate) query.date.$gte = filters.startDate;
            if (filters.endDate) query.date.$lte = filters.endDate;
        }
        
        const attendance = await AttendanceModel.find(query).lean();
        
        // Calculate summary
        const summary = {
            total: attendance.length,
            present: attendance.filter(a => a.status === 'present').length,
            incomplete: attendance.filter(a => a.status === 'incomplete').length,
            absent: attendance.filter(a => a.status === 'absent').length
        };
        
        return { success: true, summary };
    } catch (error) {
        console.error('Error fetching attendance summary:', error);
        return { success: false, error: 'Failed to fetch summary' };
    }
}
