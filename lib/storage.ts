import connectDB from './mongodb';
import { UserModel, IUser } from './models';

export interface User {
    id: string;
    username: string;
    password: string;
    role: 'admin' | 'teacher' | 'student';
    name: string;
    email: string;
    locked?: boolean;
    sectionId?: string;
    createdAt?: number;
    updatedAt?: number;
}

export async function getUsers(): Promise<User[]> {
    try {
        await connectDB();
        const users = await UserModel.find({}).lean();
        return users.map(u => ({
            id: u.id,
            username: u.email.split('@')[0],
            password: u.password,
            role: u.role,
            name: u.name,
            email: u.email,
            locked: u.locked,
            sectionId: u.sectionId,
            createdAt: u.createdAt
        }));
    } catch (error) {
        console.error('Error reading users:', error);
        return [];
    }
}

export async function getUser(username: string): Promise<User | undefined> {
    try {
        await connectDB();
        const user = await UserModel.findOne({ 
            $or: [
                { email: username },
                { email: `${username}@example.com` }
            ]
        }).lean();
        
        if (!user) return undefined;
        
        return {
            id: user.id,
            username: user.email.split('@')[0],
            password: user.password,
            role: user.role,
            name: user.name,
            email: user.email,
            locked: user.locked,
            sectionId: user.sectionId,
            createdAt: user.createdAt
        };
    } catch (error) {
        console.error('Error finding user:', error);
        return undefined;
    }
}

export async function getUserById(id: string): Promise<User | undefined> {
    try {
        await connectDB();
        const user = await UserModel.findOne({ id }).lean();
        if (!user) return undefined;
        
        return {
            id: user.id,
            username: user.email.split('@')[0],
            password: user.password,
            role: user.role,
            name: user.name,
            email: user.email,
            locked: user.locked,
            sectionId: user.sectionId,
            createdAt: user.createdAt
        };
    } catch (error) {
        console.error('Error finding user by id:', error);
        return undefined;
    }
}

export async function saveUsers(users: User[]): Promise<void> {
    try {
        await connectDB();
        
        const operations = users.map(user => ({
            updateOne: {
                filter: { id: user.id },
                update: {
                    $set: {
                        id: user.id,
                        name: user.name,
                        email: user.email || `${user.username}@example.com`,
                        password: user.password || '',
                        role: user.role,
                        locked: user.locked || false,
                        sectionId: user.sectionId,
                        createdAt: user.createdAt || Date.now()
                    }
                },
                upsert: true
            }
        }));
        
        if (operations.length > 0) {
            await UserModel.bulkWrite(operations);
        }
    } catch (error) {
        console.error('Error saving users:', error);
        throw error;
    }
}

export async function deleteUser(userId: string): Promise<boolean> {
    try {
        await connectDB();
        const result = await UserModel.deleteOne({ id: userId });
        return result.deletedCount > 0;
    } catch (error) {
        console.error('Error deleting user:', error);
        return false;
    }
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<boolean> {
    try {
        await connectDB();
        
        const updateData: any = {};
        if (updates.name) updateData.name = updates.name;
        if (updates.password) updateData.password = updates.password;
        if (updates.role) updateData.role = updates.role;
        if (updates.locked !== undefined) updateData.locked = updates.locked;
        if (updates.sectionId !== undefined) updateData.sectionId = updates.sectionId;
        if (updates.email) updateData.email = updates.email;
        
        const result = await UserModel.updateOne({ id: userId }, { $set: updateData });
        return result.modifiedCount > 0;
    } catch (error) {
        console.error('Error updating user:', error);
        return false;
    }
}

export async function ensureDataDir() {
    // No longer needed with MongoDB
}
