"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("Seeding database...");
    const usersData = [
        {
            name: "Admin User",
            email: "admin@library.com",
            passwordHash: await bcryptjs_1.default.hash("admin123", 10),
            role: client_1.Role.ADMIN
        },
        {
            name: "Alice",
            email: "alice@example.com",
            passwordHash: await bcryptjs_1.default.hash("pass123", 10),
            role: client_1.Role.USER
        },
        {
            name: "Bob",
            email: "bob@example.com",
            passwordHash: await bcryptjs_1.default.hash("pass123", 10),
            role: client_1.Role.USER
        },
        {
            name: "Charlie",
            email: "charlie@example.com",
            passwordHash: await bcryptjs_1.default.hash("pass123", 10),
            role: client_1.Role.USER
        },
    ];
    const booksData = [
        { title: "1984", author: "George Orwell" },
        { title: "To Kill a Mockingbird", author: "Harper Lee" },
        { title: "The Great Gatsby", author: "F. Scott Fitzgerald" },
        { title: "Pride and Prejudice", author: "Jane Austen" },
        { title: "The Catcher in the Rye", author: "J.D. Salinger" },
    ];
    for (const user of usersData) {
        await prisma.user.create({ data: user });
    }
    for (const book of booksData) {
        await prisma.book.create({
            data: book,
        });
    }
    console.log("Seeding finished ✅");
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
