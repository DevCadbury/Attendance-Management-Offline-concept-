'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, MapPin, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';

interface StaffComparisonViewProps {
    employees: any[];
    attendance: any[];
}

export default function StaffComparisonView({ employees, attendance }: StaffComparisonViewProps) {
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

    function previousMonth() {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    }

    function nextMonth() {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    }

    // Filter attendance for current month
    const monthlyAttendance = attendance.filter(a => {
        const date = new Date(a.date + 'T00:00:00');
        return date.getFullYear() === currentMonth.getFullYear() &&
               date.getMonth() === currentMonth.getMonth();
    });

    // Calculate stats by employee
    const employeeStats = employees.map(emp => {
        const empAttendance = monthlyAttendance.filter(a => a.employeeId === emp.id);
        const present = empAttendance.filter(a => a.status === 'present').length;
        const absent = empAttendance.filter(a => a.status === 'absent').length;
        const incomplete = empAttendance.filter(a => a.status === 'incomplete').length;
        const total = empAttendance.length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        
        // Calculate work hours and overtime
        let totalHours = 0;
        let overtimeHours = 0;
        
        empAttendance.forEach(record => {
            if (record.entryTime && record.exitTime) {
                const entry = new Date(record.entryTime);
                const exit = new Date(record.exitTime);
                const hours = (exit.getTime() - entry.getTime()) / (1000 * 60 * 60);
                totalHours += hours;
                
                // Overtime is anything over 8 hours per day
                if (hours > 8) {
                    overtimeHours += hours - 8;
                }
            }
        });
        
        // Get all entry locations
        const locations = empAttendance
            .filter(a => a.entryLocation && a.entryLocation.latitude && a.entryLocation.longitude)
            .map(a => a.entryLocation);
        
        return {
            id: emp.id,
            name: emp.name,
            email: emp.email,
            present,
            absent,
            incomplete,
            total,
            percentage,
            totalHours: totalHours.toFixed(1),
            overtimeHours: overtimeHours.toFixed(1),
            locations
        };
    }).filter(stat => stat.total > 0).sort((a, b) => b.percentage - a.percentage);

    const selectedEmpStats = selectedEmployee 
        ? employeeStats.find(s => s.id === selectedEmployee)
        : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Staff Attendance Comparison</h1>
                <Link href="/admin">
                    <Button variant="outline">Back to Dashboard</Button>
                </Link>
            </div>

            {/* Month Navigation */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <Button onClick={previousMonth} variant="ghost" size="sm">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                            <h2 className="font-semibold text-xl">
                                {currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                            </h2>
                        </div>
                        <Button onClick={nextMonth} variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Overview */}
            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Staff</p>
                            <p className="text-2xl font-bold">{employeeStats.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div>
                            <p className="text-sm text-muted-foreground">Avg Attendance</p>
                            <p className="text-2xl font-bold">
                                {employeeStats.length > 0 
                                    ? Math.round(employeeStats.reduce((sum, s) => sum + s.percentage, 0) / employeeStats.length)
                                    : 0}%
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Records</p>
                            <p className="text-2xl font-bold">{monthlyAttendance.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Overtime Hours</p>
                            <p className="text-2xl font-bold">
                                {employeeStats.reduce((sum, s) => sum + parseFloat(s.overtimeHours), 0).toFixed(1)}h
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Staff Comparison List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Staff Attendance Ranking
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto">
                            {employeeStats.map((stat, index) => (
                                <div 
                                    key={stat.id} 
                                    className={`space-y-2 p-3 rounded-lg border cursor-pointer transition-all ${
                                        selectedEmployee === stat.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                                    }`}
                                    onClick={() => setSelectedEmployee(stat.id)}
                                >
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">#{index + 1}</Badge>
                                            <Link 
                                                href={`/admin/employee/${stat.id}`} 
                                                className="font-medium hover:underline hover:text-primary"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {stat.name}
                                            </Link>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-green-600 font-semibold">{stat.present}P</span>
                                            <span className="text-red-600 font-semibold">{stat.absent}A</span>
                                            <span className="text-orange-600 font-semibold">{stat.incomplete}I</span>
                                            <span className="font-bold text-primary">{stat.percentage}%</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
                                        <div 
                                            className="absolute top-0 left-0 h-full bg-green-600 transition-all"
                                            style={{ width: `${stat.percentage}%` }}
                                        />
                                        <div 
                                            className="absolute top-0 right-0 h-full bg-red-600 transition-all"
                                            style={{ width: `${stat.total > 0 ? (stat.absent / stat.total) * 100 : 0}%` }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white mix-blend-difference">
                                            {stat.total} days • {stat.totalHours}h work • {stat.overtimeHours}h OT
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Employee Details & Map */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            {selectedEmpStats ? `${selectedEmpStats.name} - Details` : 'Select an Employee'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedEmpStats ? (
                            <div className="space-y-4">
                                {/* Employee Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                                        <p className="text-xs text-green-700 dark:text-green-400">Present Days</p>
                                        <p className="text-2xl font-bold text-green-600">{selectedEmpStats.present}</p>
                                    </div>
                                    <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                                        <p className="text-xs text-red-700 dark:text-red-400">Absent Days</p>
                                        <p className="text-2xl font-bold text-red-600">{selectedEmpStats.absent}</p>
                                    </div>
                                    <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                                        <p className="text-xs text-orange-700 dark:text-orange-400">Incomplete</p>
                                        <p className="text-2xl font-bold text-orange-600">{selectedEmpStats.incomplete}</p>
                                    </div>
                                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                        <p className="text-xs text-blue-700 dark:text-blue-400">Attendance %</p>
                                        <p className="text-2xl font-bold text-blue-600">{selectedEmpStats.percentage}%</p>
                                    </div>
                                </div>

                                {/* Work Hours */}
                                <div className="p-4 border rounded-lg space-y-2">
                                    <h3 className="font-semibold">Work Hours Summary</h3>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Total Work Hours:</span>
                                        <span className="font-semibold">{selectedEmpStats.totalHours}h</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Overtime Hours:</span>
                                        <span className="font-semibold text-amber-600">{selectedEmpStats.overtimeHours}h</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Avg Hours/Day:</span>
                                        <span className="font-semibold">
                                            {selectedEmpStats.total > 0 
                                                ? (parseFloat(selectedEmpStats.totalHours) / selectedEmpStats.total).toFixed(1)
                                                : 0}h
                                        </span>
                                    </div>
                                </div>

                                {/* Location Coordinates */}
                                <div className="p-4 border rounded-lg space-y-2">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Entry Locations ({selectedEmpStats.locations.length} records)
                                    </h3>
                                    <div className="max-h-48 overflow-y-auto space-y-2">
                                        {selectedEmpStats.locations.length > 0 ? (
                                            selectedEmpStats.locations.map((loc: any, idx: number) => (
                                                <div key={idx} className="text-sm p-2 bg-muted rounded">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-mono text-xs">
                                                            {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                                                        </span>
                                                        <a 
                                                            href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline text-xs"
                                                        >
                                                            View Map
                                                        </a>
                                                    </div>
                                                    {loc.address && (
                                                        <p className="text-xs text-muted-foreground mt-1">{loc.address}</p>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No location data available</p>
                                        )}
                                    </div>
                                </div>

                                {/* Google Maps Iframe */}
                                {selectedEmpStats.locations.length > 0 && (
                                    <div className="border rounded-lg overflow-hidden">
                                        <iframe
                                            width="100%"
                                            height="300"
                                            style={{ border: 0 }}
                                            loading="lazy"
                                            src={`https://www.google.com/maps?q=${selectedEmpStats.locations[0].latitude},${selectedEmpStats.locations[0].longitude}&z=15&output=embed`}
                                        ></iframe>
                                    </div>
                                )}

                                {/* Action Button */}
                                <Link href={`/admin/employee/${selectedEmpStats.id}`} className="block">
                                    <Button className="w-full">
                                        View Full Profile
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>Click on any employee to view their location data and statistics</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
