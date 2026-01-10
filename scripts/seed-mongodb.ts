import connectDB from '../lib/mongodb';
import { UserModel } from '../lib/models';
import { hash } from 'bcryptjs';

async function seedDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await connectDB();
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await UserModel.findOne({ email: 'admin@example.com' });
        
        if (!existingAdmin) {
            console.log('Creating default admin user...');
            const hashedPassword = await hash('admin123', 10);
            
            await UserModel.create({
                id: 'admin-' + Date.now(),
                name: 'Admin User',
                email: 'admin@example.com',
                password: hashedPassword,
                role: 'admin',
                locked: false,
                createdAt: Date.now()
            });
            
            console.log('✅ Admin user created successfully');
            console.log('Email: admin@example.com');
            console.log('Password: admin123');
        } else {
            console.log('Admin user already exists');
        }

        // Create sample teacher
        const existingTeacher = await UserModel.findOne({ email: 'teacher@example.com' });
        if (!existingTeacher) {
            console.log('Creating sample teacher...');
            const hashedPassword = await hash('teacher123', 10);
            
            await UserModel.create({
                id: 'teacher-' + Date.now(),
                name: 'John Teacher',
                email: 'teacher@example.com',
                password: hashedPassword,
                role: 'teacher',
                locked: false,
                createdAt: Date.now()
            });
            
            console.log('✅ Teacher user created');
            console.log('Email: teacher@example.com');
            console.log('Password: teacher123');
        }

        // Create sample student
        const existingStudent = await UserModel.findOne({ email: 'student@example.com' });
        if (!existingStudent) {
            console.log('Creating sample student...');
            const hashedPassword = await hash('student123', 10);
            
            await UserModel.create({
                id: 'student-' + Date.now(),
                name: 'Jane Student',
                email: 'student@example.com',
                password: hashedPassword,
                role: 'student',
                locked: false,
                createdAt: Date.now()
            });
            
            console.log('✅ Student user created');
            console.log('Email: student@example.com');
            console.log('Password: student123');
        }

        console.log('\n✨ Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
