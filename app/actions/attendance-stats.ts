'use server';

import { getAttendance, getSessions, getTimeSlots } from '@/lib/db';
import { formatDate, getWeekDates } from '@/lib/utils/calendar';

// Get attendance for a specific date
export async function getAttendanceForDateAction(studentId: string, date: string) {
    try {
        const attendance = await getAttendance();
        const sessions = await getSessions();
        
        const dateAttendance = attendance.filter(a => {
            const session = sessions.find(s => s.id === a.sessionId);
            if (!session) return false;
            
            const sessionDate = formatDate(new Date(session.startTime));
            return a.studentId === studentId && sessionDate === date;
        });
        
        const result = {
            date,
            present: 0,
            total: 0,
            classes: [] as any[]
        };
        
        for (const att of dateAttendance) {
            const session = sessions.find(s => s.id === att.sessionId);
            if (session) {
                result.total++;
                if (att.status === 'present') {
                    result.present++;
                }
                result.classes.push({
                    subject: session.subject,
                    status: att.status
                });
            }
        }
        
        return result;
    } catch (error) {
        console.error('Error fetching attendance for date:', error);
        return { date, present: 0, total: 0, classes: [] };
    }
}

// Get weekly attendance for calendar
export async function getWeeklyAttendanceAction(studentId: string, weekStart: Date) {
    try {
        const weekDates = getWeekDates(weekStart);
        const results = [];
        
        for (const date of weekDates) {
            const dateStr = formatDate(date);
            const dayData = await getAttendanceForDateAction(studentId, dateStr);
            results.push(dayData);
        }
        
        return results;
    } catch (error) {
        console.error('Error fetching weekly attendance:', error);
        return [];
    }
}

// Get attendance statistics
export async function getAttendanceStatsAction(studentId: string) {
    try {
        const attendance = await getAttendance();
        const studentAttendance = attendance.filter(a => a.studentId === studentId);
        
        const sessions = await getSessions();
        
        // Overall stats
        const total = studentAttendance.length;
        const present = studentAttendance.filter(a => a.status === 'present').length;
        const overallPercentage = total > 0 ? (present / total) * 100 : 0;
        
        // Class-wise stats
        const classMap = new Map<string, { present: number; total: number }>();
        
        for (const att of studentAttendance) {
            const session = sessions.find(s => s.id === att.sessionId);
            if (!session || !session.subject) continue;
            
            const subject = session.subject;
            if (!classMap.has(subject)) {
                classMap.set(subject, { present: 0, total: 0 });
            }
            
            const stats = classMap.get(subject)!;
            stats.total++;
            if (att.status === 'present') {
                stats.present++;
            }
        }
        
        const classStats = Array.from(classMap.entries()).map(([subject, stats]) => ({
            subject,
            present: stats.present,
            total: stats.total,
            percentage: (stats.present / stats.total) * 100
        }));
        
        return {
            overallPercentage,
            classStats,
            totalClasses: total,
            totalPresent: present
        };
    } catch (error) {
        console.error('Error fetching attendance stats:', error);
        return {
            overallPercentage: 0,
            classStats: [],
            totalClasses: 0,
            totalPresent: 0
        };
    }
}

// Predict attendance
export async function predictAttendanceAction(studentId: string) {
    try {
        const stats = await getAttendanceStatsAction(studentId);
        const upcomingClasses = 5; // Assume 5 classes next week
        
        const currentTotal = stats.totalClasses;
        const currentPresent = stats.totalPresent;
        
        // If present for all upcoming classes
        const ifPresentPercentage = ((currentPresent + upcomingClasses) / (currentTotal + upcomingClasses)) * 100;
        
        // If absent for all upcoming classes
        const ifAbsentPercentage = (currentPresent / (currentTotal + upcomingClasses)) * 100;
        
        const requiredAttendance = 75;
        const classesNeeded = Math.max(0, Math.ceil((requiredAttendance * currentTotal - 100 * currentPresent) / (100 - requiredAttendance)));
        
        return {
            currentPercentage: stats.overallPercentage,
            requiredAttendance,
            predictions: [
                {
                    scenario: 'if_present' as const,
                    nextWeekPercentage: ifPresentPercentage,
                    recommendation: ifPresentPercentage >= requiredAttendance 
                        ? 'Keep attending regularly to maintain your good attendance!'
                        : 'You\'re improving! Keep it up.'
                },
                {
                    scenario: 'if_absent' as const,
                    nextWeekPercentage: ifAbsentPercentage,
                    classesNeeded,
                    recommendation: ifAbsentPercentage < requiredAttendance
                        ? `Your attendance will drop below ${requiredAttendance}%. Attend classes regularly.`
                        : 'Missing classes will hurt your attendance.'
                }
            ]
        };
    } catch (error) {
        console.error('Error predicting attendance:', error);
        return {
            currentPercentage: 0,
            requiredAttendance: 75,
            predictions: []
        };
    }
}
