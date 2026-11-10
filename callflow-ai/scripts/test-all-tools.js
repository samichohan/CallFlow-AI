// scripts/test-all-tools.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Load tools logic using PrismaClient directly
async function formatOrderForVoice(order) {
  const items = order.items?.map((i) => ({
    product: i.productName,
    quantity: i.quantity,
    price: `$${i.unitPrice.toFixed(2)}`,
    total: `$${i.totalPrice.toFixed(2)}`,
  })) || [];

  return {
    order_id: order.id,
    order_number: order.orderNumber,
    status: order.status,
    payment_status: order.paymentStatus,
    total_amount: `$${order.totalAmount.toFixed(2)}`,
    currency: order.currency,
    delivery_method: order.deliveryMethod,
    carrier: order.carrier || null,
    tracking_number: order.trackingNumber || null,
    estimated_delivery: order.estimatedDelivery ? new Date(order.estimatedDelivery).toDateString() : null,
    delivered_at: order.deliveredAt ? new Date(order.deliveredAt).toDateString() : null,
    order_date: new Date(order.createdAt).toDateString(),
    items,
    item_count: items.length,
  };
}

async function executeGetLatestOrder(args) {
  const phone = (args.phone || args.phone_number || "").trim();
  const customerId = (args.customer_id || "").trim();

  let customer = null;
  if (customerId) customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer && phone) customer = await prisma.customer.findUnique({ where: { phone } });

  if (!customer) {
    return { success: true, found: false, message: `No customer found with phone ${phone}` };
  }

  const latestOrder = await prisma.order.findFirst({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  if (!latestOrder) {
    return { success: true, found: false, customer_id: customer.id, customer_name: customer.fullName, message: "No orders on record" };
  }

  const formatted = await formatOrderForVoice(latestOrder);
  return {
    success: true,
    found: true,
    customer_id: customer.id,
    customer_name: customer.fullName,
    ...formatted,
    message: `Latest order for ${customer.fullName}: Order ${latestOrder.orderNumber}, Status: ${latestOrder.status}, Total: $${latestOrder.totalAmount.toFixed(2)}`,
  };
}

async function executeLookupOrder(args) {
  const orderNumber = (args.order_number || "").trim();
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true, customer: true },
  });
  if (!order) return { success: true, found: false, message: "Not found" };
  const formatted = await formatOrderForVoice(order);
  return { success: true, found: true, ...formatted, customer_name: order.customer?.fullName };
}

async function executeGetCustomerOrders(args) {
  const phone = (args.phone || "").trim();
  const customer = await prisma.customer.findUnique({ where: { phone } });
  if (!customer) return { success: true, found: false, message: "Customer not found" };

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const formattedOrders = await Promise.all(orders.map(formatOrderForVoice));
  return {
    success: true,
    found: true,
    customer_id: customer.id,
    customer_name: customer.fullName,
    order_count: orders.length,
    orders: formattedOrders,
  };
}

async function executeCreateOrder(args) {
  const phone = (args.phone || "").trim();
  const productName = (args.product_name || "").trim();
  const quantity = parseInt(args.quantity || "1", 10);
  const unitPrice = parseFloat(args.unit_price || "0");

  const customer = await prisma.customer.findUnique({ where: { phone } });
  if (!customer) return { success: false, message: "Customer not found" };

  const count = await prisma.order.count();
  const orderNumber = `ORD-${(2000 + count + 1).toString().padStart(4, "0")}`;
  const totalAmount = unitPrice * quantity;

  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      orderNumber,
      status: "pending",
      paymentStatus: "unpaid",
      totalAmount,
      deliveryMethod: "express",
      items: {
        create: [{
          productName,
          quantity,
          unitPrice,
          totalPrice: totalAmount,
        }],
      },
    },
    include: { items: true },
  });

  return {
    success: true,
    order_id: order.id,
    order_number: order.orderNumber,
    customer_name: customer.fullName,
    total_amount: `$${order.totalAmount.toFixed(2)}`,
    status: order.status,
  };
}

async function runTests() {
  console.log("=================================================");
  console.log("   CALLFLOW AI — DIRECT DB ORDER TOOLS TEST     ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, name, detail) {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`);
      if (detail) console.error("   Detail:", detail);
      failed++;
    }
  }

  // 1. Test get_latest_order by PHONE (Alice Johnson)
  console.log("\n--- 1. get_latest_order by Phone (+12025550101) ---");
  const res1 = await executeGetLatestOrder({ phone: "+12025550101" });
  assert(res1.success && res1.found, "get_latest_order found order for Alice");
  assert(res1.order_number === "ORD-1001", `Order number is ORD-1001 (got ${res1.order_number})`);
  assert(res1.status === "shipped", `Status is shipped (got ${res1.status})`);
  assert(res1.items.length === 2, `Alice order has 2 items`);

  // 2. Test lookup_order by order_number
  console.log("\n--- 2. lookup_order (ORD-1002) ---");
  const res2 = await executeLookupOrder({ order_number: "ORD-1002" });
  assert(res2.success && res2.found, "lookup_order found ORD-1002");
  assert(res2.status === "processing", "ORD-1002 status is processing");
  assert(res2.customer_name === "Bob Martinez", "Customer is Bob Martinez");

  // 3. Test get_customer_orders
  console.log("\n--- 3. get_customer_orders (+12025550101) ---");
  const res3 = await executeGetCustomerOrders({ phone: "+12025550101" });
  assert(res3.success && res3.order_count >= 2, `Alice has multiple orders (got ${res3.order_count})`);

  // 4. Test create_order
  console.log("\n--- 4. create_order for Bob (+12025550102) ---");
  const res4 = await executeCreateOrder({
    phone: "+12025550102",
    product_name: "Noise Cancelling Earbuds",
    quantity: 1,
    unit_price: 149.99,
  });
  assert(res4.success, "create_order success");
  assert(Boolean(res4.order_number), `Generated order: ${res4.order_number}`);

  // 5. Test get_latest_order for Bob returns the new order!
  console.log("\n--- 5. get_latest_order after create_order ---");
  const res5 = await executeGetLatestOrder({ phone: "+12025550102" });
  assert(res5.order_number === res4.order_number, `Bob's latest is now the new order ${res5.order_number}`);

  // Cleanup test order
  await prisma.orderItem.deleteMany({ where: { orderId: res4.order_id } });
  await prisma.order.deleteMany({ where: { id: res4.order_id } });

  console.log("\n=================================================");
  console.log(`   TOTAL TESTS: ${passed + failed}`);
  console.log(`   PASSED:      ${passed}`);
  console.log(`   FAILED:      ${failed}`);
  console.log("=================================================\n");

  await prisma.$disconnect();
}

runTests().catch(e => { console.error(e); process.exit(1); });
