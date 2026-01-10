'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface ClassStats {
    subject: string;
    present: number;
    total: number;
    percentage: number;
}

interface AttendanceStatsProps {
    overallPercentage: number;
    classStats: ClassStats[];
    weeklyData?: { week: string; percentage: number }[];
    monthlyData?: { month: string; percentage: number }[];
}

export function AttendanceStats({ overallPercentage, classStats, weeklyData, monthlyData }: AttendanceStatsProps) {
    const getColorClass = (percentage: number) => {
        if (percentage >= 90) return 'text-green-600 dark:text-green-400';
        if (percentage >= 75) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getBarWidth = (percentage: number) => {
        return `${percentage}%`;
    };

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Overall Attendance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center">
                        <div className={`text-5xl font-bold ${getColorClass(overallPercentage)}`}>
                            {overallPercentage.toFixed(1)}%
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            Total attendance percentage
                        </p>
                    </div>
                    <div className="mt-6 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Target (75%)</span>
                            <span className={overallPercentage >= 75 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                {overallPercentage >= 75 ? 'On Track' : 'Below Target'}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                                className={`h-2 rounded-full transition-all ${
                                    overallPercentage >= 90 ? 'bg-green-500' :
                                    overallPercentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: getBarWidth(overallPercentage) }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                        <BarChart className="h-5 w-5" />
                        Class-wise Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 max-h-[200px] overflow-y-auto">
                        {classStats.map((cls) => (
                            <div key={cls.subject}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-foreground truncate">{cls.subject}</span>
                                    <span className={`text-sm font-bold ${getColorClass(cls.percentage)}`}>
                                        {cls.percentage.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full transition-all ${
                                                cls.percentage >= 90 ? 'bg-green-500' :
                                                cls.percentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                            style={{ width: getBarWidth(cls.percentage) }}
                                        />
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {cls.present}/{cls.total}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {weeklyData && weeklyData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Weekly Trends
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {weeklyData.slice(-4).map((week, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground w-20">{week.week}</span>
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div 
                                            className="h-2 rounded-full bg-blue-500 transition-all"
                                            style={{ width: getBarWidth(week.percentage) }}
                                        />
                                    </div>
                                    <span className="text-xs font-medium text-foreground w-12 text-right">
                                        {week.percentage.toFixed(0)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {monthlyData && monthlyData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <TrendingDown className="h-5 w-5" />
                            Monthly Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {monthlyData.slice(-3).map((month, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground w-20">{month.month}</span>
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div 
                                            className="h-2 rounded-full bg-purple-500 transition-all"
                                            style={{ width: getBarWidth(month.percentage) }}
                                        />
                                    </div>
                                    <span className="text-xs font-medium text-foreground w-12 text-right">
                                        {month.percentage.toFixed(0)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
