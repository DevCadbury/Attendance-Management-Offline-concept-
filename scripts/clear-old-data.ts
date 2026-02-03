import connectDB from '../lib/mongodb';
import mongoose from 'mongoose';

async function clearOldData() {
    console.log('🧹 Clearing old QR-based data...');
    
    try {
        await connectDB();
        
        // Clear old attendance records with old schema (studentId, sessionId, etc.)
        const db = mongoose.connection.db;
        
        if (!db) {
            throw new Error('Database connection not established');
        }
        
        // Delete records with old schema fields
        const attendanceResult = await db.collection('attendances').deleteMany({
            $or: [
                { studentId: { $exists: true } },
                { sessionId: { $exists: true } },
                { studentName: { $exists: true } }
            ]
        });
        
        console.log(`✅ Deleted ${attendanceResult.deletedCount} old attendance records`);
        
        // Delete old session records (OTP system doesn't use sessions)
        const sessionsResult = await db.collection('sessions').deleteMany({});
        console.log(`✅ Deleted ${sessionsResult.deletedCount} old session records`);
        
        // Delete old section records if any
        const sectionsResult = await db.collection('sections').deleteMany({});
        console.log(`✅ Deleted ${sectionsResult.deletedCount} old section records`);
        
        // Delete old timetable records
        const timetableResult = await db.collection('timetables').deleteMany({});
        console.log(`✅ Deleted ${timetableResult.deletedCount} old timetable records`);
        
        // Clear old dispute records with old schema
        const disputesResult = await db.collection('disputes').deleteMany({
            $or: [
                { studentId: { $exists: true } },
                { sessionId: { $exists: true } }
            ]
        });
        console.log(`✅ Deleted ${disputesResult.deletedCount} old dispute records`);
        
        console.log('\n✨ Database cleaned successfully!');
        console.log('💡 The OTP-based attendance system is now using a clean slate.');
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing data:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

clearOldData();
