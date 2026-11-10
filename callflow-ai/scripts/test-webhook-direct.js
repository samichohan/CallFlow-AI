// scripts/test-webhook-direct.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Replicates the exact create_customer tool execution logic from lib/tools.ts
async function createCustomerTool(args) {
  const fullName = (args.full_name || args.fullName || args.name || "").trim();
  const phone = (args.phone || args.phone_number || args.phoneNumber || "").trim();
  const email = (args.email || "").trim() || null;
  const company = (args.company || "").trim() || null;

  if (!fullName) return { success: false, message: "Customer full name is required." };
  if (!phone) return { success: false, message: "Customer phone number is required." };

  try {
    const existing = await prisma.customer.findUnique({
      where: { phone },
      include: { _count: { select: { calls: true, supportTickets: true } } },
    });

    if (existing) {
      return {
        success: true,
        already_exists: true,
        customer_id: existing.id,
        full_name: existing.fullName,
        phone: existing.phone,
        email: existing.email,
        company: existing.company,
        status: existing.status,
        message: `Customer '${existing.fullName}' is already registered with phone number ${existing.phone} (Customer ID: ${existing.id}).`,
      };
    }

    const created = await prisma.customer.create({
      data: { fullName, phone, email, company, status: "active" },
    });

    return {
      success: true,
      already_exists: false,
      customer_id: created.id,
      full_name: created.fullName,
      phone: created.phone,
      email: created.email,
      company: created.company,
      status: created.status,
      created_at: created.createdAt.toISOString(),
      message: `Customer '${created.fullName}' successfully registered in CRM database with Customer ID ${created.id}.`,
    };
  } catch (error) {
    return { success: false, message: `Database error: ${error.message}` };
  }
}

async function run() {
  console.log("==================================================");
  console.log("🧪 TESTING VAPI 'create_customer' DATABASE TOOL");
  console.log("==================================================\n");

  const testPhone = "03001234567";
  const testName = "Sami";
  const testEmail = "sami@callflow.test";

  // 1. Clean prior record
  await prisma.supportTicket.deleteMany({ where: { customer: { phone: testPhone } } });
  await prisma.customer.deleteMany({ where: { phone: testPhone } });

  // 2. Call tool with arguments as passed by Vapi
  console.log(`1. Simulating Vapi tool call: create_customer(full_name: '${testName}', phone: '${testPhone}', email: '${testEmail}')...`);
  const result1 = await createCustomerTool({
    full_name: testName,
    phone: testPhone,
    email: testEmail,
    company: "Sami Logistics",
  });

  console.log("   Tool Output:", result1.message);
  console.log("   Customer ID returned:", result1.customer_id);

  if (!result1.success || result1.already_exists || !result1.customer_id) {
    throw new Error("create_customer failed!");
  }

  // 3. Verify in database
  const inDb = await prisma.customer.findUnique({ where: { phone: testPhone } });
  if (!inDb || inDb.id !== result1.customer_id) {
    throw new Error("Customer was not found in Prisma database!");
  }
  console.log(`   ✅ DIRECT DATABASE VERIFICATION: Customer '${inDb.fullName}' is in SQLite dev.db with ID '${inDb.id}'!`);

  // 4. Test duplicate prevention with same phone
  console.log(`\n2. Testing duplicate registration for '${testPhone}'...`);
  const result2 = await createCustomerTool({
    full_name: "Sami Second Call",
    phone: testPhone,
  });

  console.log("   Tool Output:", result2.message);
  if (!result2.already_exists || result2.customer_id !== inDb.id) {
    throw new Error("Duplicate check failed!");
  }
  console.log("   ✅ DUPLICATE VERIFICATION: Successfully detected existing customer without creating duplicate row!");

  // 5. Test missing phone / name validation
  console.log("\n3. Testing argument validation (empty phone/name)...");
  const fail1 = await createCustomerTool({ full_name: "No Phone" });
  const fail2 = await createCustomerTool({ phone: "123456" });
  if (fail1.success || fail2.success) {
    throw new Error("Validation check failed!");
  }
  console.log("   ✅ VALIDATION VERIFICATION: Missing fields rejected with proper error message!");

  console.log("\n==================================================");
  console.log("🎉 ALL REAL DATABASE INSERTIONS & CHECKS VERIFIED!");
  console.log("==================================================");
}

run()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

