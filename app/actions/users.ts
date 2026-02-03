'use server';

import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import { UserModel } from '@/lib/models';
import { getSession } from '@/lib/auth';
import { compressAndUploadImage } from '@/lib/cloudinary';

// Get IST timestamp
function getISTTimestamp(): number {
    return Date.now() + (5.5 * 60 * 60 * 1000);
}

// Create admin (dev only)
export async function createAdminAction(
    name: string, 
    email: string, 
    password: string,
    profilePicture?: string // Base64 or URL
) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'dev') {
            return { success: false, error: 'Unauthorized. Only dev can create admins.' };
        }

        await connectDB();
        
        // Check if user already exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return { success: false, error: 'User with this email already exists' };
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Upload profile picture if provided
        let profilePictureUrl;
        if (profilePicture && profilePicture.startsWith('data:image')) {
            profilePictureUrl = await compressAndUploadImage(profilePicture);
        } else if (profilePicture) {
            profilePictureUrl = profilePicture; // Already a URL
        }
        
        const userId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await UserModel.create({
            id: userId,
            name,
            email,
            password: hashedPassword,
            role: 'admin',
            profilePictureUrl: profilePictureUrl || undefined,
            createdBy: session.id,
            createdAt: getISTTimestamp()
        });
        
        return { success: true, message: 'Admin created successfully' };
    } catch (error) {
        console.error('Error creating admin:', error);
        return { success: false, error: 'Failed to create admin' };
    }
}

// Create employee (admin only)
export async function createEmployeeAction(
    name: string,
    email: string,
    password: string,
    profilePicture?: string // Base64 or URL
) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return { success: false, error: 'Unauthorized. Only admin can create employees.' };
        }

        await connectDB();
        
        // Check if user already exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return { success: false, error: 'User with this email already exists' };
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Upload profile picture if provided
        let profilePictureUrl;
        if (profilePicture && profilePicture.startsWith('data:image')) {
            profilePictureUrl = await compressAndUploadImage(profilePicture);
        } else if (profilePicture) {
            profilePictureUrl = profilePicture; // Already a URL
        }
        
        const userId = `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await UserModel.create({
            id: userId,
            name,
            email,
            password: hashedPassword,
            role: 'employee',
            profilePictureUrl: profilePictureUrl || undefined,
            createdBy: session.id,
            createdAt: getISTTimestamp()
        });
        
        return { success: true, message: 'Employee created successfully' };
    } catch (error) {
        console.error('Error creating employee:', error);
        return { success: false, error: 'Failed to create employee' };
    }
}

// Get all employees (admin only)
export async function getAllEmployeesAction() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();
        
        const employees = await UserModel.find({ role: 'employee' })
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();
        
        // Remove MongoDB-specific fields to prevent serialization errors
        const serializedEmployees = employees.map(emp => {
            const { _id, __v, ...rest } = emp as any;
            return rest;
        });
        
        return { success: true, employees: serializedEmployees };
    } catch (error) {
        console.error('Error fetching employees:', error);
        return { success: false, error: 'Failed to fetch employees' };
    }
}

// Update user profile picture (admin only)
export async function updateProfilePictureAction(userId: string, profilePicture: string) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();
        
        // Upload new profile picture
        let profilePictureUrl;
        if (profilePicture.startsWith('data:image')) {
            profilePictureUrl = await compressAndUploadImage(profilePicture);
            if (!profilePictureUrl) {
                return { success: false, error: 'Failed to upload image' };
            }
        } else {
            profilePictureUrl = profilePicture;
        }
        
        await UserModel.updateOne(
            { id: userId },
            { $set: { profilePictureUrl } }
        );
        
        return { success: true, message: 'Profile picture updated successfully' };
    } catch (error) {
        console.error('Error updating profile picture:', error);
        return { success: false, error: 'Failed to update profile picture' };
    }
}

// Change own password (employees)
export async function changeOwnPasswordAction(currentPassword: string, newPassword: string) {
    try {
        const session = await getSession();
        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();
        
        const user = await UserModel.findOne({ id: session.id });
        if (!user) {
            return { success: false, error: 'User not found' };
        }
        
        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return { success: false, error: 'Current password is incorrect' };
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        user.password = hashedPassword;
        await user.save();
        
        return { success: true, message: 'Password changed successfully' };
    } catch (error) {
        console.error('Error changing password:', error);
        return { success: false, error: 'Failed to change password' };
    }
}

// Update employee details (admin only)
export async function updateEmployeeAction(
    userId: string,
    updates: {
        name?: string;
        email?: string;
        password?: string;
        profilePicture?: string;
    }
) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return { success: false, error: 'Unauthorized. Only admin can update employees.' };
        }

        await connectDB();
        
        const employee = await UserModel.findOne({ id: userId, role: 'employee' });
        if (!employee) {
            return { success: false, error: 'Employee not found' };
        }
        
        // Check if email is being changed and if it's already in use
        if (updates.email && updates.email !== employee.email) {
            const existingUser = await UserModel.findOne({ email: updates.email });
            if (existingUser) {
                return { success: false, error: 'Email is already in use' };
            }
        }
        
        // Update fields
        if (updates.name) employee.name = updates.name;
        if (updates.email) employee.email = updates.email;
        
        // Update password if provided
        if (updates.password) {
            employee.password = await bcrypt.hash(updates.password, 10);
        }
        
        // Update profile picture if provided
        if (updates.profilePicture) {
            let profilePictureUrl;
            if (updates.profilePicture.startsWith('data:image')) {
                profilePictureUrl = await compressAndUploadImage(updates.profilePicture);
            } else {
                profilePictureUrl = updates.profilePicture;
            }
            employee.profilePictureUrl = profilePictureUrl || undefined;
        }
        
        await employee.save();
        
        return { success: true, message: 'Employee updated successfully' };
    } catch (error) {
        console.error('Error updating employee:', error);
        return { success: false, error: 'Failed to update employee' };
    }
}

// Delete employee (admin only)
export async function deleteEmployeeAction(userId: string) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return { success: false, error: 'Unauthorized. Only admin can delete employees.' };
        }

        await connectDB();
        
        const employee = await UserModel.findOne({ id: userId, role: 'employee' });
        if (!employee) {
            return { success: false, error: 'Employee not found' };
        }
        
        await UserModel.deleteOne({ id: userId });
        
        return { success: true, message: 'Employee deleted successfully' };
    } catch (error) {
        console.error('Error deleting employee:', error);
        return { success: false, error: 'Failed to delete employee' };
    }
}

// Get employee by ID (admin only)
export async function getEmployeeByIdAction(userId: string) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return { success: false, error: 'Unauthorized' };
        }

        await connectDB();
        
        const employee = await UserModel.findOne({ id: userId, role: 'employee' })
            .select('-password')
            .lean();
        
        if (!employee) {
            return { success: false, error: 'Employee not found' };
        }
        
        // Remove MongoDB-specific fields to prevent serialization errors
        const { _id, __v, ...serializedEmployee } = employee as any;
        
        return { success: true, employee: serializedEmployee };
    } catch (error) {
        console.error('Error fetching employee:', error);
        return { success: false, error: 'Failed to fetch employee' };
    }
}

// Suspend/Unsuspend employee (admin only)
export async function toggleEmployeeSuspensionAction(userId: string) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return { success: false, error: 'Unauthorized. Only admin can suspend employees.' };
        }

        await connectDB();
        
        const employee = await UserModel.findOne({ id: userId, role: 'employee' });
        if (!employee) {
            return { success: false, error: 'Employee not found' };
        }
        
        employee.locked = !employee.locked;
        await employee.save();
        
        const action = employee.locked ? 'suspended' : 'activated';
        return { success: true, message: `Employee ${action} successfully`, locked: employee.locked };
    } catch (error) {
        console.error('Error toggling employee suspension:', error);
        return { success: false, error: 'Failed to toggle suspension' };
    }
}
