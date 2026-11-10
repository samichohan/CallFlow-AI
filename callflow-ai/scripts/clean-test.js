const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.supportTicket.deleteMany({ where: { customer: { phone: "03001234567" } } });
  await prisma.customer.deleteMany({ where: { phone: "03001234567" } });
  console.log("Cleaned test phone 03001234567 so user can test fresh registration.");
}

main().finally(() => prisma.$disconnect());

