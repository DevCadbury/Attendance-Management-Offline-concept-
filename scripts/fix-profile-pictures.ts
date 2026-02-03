import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import connectDB from '@/lib/mongodb';
import { UserModel } from '@/lib/models';
import { compressAndUploadImage } from '@/lib/cloudinary';

async function fixProfilePictures() {
    try {
        console.log('Connecting to database...');
        await connectDB();

        console.log('Finding users with base64 profile pictures...');
        const users = await UserModel.find({
            profilePictureUrl: { $regex: '^data:image' }
        });

        console.log(`Found ${users.length} users with base64 profile pictures`);

        for (const user of users) {
            try {
                console.log(`Processing user: ${user.name} (${user.email})`);
                
                if (user.profilePictureUrl && user.profilePictureUrl.startsWith('data:image')) {
                    console.log('Uploading to Cloudinary...');
                    const cloudinaryUrl = await compressAndUploadImage(user.profilePictureUrl);
                    
                    // Only update if upload was successful
                    if (cloudinaryUrl) {
                        console.log('Updating user in database...');
                        await UserModel.updateOne(
                            { _id: user._id },
                            { $set: { profilePictureUrl: cloudinaryUrl } }
                        );
                        
                        console.log(`✓ Successfully updated ${user.name}: ${cloudinaryUrl}`);
                    } else {
                        console.error(`✗ Upload failed for ${user.name}, keeping original base64 data`);
                    }
                }
            } catch (error) {
                console.error(`✗ Failed to update ${user.name}:`, error);
            }
        }

        console.log('\n=== Migration Complete ===');
        console.log(`Total users processed: ${users.length}`);
        
        // Verify results
        const remaining = await UserModel.countDocuments({
            profilePictureUrl: { $regex: '^data:image' }
        });
        console.log(`Remaining base64 images: ${remaining}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

fixProfilePictures();
