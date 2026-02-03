import mongoose from 'mongoose';
import { SettingsModel } from '../lib/models';
import connectDB from '../lib/mongodb';

async function resetSettings() {
    try {
        console.log('Connecting to MongoDB...');
        await connectDB();
        
        console.log('Deleting old settings...');
        await SettingsModel.deleteMany({});
        
        console.log('Creating new settings with clean schema...');
        const settings = await SettingsModel.create({
            id: 'global',
            entryTimeStart: '09:00',
            entryTimeEnd: '10:00',
            exitTimeStart: '17:00',
            exitTimeEnd: '18:00',
            otpValidityMinutes: 5,
            securityEmail: '',
            securityNotificationsEnabled: true
        });
        
        console.log('Settings created successfully:');
        console.log(settings.toObject());
        
        await mongoose.connection.close();
        console.log('\n✅ Settings reset complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error resetting settings:', error);
        process.exit(1);
    }
}

resetSettings();
