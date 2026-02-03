import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import connectDB from '@/lib/mongodb';
import { UserModel } from '@/lib/models';

async function checkProfilePictures() {
    try {
        console.log('Connecting to database...');
        await connectDB();

        const users = await UserModel.find({}, 'name email role profilePictureUrl');

        console.log('\n=== Profile Pictures Status ===\n');
        for (const user of users) {
            const type = !user.profilePictureUrl 
                ? '❌ NULL' 
                : user.profilePictureUrl.startsWith('data:image')
                ? '📦 Base64'
                : user.profilePictureUrl.startsWith('http')
                ? '☁️ Cloudinary'
                : '❓ Unknown';
            
            const preview = user.profilePictureUrl 
                ? user.profilePictureUrl.substring(0, 50) + '...'
                : 'null';
            
            console.log(`${type} - ${user.name} (${user.email})`);
            console.log(`   ${preview}\n`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkProfilePictures();
