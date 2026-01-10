'use client';

import { StudentDisputeView } from '@/components/disputes/student-dispute-view';
import { useState, useEffect } from 'react';

export default function StudentDisputesPage() {
    const [disputes, setDisputes] = useState([]);

    useEffect(() => {
        // Fetch student's disputes
        // Mock data for now
        const mockDisputes = [
            {
                id: '1',
                sessionId: 'session1',
                subject: 'Mathematics',
                date: '2026-01-10',
                reason: 'I was present but marked absent',
                status: 'pending',
                createdAt: Date.now() - 86400000
            }
        ];
        setDisputes(mockDisputes as any);
    }, []);

    const handleCreateDispute = async (sessionId: string, reason: string, evidence?: File) => {
        // API call to create dispute
        console.log('Creating dispute:', sessionId, reason, evidence);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Attendance Disputes</h1>
                <p className="text-muted-foreground">Raise and track disputes for attendance records</p>
            </div>

            <StudentDisputeView 
                disputes={disputes}
                onCreateDispute={handleCreateDispute}
            />
        </div>
    );
}
