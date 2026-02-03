import { UserModel } from '../lib/models';
import connectDB from '../lib/mongodb';
import bcrypt from 'bcryptjs';

async function createAdminUser() {
    try {
        await connectDB();
        
        // Check if admin user already exists
        const existingAdmin = await UserModel.findOne({ email: 'admin@company.com' });
        if (existingAdmin) {
            console.log('Admin user with this email already exists!');
            console.log('Email:', existingAdmin.email);
            return;
        }
        
        const hashedPassword = await bcrypt.hash('admin@123', 10);
        
        const adminUser = {
            id: 'admin-001',
            name: 'System Admin',
            email: 'admin@company.com',
            password: hashedPassword,
            role: 'admin',
            locked: false,
            createdBy: 'dev-001',
            createdAt: Date.now()
        };
        
        await UserModel.create(adminUser);
        
        console.log('✅ Admin user created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email: admin@company.com');
        console.log('🔐 Password: admin@123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚠️  IMPORTANT: Change the password after first login!');
        console.log('🌐 Login at: http://localhost:3000/login');
        
    } catch (error) {
        console.error('Error creating admin user:', error);
        throw error;
    }
}

createAdminUser()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Failed to create admin user:', err);
        process.exit(1);
    });
