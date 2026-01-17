export async function compressAndUploadImage(base64Image: string): Promise<string | null> {
    try {
        // Convert base64 to blob
        const base64Data = base64Image.split(',')[1];
        const byteString = atob(base64Data);
        const mimeString = base64Image.split(',')[0].split(':')[1].split(';')[0];
        
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });

        // Compress image using canvas
        const compressed = await compressImage(blob);
        
        // Return base64 string (for now, we'll store locally)
        return compressed;
    } catch (error) {
        console.error('Error compressing image:', error);
        return null;
    }
}

async function compressImage(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        
        img.onload = () => {
            URL.revokeObjectURL(url);
            
            // Create canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            // Calculate new dimensions (max 300x300 to keep size small)
            let width = img.width;
            let height = img.height;
            const maxSize = 300;

            if (width > height && width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
            } else if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
            }

            canvas.width = width;
            canvas.height = height;

            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);
            
            // Try different quality levels to achieve 5-10KB
            let quality = 0.5;
            let result = canvas.toDataURL('image/jpeg', quality);
            
            // Estimate size (base64 is ~1.37x actual size)
            let estimatedSize = (result.length * 3) / 4 / 1024; // KB
            
            // Adjust quality to target 5-10KB
            if (estimatedSize > 10) {
                quality = 0.3;
                result = canvas.toDataURL('image/jpeg', quality);
            } else if (estimatedSize < 5) {
                quality = 0.6;
                result = canvas.toDataURL('image/jpeg', quality);
            }

            resolve(result);
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };
        
        img.src = url;
    });
}
