import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const usersData = [
    {
      name: "Admin User",
      email: "admin@library.com",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: Role.ADMIN
    },
    {
      name: "Alice",
      email: "alice@example.com",
      passwordHash: await bcrypt.hash("pass123", 10),
      role: Role.USER
    },
    {
      name: "Bob",
      email: "bob@example.com",
      passwordHash: await bcrypt.hash("pass123", 10),
      role: Role.USER
    },
    {
      name: "Charlie",
      email: "charlie@example.com",
      passwordHash: await bcrypt.hash("pass123", 10),
      role: Role.USER
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
