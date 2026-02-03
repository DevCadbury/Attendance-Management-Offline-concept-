import mongoose from 'mongoose';
import { SettingsModel } from '../lib/models';
import connectDB from '../lib/mongodb';

async function checkSettings() {
    try {
        console.log('Connecting to MongoDB...');
        await connectDB();
        
        console.log('\n=== CHECKING SETTINGS IN DATABASE ===\n');
        
        const settings = await SettingsModel.findOne({ id: 'global' });
        
        if (!settings) {
            console.log('❌ No settings found in database');
        } else {
            console.log('✅ Settings found:');
            console.log(JSON.stringify(settings.toObject(), null, 2));
            console.log('\nSecurity Email:', settings.securityEmail);
        }
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error checking settings:', error);
        process.exit(1);
    }
}

checkSettings();
