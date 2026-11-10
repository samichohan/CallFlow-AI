// scripts/test-tools.ts
// Comprehensive integration test for the 4 CRM backend tools directly against Prisma.

import {
  executeCreateCustomer,
  executeLookupCustomer,
  executeUpdateCustomer,
  executeCreateSupportTicket,
} from "../lib/tools";
import { prisma } from "../lib/prisma";

async function runTests() {
  console.log("=================================================");
  console.log("🚀 STARTING CALLFLOW AI CRM TOOLS VERIFICATION");
  console.log("=================================================\n");

  const testPhone = "03001234567";

  // Clean up any previous test customer with this phone
  await prisma.supportTicket.deleteMany({
    where: { customer: { phone: testPhone } },
  });
  await prisma.customer.deleteMany({
    where: { phone: testPhone },
  });

  // ─────────────────────────────────────────────
  // TEST 1: create_customer (New customer)
  // ─────────────────────────────────────────────
  console.log("TEST 1: Calling create_customer for 'Sami' (03001234567)...");
  const createResult = await executeCreateCustomer({
    full_name: "Sami",
    phone: testPhone,
    email: "sami@example.com",
    company: "Sami Enterprises",
  });

  console.log("Result:", createResult);
  if (!createResult.success || createResult.already_exists) {
    throw new Error("TEST 1 FAILED: Expected new customer creation to succeed.");
  }
  const createdCustomerId = createResult.customer_id;
  console.log(`✅ TEST 1 PASSED: Customer created with ID: ${createdCustomerId}\n`);

  // Verify in Prisma database directly
  const dbCustomer = await prisma.customer.findUnique({
    where: { phone: testPhone },
  });
  if (!dbCustomer || dbCustomer.fullName !== "Sami") {
    throw new Error("TEST 1 VERIFICATION FAILED: Record not found in Prisma database.");
  }
  console.log("✅ Verified directly in Prisma DB:", dbCustomer.fullName, dbCustomer.phone, "\n");

  // ─────────────────────────────────────────────
  // TEST 2: Duplicate customer handling
  // ─────────────────────────────────────────────
  console.log("TEST 2: Testing duplicate customer prevention for same phone...");
  const dupResult = await executeCreateCustomer({
    full_name: "Sami Khan",
    phone: testPhone,
    email: "sami2@example.com",
  });

  console.log("Result:", dupResult);
  if (!dupResult.success || !dupResult.already_exists || dupResult.customer_id !== createdCustomerId) {
    throw new Error("TEST 2 FAILED: Expected duplicate check to return existing customer.");
  }
  console.log("✅ TEST 2 PASSED: Duplicate successfully detected without creating duplicate row!\n");

  // ─────────────────────────────────────────────
  // TEST 3: lookup_customer
  // ─────────────────────────────────────────────
  console.log("TEST 3: Calling lookup_customer with phone '03001234567'...");
  const lookupResult = await executeLookupCustomer({
    phone: testPhone,
  });

  console.log("Result:", lookupResult);
  if (!lookupResult.success || !lookupResult.found || lookupResult.customer_id !== createdCustomerId) {
    throw new Error("TEST 3 FAILED: Expected customer lookup to find Sami.");
  }
  console.log("✅ TEST 3 PASSED: Customer record accurately retrieved from DB!\n");

  // ─────────────────────────────────────────────
  // TEST 4: update_customer
  // ─────────────────────────────────────────────
  console.log("TEST 4: Calling update_customer to update company to 'Sami Global Logistics'...");
  const updateResult = await executeUpdateCustomer({
    phone: testPhone,
    company: "Sami Global Logistics",
  });

  console.log("Result:", updateResult);
  if (!updateResult.success || updateResult.company !== "Sami Global Logistics") {
    throw new Error("TEST 4 FAILED: Expected company update to persist.");
  }

  const updatedDb = await prisma.customer.findUnique({ where: { id: createdCustomerId } });
  if (updatedDb?.company !== "Sami Global Logistics") {
    throw new Error("TEST 4 VERIFICATION FAILED: DB does not reflect updated company.");
  }
  console.log("✅ TEST 4 PASSED: Customer updated in database!\n");

  // ─────────────────────────────────────────────
  // TEST 5: create_support_ticket
  // ─────────────────────────────────────────────
  console.log("TEST 5: Calling create_support_ticket for Sami's complaint...");
  const ticketResult = await executeCreateSupportTicket({
    customer_id: createdCustomerId,
    subject: "Package arrived with damaged seal",
    description: "Customer reported shipment arrived with torn outer box and broken seal. Requests replacement.",
    priority: "high",
    category: "shipping",
  });

  console.log("Result:", ticketResult);
  if (!ticketResult.success || !ticketResult.ticket_id) {
    throw new Error("TEST 5 FAILED: Expected ticket creation to succeed.");
  }

  const dbTicket = await prisma.supportTicket.findUnique({
    where: { id: ticketResult.ticket_id },
    include: { customer: true },
  });

  if (!dbTicket || dbTicket.customerId !== createdCustomerId) {
    throw new Error("TEST 5 VERIFICATION FAILED: Ticket not properly linked in Prisma database.");
  }
  console.log(`✅ TEST 5 PASSED: Ticket #${dbTicket.id} saved in database and linked to ${dbTicket.customer?.fullName}!\n`);

  // ─────────────────────────────────────────────
  // TEST 6: Validation & Error Handling
  // ─────────────────────────────────────────────
  console.log("TEST 6: Testing validation failures (empty name/phone, empty ticket)...");
  const failCust = await executeCreateCustomer({ full_name: "", phone: "" });
  if (failCust.success) throw new Error("Expected validation failure for empty customer.");

  const failTicket = await executeCreateSupportTicket({ subject: "", description: "" });
  if (failTicket.success) throw new Error("Expected validation failure for empty ticket.");

  console.log("✅ TEST 6 PASSED: Invalid requests properly rejected with clear error messages!\n");

  console.log("=================================================");
  console.log("🎉 ALL 6 BACKEND CRM TOOL TESTS PASSED 100%!");
  console.log("=================================================");
}

runTests()
  .catch((e) => {
    console.error("❌ TEST SUITE FAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

