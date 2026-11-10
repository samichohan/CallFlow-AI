const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.customer.findMany().then(r => {
  console.log("Total customers in DB:", r.length);
  r.forEach(c => console.log(`- ${c.id}: ${c.fullName} (${c.phone})`));
}).finally(() => p.$disconnect());

