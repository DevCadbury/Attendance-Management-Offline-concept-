'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';

interface PredictionData {
    currentPercentage: number;
    requiredAttendance: number;
    predictions: {
        scenario: 'if_present' | 'if_absent';
        nextWeekPercentage: number;
        classesNeeded?: number;
        recommendation: string;
    }[];
}

export function AttendancePredictions({ currentPercentage, requiredAttendance, predictions }: PredictionData) {
    const presentPrediction = predictions.find(p => p.scenario === 'if_present');
    const absentPrediction = predictions.find(p => p.scenario === 'if_absent');

    const getStatusColor = (percentage: number) => {
        if (percentage >= requiredAttendance) return 'text-green-600 dark:text-green-400';
        if (percentage >= requiredAttendance - 5) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Attendance Predictions
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    See how your attendance will change based on next week
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    {presentPrediction && (
                        <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                                        <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-foreground mb-1">If You Attend All Classes</h3>
                                        <div className={`text-3xl font-bold ${getStatusColor(presentPrediction.nextWeekPercentage)}`}>
                                            {presentPrediction.nextWeekPercentage.toFixed(1)}%
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {presentPrediction.recommendation}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {absentPrediction && (
                        <Card className="border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="bg-red-100 dark:bg-red-900 p-2 rounded-lg">
                                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-foreground mb-1">If You Miss All Classes</h3>
                                        <div className={`text-3xl font-bold ${getStatusColor(absentPrediction.nextWeekPercentage)}`}>
                                            {absentPrediction.nextWeekPercentage.toFixed(1)}%
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {absentPrediction.recommendation}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-foreground mb-2">Smart Recommendation</h4>
                                {currentPercentage >= requiredAttendance ? (
                                    <p className="text-sm text-foreground">
                                        You're doing great! Your current attendance is <span className="font-bold">{currentPercentage.toFixed(1)}%</span>.
                                        Maintain regular attendance to stay above the {requiredAttendance}% requirement.
                                    </p>
                                ) : (
                                    <p className="text-sm text-foreground">
                                        Your current attendance is <span className="font-bold text-red-600">{currentPercentage.toFixed(1)}%</span>,
                                        which is below the {requiredAttendance}% requirement. 
                                        {presentPrediction?.classesNeeded && (
                                            <span className="font-semibold"> You need to attend at least {presentPrediction.classesNeeded} more classes to reach the target.</span>
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    );
}
