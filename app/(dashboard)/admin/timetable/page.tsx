'use client';

import { useState } from 'react';
import { AdminTimetableCalendar } from '@/components/dashboard/admin-timetable-calendar';
import { SectionsManagement } from '@/components/dashboard/sections-management';
import { TimetableManagement } from '@/components/dashboard/timetable-management';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Clock } from 'lucide-react';

export default function TimetablePage() {
    const [activeTab, setActiveTab] = useState<'calendar' | 'sections' | 'slots'>('calendar');

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Timetable Management</h2>
                <p className="text-muted-foreground">Manage schedules, sections, and class slots with drag & drop calendar</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b">
                <Button
                    variant={activeTab === 'calendar' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('calendar')}
                    className="rounded-b-none"
                >
                    <Calendar className="h-4 w-4 mr-2" />
                    Calendar View
                </Button>
                <Button
                    variant={activeTab === 'sections' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('sections')}
                    className="rounded-b-none"
                >
                    <Users className="h-4 w-4 mr-2" />
                    Sections
                </Button>
                <Button
                    variant={activeTab === 'slots' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('slots')}
                    className="rounded-b-none"
                >
                    <Clock className="h-4 w-4 mr-2" />
                    Time Slots
                </Button>
            </div>

            {/* Tab Content */}
            {activeTab === 'calendar' && <AdminTimetableCalendar />}
            {activeTab === 'sections' && <SectionsManagement />}
            {activeTab === 'slots' && <TimetableManagement />}
        </div>
    );
}
