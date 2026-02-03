import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Server-side image processing and upload to Cloudinary
 */
export async function compressAndUploadImage(base64Image: string): Promise<string | null> {
    try {
        // Validate base64 image
        if (!base64Image || !base64Image.startsWith('data:image')) {
            console.error('Invalid base64 image format');
            return null;
        }
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'profile-pictures',
            transformation: [{ width: 300, height: 300, crop: 'limit' }],
            resource_type: 'auto'
        });
        
        return result.secure_url;
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return null;
    }
}
