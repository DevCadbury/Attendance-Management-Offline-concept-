import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const users = [
    {
        id: "admin1",
        username: "admin",
        password: "password123",
        role: "admin",
        name: "System Administrator"
    },
    {
        id: "teacher1",
        username: "teacher",
        password: "password123",
        role: "teacher",
        name: "Prof. Dumbledore"
    },
    {
        id: "student1",
        username: "student",
        password: "password123",
        role: "student",
        name: "Harry Potter"
    },
    {
        id: "student2",
        username: "student2",
        password: "password123",
        role: "student",
        name: "Hermione Granger"
    }
];

async function seed() {
    const hashedUsers = await Promise.all(users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return { ...user, password: hashedPassword };
    }));

    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }

    fs.writeFileSync(path.join(dataDir, 'users.json'), JSON.stringify(hashedUsers, null, 2));
    console.log('Users seeded successfully with hashed passwords.');
}

seed();
