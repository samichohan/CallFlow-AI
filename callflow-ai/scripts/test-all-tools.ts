// scripts/test-all-tools.ts
// Comprehensive automated test suite for all 11 CallFlow AI tools.
import {
  executeCreateCustomer,
  executeLookupCustomer,
  executeUpdateCustomer,
  executeGetLatestOrder,
  executeLookupOrder,
  executeGetCustomerOrders,
  executeCreateOrder,
  executeUpdateOrder,
  executeCreateSupportTicket,
  executeLookupSupportTicket,
  executeUpdateSupportTicket,
  executeTool,
} from "../lib/tools";
import { prisma } from "../lib/prisma";

async function runTests() {
  console.log("=================================================");
  console.log("   CALLFLOW AI — COMPLETE TOOLS VERIFICATION    ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string, detail?: any) {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`);
      if (detail) console.error("   Detail:", detail);
      failed++;
    }
  }

  try {
    // 1. TEST: get_latest_order with phone only (NO order ID provided!)
    console.log("\n--- 1. Testing get_latest_order (Customer: Alice Johnson, +12025550101) ---");
    const latestRes = await executeGetLatestOrder({ phone: "+12025550101" });
    assert(latestRes.success === true, "get_latest_order success");
    assert(latestRes.found === true, "get_latest_order found order");
    assert(latestRes.order_number === "ORD-1001", `Latest order number is ORD-1001 (got ${latestRes.order_number})`);
    assert(latestRes.status === "shipped", `Order status is shipped (got ${latestRes.status})`);
    assert(Boolean(latestRes.total_amount), `Total amount present: ${latestRes.total_amount}`);
    assert(Boolean(latestRes.carrier), `Carrier present: ${latestRes.carrier}`);
    assert(Array.isArray(latestRes.items) && latestRes.items.length > 0, `Items array has products`);

    // 2. TEST: lookup_order by order number
    console.log("\n--- 2. Testing lookup_order by order_number (ORD-1002) ---");
    const lookupRes = await executeLookupOrder({ order_number: "ORD-1002" });
    assert(lookupRes.success === true, "lookup_order success");
    assert(lookupRes.found === true, "lookup_order found ORD-1002");
    assert(lookupRes.status === "processing", "ORD-1002 status is processing");

    // 3. TEST: get_customer_orders (order history by phone)
    console.log("\n--- 3. Testing get_customer_orders by phone (+12025550101) ---");
    const historyRes = await executeGetCustomerOrders({ phone: "+12025550101" });
    assert(historyRes.success === true, "get_customer_orders success");
    assert(historyRes.order_count >= 2, `Alice has at least 2 orders (got ${historyRes.order_count})`);

    // 4. TEST: lookup_customer (returns customer + orders + tickets)
    console.log("\n--- 4. Testing lookup_customer (+12025550101) ---");
    const custRes = await executeLookupCustomer({ phone: "+12025550101" });
    assert(custRes.success === true, "lookup_customer success");
    assert(custRes.found === true, "lookup_customer found Alice");
    assert(custRes.full_name === "Alice Johnson", "Customer name is Alice Johnson");
    assert(custRes.order_count >= 2, `Customer order count reported: ${custRes.order_count}`);

    // 5. TEST: create_order for a customer
    console.log("\n--- 5. Testing create_order ---");
    const newOrderRes = await executeCreateOrder({
      phone: "+12025550102",
      product_name: "Noise-Cancelling Earbuds",
      quantity: 1,
      unit_price: 129.99,
      delivery_method: "express",
    });
    assert(newOrderRes.success === true, "create_order success");
    assert(Boolean(newOrderRes.order_number), `Generated order number: ${newOrderRes.order_number}`);
    assert(newOrderRes.total_amount === "$129.99", `Total amount matches: ${newOrderRes.total_amount}`);

    // Verify order was genuinely saved in DB
    const savedOrder = await prisma.order.findUnique({
      where: { orderNumber: newOrderRes.order_number },
      include: { items: true },
    });
    assert(Boolean(savedOrder), "Order genuinely exists in Prisma database");
    assert(savedOrder?.items[0].productName === "Noise-Cancelling Earbuds", "OrderItem saved in DB");

    // 6. TEST: update_order
    console.log("\n--- 6. Testing update_order ---");
    const updateOrderRes = await executeUpdateOrder({
      order_number: newOrderRes.order_number,
      status: "confirmed",
      payment_status: "paid",
      carrier: "UPS",
      tracking_number: "UPS-TEST-7788",
    });
    assert(updateOrderRes.success === true, "update_order success");
    assert(updateOrderRes.status === "confirmed", "Order status updated to confirmed");
    assert(updateOrderRes.payment_status === "paid", "Payment status updated to paid");

    // 7. TEST: get_latest_order now returns the newly created order for Bob Martinez!
    console.log("\n--- 7. Testing get_latest_order for Bob (+12025550102) ---");
    const bobsLatest = await executeGetLatestOrder({ phone: "+12025550102" });
    assert(bobsLatest.success === true && bobsLatest.found === true, "Bob's latest order found");
    assert(bobsLatest.order_number === newOrderRes.order_number, `Bob's latest is the newly created order: ${bobsLatest.order_number}`);

    // 8. TEST: create_customer (fresh)
    console.log("\n--- 8. Testing create_customer (fresh) ---");
    const testPhone = `+92300${Date.now().toString().slice(-7)}`;
    const createCustRes = await executeCreateCustomer({
      full_name: "Test Customer OrderFlow",
      phone: testPhone,
      email: "orderflow@test.com",
    });
    assert(createCustRes.success === true, "create_customer success");
    assert(createCustRes.already_exists === false, "Not marked as already existing");
    assert(Boolean(createCustRes.customer_id), `Customer ID generated: ${createCustRes.customer_id}`);

    // 9. TEST: create_customer duplicate detection
    console.log("\n--- 9. Testing create_customer duplicate phone handling ---");
    const dupCustRes = await executeCreateCustomer({
      full_name: "Test Customer OrderFlow Duplicate",
      phone: testPhone,
    });
    assert(dupCustRes.success === true, "create_customer handles duplicate gracefully");
    assert(dupCustRes.already_exists === true, "Correctly identifies duplicate phone number");
    assert(dupCustRes.customer_id === createCustRes.customer_id, "Returns the original customer ID");

    // 10. TEST: create_support_ticket
    console.log("\n--- 10. Testing create_support_ticket ---");
    const ticketRes = await executeCreateSupportTicket({
      phone: testPhone,
      subject: "Test complaint about delivery",
      description: "Package was delayed by 2 days.",
      priority: "high",
      category: "shipping",
    });
    assert(ticketRes.success === true, "create_support_ticket success");
    assert(Boolean(ticketRes.ticket_id), `Ticket ID generated: ${ticketRes.ticket_id}`);

    // 11. TEST: lookup_support_ticket
    console.log("\n--- 11. Testing lookup_support_ticket ---");
    const lookupTicketRes = await executeLookupSupportTicket({ ticket_id: ticketRes.ticket_id });
    assert(lookupTicketRes.success === true, "lookup_support_ticket success");
    assert(lookupTicketRes.found === true, "Ticket found");
    assert(lookupTicketRes.subject === "Test complaint about delivery", "Ticket subject matches");

    // 12. TEST: update_support_ticket
    console.log("\n--- 12. Testing update_support_ticket ---");
    const updateTicketRes = await executeUpdateSupportTicket({
      ticket_id: ticketRes.ticket_id,
      status: "resolved",
    });
    assert(updateTicketRes.success === true, "update_support_ticket success");
    assert(updateTicketRes.status === "resolved", "Ticket status is resolved");

    // 13. TEST: master dispatcher executeTool
    console.log("\n--- 13. Testing master dispatcher executeTool ---");
    const dispatchLatest = await executeTool("get_latest_order", { phone: "+12025550101" });
    assert(dispatchLatest.success === true, "Dispatcher correctly routes get_latest_order");

    const dispatchLookup = await executeTool("lookup_order", { order_number: "ORD-1001" });
    assert(dispatchLookup.success === true, "Dispatcher correctly routes lookup_order");

    const dispatchHistory = await executeTool("get_customer_orders", { phone: "+12025550101" });
    assert(dispatchHistory.success === true, "Dispatcher correctly routes get_customer_orders");

    // Cleanup test customer & their ticket & orders
    await prisma.supportTicket.deleteMany({ where: { id: ticketRes.ticket_id } });
    await prisma.orderItem.deleteMany({ where: { orderId: savedOrder?.id } });
    await prisma.order.deleteMany({ where: { id: savedOrder?.id } });
    await prisma.customer.deleteMany({ where: { phone: testPhone } });

    console.log("\n=================================================");
    console.log(`   TOTAL TESTS: ${passed + failed}`);
    console.log(`   PASSED:      ${passed}`);
    console.log(`   FAILED:      ${failed}`);
    console.log("=================================================\n");

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("Test execution threw error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
