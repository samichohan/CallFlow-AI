// scripts/test-vapi-webhook.js
// Tests the actual /api/webhooks/vapi endpoint with real Vapi webhook payloads.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  console.log("==================================================");
  console.log("🧪 TESTING VAPI WEBHOOK ENDPOINT FOR CREATE_CUSTOMER");
  console.log("==================================================\n");

  const testPhone = "03451122334";
  const testName = "Tariq Mahmood";

  // 1. Clean prior test record if any
  await prisma.customer.deleteMany({ where: { phone: testPhone } });

  // 2. Simulate Vapi sending tool-calls payload
  const vapiToolCallPayload = {
    message: {
      type: "tool-calls",
      toolCalls: [
        {
          id: "call_vapi_test_001",
          type: "function",
          function: {
            name: "create_customer",
            arguments: JSON.stringify({
              full_name: testName,
              phone: testPhone,
              email: "tariq@example.com",
              company: "Mahmood Traders",
            }),
          },
        },
      ],
      call: {
        id: "vapi_call_sim_999",
      },
    },
  };

  console.log("1. Sending Vapi tool-calls payload to /api/webhooks/vapi...");
  const res = await fetch("http://localhost:3000/api/webhooks/vapi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vapiToolCallPayload),
  });

  console.log("   Response HTTP Status:", res.status);
  const json = await res.json();
  console.log("   Response JSON:", JSON.stringify(json, null, 2));

  if (!res.ok || !json.results || !json.results[0]) {
    throw new Error("Webhook call failed or returned invalid structure");
  }

  const toolResult = JSON.parse(json.results[0].result);
  console.log("   Parsed Tool Result:", toolResult);

  if (!toolResult.success || !toolResult.customer_id) {
    throw new Error("create_customer tool did not return customer_id");
  }

  // 3. Verify directly in Prisma Database
  const dbRecord = await prisma.customer.findUnique({
    where: { phone: testPhone },
  });

  if (!dbRecord || dbRecord.fullName !== testName) {
    throw new Error("Customer record NOT found in Prisma database!");
  }
  console.log(`   ✅ DIRECT DB CHECK: Found customer in Prisma database! ID: ${dbRecord.id}, Name: ${dbRecord.fullName}`);

  // 4. Verify duplicate detection when called again
  console.log("\n2. Testing duplicate phone number handling...");
  const dupRes = await fetch("http://localhost:3000/api/webhooks/vapi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vapiToolCallPayload),
  });

  const dupJson = await dupRes.json();
  const dupToolResult = JSON.parse(dupJson.results[0].result);
  console.log("   Duplicate Tool Result:", dupToolResult);

  if (!dupToolResult.already_exists || dupToolResult.customer_id !== dbRecord.id) {
    throw new Error("Duplicate customer was not detected!");
  }
  console.log("   ✅ DUPLICATE CHECK: Successfully detected existing customer without duplicating row!");

  // 5. Verify the record is visible via the standard Customers UI API (/api/customers)
  console.log("\n3. Verifying record via Customers UI API (/api/customers)...");
  const uiApiRes = await fetch(`http://localhost:3000/api/customers?search=${testPhone}`);
  const customersList = await uiApiRes.json();
  const matched = customersList.find((c) => c.phone === testPhone);

  if (!matched) {
    throw new Error("Customer does not appear in /api/customers used by the UI!");
  }
  console.log(`   ✅ UI API CHECK: Customer '${matched.fullName}' appears in Customers list (total calls: ${matched._count.calls}, tickets: ${matched._count.supportTickets})`);

  console.log("\n==================================================");
  console.log("🎉 ALL VAPI TOOL WEBHOOK TESTS PASSED 100%!");
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

