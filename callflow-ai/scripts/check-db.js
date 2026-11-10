const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany({
    where: { phone: "03001234567" },
  });
  console.log("Total matching customers in DB:", customers.length);
  customers.forEach((c) => {
    console.log(`- ID: ${c.id} | Name: ${c.fullName} | Phone: ${c.phone} | Email: ${c.email} | Created: ${c.createdAt}`);
  });
}

main().finally(() => prisma.$disconnect());

