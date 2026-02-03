'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { getSettingsAction, updateSettingsAction } from '@/app/actions/settings';
import { sendTestEmailAction } from '@/app/actions/email';

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [entryTimeStart, setEntryTimeStart] = useState('09:00');
    const [entryTimeEnd, setEntryTimeEnd] = useState('10:00');
    const [exitTimeStart, setExitTimeStart] = useState('17:00');
    const [exitTimeEnd, setExitTimeEnd] = useState('18:00');
    const [otpValidity, setOtpValidity] = useState(5);
    const [securityEmail, setSecurityEmail] = useState('');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            setLoading(true);
            const result = await getSettingsAction();
            console.log('=== LOAD SETTINGS RESPONSE ===', result);
            
            if (result.success && result.settings) {
                setEntryTimeStart(result.settings.entryTimeStart || '09:00');
                setEntryTimeEnd(result.settings.entryTimeEnd || '10:00');
                setExitTimeStart(result.settings.exitTimeStart || '17:00');
                setExitTimeEnd(result.settings.exitTimeEnd || '18:00');
                setOtpValidity(result.settings.otpValidityMinutes || 5);
                const email = result.settings.securityEmail || '';
                console.log('Security email from server:', email);
                setSecurityEmail(email);
                setNotificationsEnabled(result.settings.securityNotificationsEnabled !== false);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveSettings() {
        if (!securityEmail || !securityEmail.includes('@')) {
            toast.error('Please enter a valid security email address');
            return;
        }

        console.log('=== SAVING SETTINGS ===');
        console.log('Security email to save:', securityEmail);

        try {
            setLoading(true);
            const result = await updateSettingsAction({
                entryTimeStart,
                entryTimeEnd,
                exitTimeStart,
                exitTimeEnd,
                otpValidityMinutes: otpValidity,
                securityEmail: securityEmail,
                securityNotificationsEnabled: notificationsEnabled
            });

            console.log('=== SAVE RESULT ===', result);

            if (result.success) {
                toast.success('Settings updated successfully');
                // Wait a bit before reloading
                await new Promise(resolve => setTimeout(resolve, 500));
                await loadSettings();
            } else {
                toast.error(result.error || 'Failed to update settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setLoading(false);
        }
    }

    async function handleSendTestEmail() {
        const email = prompt('Enter test email address:', 'prince844121@gmail.com');
        if (!email) return;

        setLoading(true);
        const result = await sendTestEmailAction(email);
        setLoading(false);

        if (result.success) {
            toast.success('Test email sent successfully!');
        } else {
            toast.error(result.error || 'Failed to send test email');
        }
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">System Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Configure attendance times, OTP settings, and security email
                </p>
            </div>

            <div className="space-y-6">
                {/* Attendance Times */}
                <Card>
                    <CardHeader>
                        <CardTitle>Attendance Time Windows</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Entry Start Time</Label>
                                <Input
                                    type="time"
                                    value={entryTimeStart}
                                    onChange={(e) => setEntryTimeStart(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Entry End Time</Label>
                                <Input
                                    type="time"
                                    value={entryTimeEnd}
                                    onChange={(e) => setEntryTimeEnd(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Exit Start Time</Label>
                                <Input
                                    type="time"
                                    value={exitTimeStart}
                                    onChange={(e) => setExitTimeStart(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Exit End Time</Label>
                                <Input
                                    type="time"
                                    value={exitTimeEnd}
                                    onChange={(e) => setExitTimeEnd(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* OTP Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>OTP Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>OTP Validity (minutes)</Label>
                            <Input
                                type="number"
                                min="1"
                                max="60"
                                value={otpValidity}
                                onChange={(e) => setOtpValidity(parseInt(e.target.value) || 5)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Security Email */}
                <Card>
                    <CardHeader>
                        <CardTitle>Security Email Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Security Guard Email</Label>
                            <Input
                                type="email"
                                placeholder="security@company.com"
                                value={securityEmail}
                                onChange={(e) => setSecurityEmail(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                All OTPs will be sent to this email. Employees will request OTP codes from the security guard.
                            </p>
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label>Enable Security Notifications</Label>
                                <p className="text-xs text-muted-foreground">
                                    Send email notifications to security guard when employees request/verify OTPs
                                </p>
                            </div>
                            <Switch
                                checked={notificationsEnabled}
                                onCheckedChange={setNotificationsEnabled}
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleSendTestEmail}
                            disabled={loading}
                            className="w-full"
                        >
                            Send Test Email
                        </Button>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <Button
                    onClick={handleSaveSettings}
                    disabled={loading}
                    className="w-full"
                    size="lg"
                >
                    {loading ? 'Saving...' : 'Save All Settings'}
                </Button>
            </div>
        </div>
    );
}
