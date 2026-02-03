import { SettingsModel } from '../lib/models';
import connectDB from '../lib/mongodb';

async function seedSettings() {
    try {
        await connectDB();
        
        // Check if settings already exist
        const existingSettings = await SettingsModel.findOne({ id: 'global' });
        if (existingSettings) {
            console.log('Settings already exist!');
            console.log(existingSettings);
            return;
        }
        
        const settings = {
            id: 'global',
            entryTimeStart: '09:00',
            entryTimeEnd: '10:00',
            exitTimeStart: '17:00',
            exitTimeEnd: '18:00',
            otpValidityMinutes: 5,
            securityEmail: process.env.EMAIL_USER || 'security@company.com'
        };
        
        await SettingsModel.create(settings);
        
        console.log('✅ Settings created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⏰ Entry Time: 09:00 - 10:00');
        console.log('⏰ Exit Time: 17:00 - 18:00');
        console.log('⏱️  OTP Validity: 5 minutes');
        console.log('📧 Security Email:', settings.securityEmail);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
    } catch (error) {
        console.error('Error creating settings:', error);
        throw error;
    }
}

seedSettings()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Failed to create settings:', err);
        process.exit(1);
    });
