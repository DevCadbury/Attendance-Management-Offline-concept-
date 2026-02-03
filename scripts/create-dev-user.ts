import { UserModel } from '../lib/models';
import connectDB from '../lib/mongodb';
import bcrypt from 'bcryptjs';

async function createDevUser() {
    try {
        await connectDB();
        
        // Check if dev user already exists
        const existingDev = await UserModel.findOne({ role: 'dev' });
        if (existingDev) {
            console.log('Dev user already exists!');
            console.log('Email:', existingDev.email);
            return;
        }
        
        const hashedPassword = await bcrypt.hash('dev@123', 10);
        
        const devUser = {
            id: 'dev-001',
            name: 'Super Admin',
            email: 'dev@company.com',
            password: hashedPassword,
            role: 'dev',
            locked: false,
            createdAt: Date.now()
        };
        
        await UserModel.create(devUser);
        
        console.log('✅ Dev user created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email: dev@company.com');
        console.log('🔐 Password: dev@123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚠️  IMPORTANT: Change the password after first login!');
        console.log('🌐 Login at: http://localhost:3000/login');
        
    } catch (error) {
        console.error('Error creating dev user:', error);
        throw error;
    }
}

createDevUser()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Failed to create dev user:', err);
        process.exit(1);
    });
