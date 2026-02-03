'use server';

import connectDB from '@/lib/mongodb';
import { SettingsModel } from '@/lib/models';
import { getSession } from '@/lib/auth';

// Get settings
export async function getSettingsAction() {
    try {
        const session = await getSession();
        if (!session || (session.role !== 'admin' && session.role !== 'dev')) {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();
        
        let settings = await SettingsModel.findOne({ id: 'global' });
        
        if (!settings) {
            // Create new settings
            console.log('No settings found, creating new...');
            settings = await SettingsModel.create({
                id: 'global',
                entryTimeStart: '09:00',
                entryTimeEnd: '10:00',
                exitTimeStart: '17:00',
                exitTimeEnd: '18:00',
                otpValidityMinutes: 5,
                securityEmail: '',
                securityNotificationsEnabled: true
            });
        }
        
        // Check if this is an old document without securityEmail
        const settingsObj: any = settings.toObject();
        const hasSecurityEmail = 'securityEmail' in settingsObj;
        
        console.log('=== GET SETTINGS ===');
        console.log('Settings has securityEmail field?', hasSecurityEmail);
        console.log('Raw settings object:', settingsObj);
        
        if (!hasSecurityEmail) {
            // Migrate old document - add securityEmail field
            console.log('Migrating old settings document...');
            settings.securityEmail = '';
            await settings.save();
            console.log('Migration complete, securityEmail added');
        }
        
        // Return clean settings object
        const { _id, __v, attendanceEnabled, qrRefreshInterval, disputeGracePeriod, emailFrom, emailPassword, ...cleanSettings } = settingsObj;
        
        // Ensure securityEmail is always present
        const finalSettings = {
            id: settings.id,
            entryTimeStart: settings.entryTimeStart,
            entryTimeEnd: settings.entryTimeEnd,
            exitTimeStart: settings.exitTimeStart,
            exitTimeEnd: settings.exitTimeEnd,
            otpValidityMinutes: settings.otpValidityMinutes,
            securityEmail: settings.securityEmail || '',
            securityNotificationsEnabled: settings.securityNotificationsEnabled !== false
        };
        
        console.log('Final settings being returned:', finalSettings);
        return { success: true, settings: finalSettings };
    } catch (error) {
        console.error('Error fetching settings:', error);
        return { success: false, error: 'Failed to fetch settings' };
    }
}

// Update settings
export async function updateSettingsAction(updates: {
    entryTimeStart?: string;
    entryTimeEnd?: string;
    exitTimeStart?: string;
    exitTimeEnd?: string;
    otpValidityMinutes?: number;
    securityEmail?: string;
    securityNotificationsEnabled?: boolean;
}) {
    try {
        const session = await getSession();
        if (!session || (session.role !== 'admin' && session.role !== 'dev')) {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();
        
        console.log('=== UPDATE SETTINGS ACTION ===');
        console.log('Full updates object:', JSON.stringify(updates, null, 2));
        console.log('securityEmail value:', updates.securityEmail);
        console.log('securityEmail type:', typeof updates.securityEmail);
        
        // Build update data explicitly
        const updateData: any = {
            id: 'global'
        };
        
        if (updates.entryTimeStart !== undefined) updateData.entryTimeStart = updates.entryTimeStart;
        if (updates.entryTimeEnd !== undefined) updateData.entryTimeEnd = updates.entryTimeEnd;
        if (updates.exitTimeStart !== undefined) updateData.exitTimeStart = updates.exitTimeStart;
        if (updates.exitTimeEnd !== undefined) updateData.exitTimeEnd = updates.exitTimeEnd;
        if (updates.otpValidityMinutes !== undefined) updateData.otpValidityMinutes = updates.otpValidityMinutes;
        if (updates.securityEmail !== undefined) updateData.securityEmail = updates.securityEmail;
        if (updates.securityNotificationsEnabled !== undefined) updateData.securityNotificationsEnabled = updates.securityNotificationsEnabled;
        
        console.log('Update data being sent to DB:', JSON.stringify(updateData, null, 2));
        
        const settings = await SettingsModel.findOneAndUpdate(
            { id: 'global' },
            { $set: updateData },
            { upsert: true, new: true, runValidators: true }
        );
        
        console.log('Settings after update:', settings?.toObject());
        console.log('Security email in DB after save:', settings?.securityEmail);
        
        return { success: true, message: 'Settings updated successfully' };
    } catch (error) {
        console.error('Error updating settings:', error);
        return { success: false, error: 'Failed to update settings' };
    }
}
