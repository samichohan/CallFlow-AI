// prisma/seed.ts
// Run with: npm run db:seed
// Seeds realistic demo data for local development.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Clear existing data ──────────────────────────────────────
  await prisma.webhookEvent.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.call.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.knowledgeBase.deleteMany();

  // ── Customers (sample data) ──────────────────────────────────
  await prisma.customer.createMany({
    data: [
      { fullName: "Alice Johnson",   phone: "+12025550101", email: "alice@example.com",   company: "Acme Corp",    status: "vip"      },
      { fullName: "Bob Martinez",    phone: "+12025550102", email: "bob@example.com",     company: "TechStart",    status: "active"   },
      { fullName: "Carol Williams",  phone: "+12025550103", email: "carol@example.com",   company: "Bright Ideas", status: "active"   },
      { fullName: "David Kim",       phone: "+12025550104", email: "david@example.com",   company: "DevShop",      status: "inactive" },
      { fullName: "Emma Davis",      phone: "+12025550105", email: "emma@example.com",    company: "Creative Co",  status: "active"   },
      { fullName: "Frank Brown",     phone: "+12025550106", email: "frank@example.com",   company: "FastShip",     status: "vip"      },
      { fullName: "Grace Lee",       phone: "+12025550107", email: "grace@example.com",   company: "NextLevel",    status: "active"   },
      { fullName: "Henry Wilson",    phone: "+12025550108", email: "henry@example.com",   company: "Solo Inc",     status: "active"   },
    ],
  });

  const allCustomers = await prisma.customer.findMany({ orderBy: { createdAt: "asc" } });

  // ── Sample Orders (linked to customers) ─────────────────────
  const now = new Date();

  const orderData = [
    {
      customerId: allCustomers[0].id,
      orderNumber: "ORD-1001",
      status: "shipped",
      paymentStatus: "paid",
      totalAmount: 149.99,
      carrier: "FedEx",
      trackingNumber: "FX-987654321",
      deliveryMethod: "express",
      estimatedDelivery: new Date(now.getTime() + 2 * 86400000),
      createdAt: new Date(now.getTime() - 3 * 86400000),
      items: [
        { productName: "Wireless Headphones Pro", sku: "WHP-001", quantity: 1, unitPrice: 99.99, totalPrice: 99.99 },
        { productName: "USB-C Charging Cable",    sku: "UCC-005", quantity: 2, unitPrice: 25.00, totalPrice: 50.00 },
      ],
    },
    {
      customerId: allCustomers[1].id,
      orderNumber: "ORD-1002",
      status: "processing",
      paymentStatus: "paid",
      totalAmount: 299.00,
      carrier: "UPS",
      deliveryMethod: "standard",
      estimatedDelivery: new Date(now.getTime() + 5 * 86400000),
      createdAt: new Date(now.getTime() - 1 * 86400000),
      items: [
        { productName: "Mechanical Keyboard",  sku: "MKB-200", quantity: 1, unitPrice: 199.00, totalPrice: 199.00 },
        { productName: "Mouse Pad XL",         sku: "MPX-010", quantity: 1, unitPrice: 100.00, totalPrice: 100.00 },
      ],
    },
    {
      customerId: allCustomers[2].id,
      orderNumber: "ORD-1003",
      status: "delivered",
      paymentStatus: "paid",
      totalAmount: 59.99,
      carrier: "USPS",
      trackingNumber: "US-123456789",
      deliveryMethod: "standard",
      deliveredAt: new Date(now.getTime() - 1 * 86400000),
      createdAt: new Date(now.getTime() - 7 * 86400000),
      items: [
        { productName: "Smart Phone Case", sku: "SPC-100", quantity: 1, unitPrice: 29.99, totalPrice: 29.99 },
        { productName: "Screen Protector", sku: "SPR-005", quantity: 2, unitPrice: 15.00, totalPrice: 30.00 },
      ],
    },
    {
      customerId: allCustomers[0].id,
      orderNumber: "ORD-1004",
      status: "delivered",
      paymentStatus: "paid",
      totalAmount: 89.99,
      carrier: "FedEx",
      trackingNumber: "FX-111222333",
      deliveryMethod: "standard",
      deliveredAt: new Date(now.getTime() - 10 * 86400000),
      createdAt: new Date(now.getTime() - 14 * 86400000),
      items: [
        { productName: "Bluetooth Speaker", sku: "BTS-300", quantity: 1, unitPrice: 89.99, totalPrice: 89.99 },
      ],
    },
    {
      customerId: allCustomers[3].id,
      orderNumber: "ORD-1005",
      status: "cancelled",
      paymentStatus: "refunded",
      totalAmount: 199.00,
      deliveryMethod: "standard",
      createdAt: new Date(now.getTime() - 5 * 86400000),
      items: [
        { productName: "Gaming Controller", sku: "GCT-401", quantity: 1, unitPrice: 199.00, totalPrice: 199.00 },
      ],
    },
    {
      customerId: allCustomers[4].id,
      orderNumber: "ORD-1006",
      status: "pending",
      paymentStatus: "unpaid",
      totalAmount: 349.99,
      deliveryMethod: "express",
      createdAt: new Date(now.getTime() - 86400000 / 2),
      items: [
        { productName: "Smart Watch Series 5", sku: "SW-505", quantity: 1, unitPrice: 299.99, totalPrice: 299.99 },
        { productName: "Watch Band Leather",   sku: "WBL-010", quantity: 1, unitPrice: 50.00,  totalPrice: 50.00  },
      ],
    },
    {
      customerId: allCustomers[5].id,
      orderNumber: "ORD-1007",
      status: "confirmed",
      paymentStatus: "paid",
      totalAmount: 125.50,
      carrier: "DHL",
      deliveryMethod: "standard",
      estimatedDelivery: new Date(now.getTime() + 4 * 86400000),
      createdAt: new Date(now.getTime() - 2 * 86400000),
      items: [
        { productName: "Laptop Stand",      sku: "LST-200", quantity: 1, unitPrice: 75.50, totalPrice: 75.50 },
        { productName: "HDMI Cable 2m",     sku: "HDC-002", quantity: 2, unitPrice: 25.00, totalPrice: 50.00 },
      ],
    },
  ];

  for (const order of orderData) {
    const { items, ...orderFields } = order;
    const created = await prisma.order.create({
      data: {
        ...orderFields,
        items: { create: items },
      },
    });
    console.log(`  ✓ Created order ${created.orderNumber} for customer`);
  }

  // ── Calls (sample data) ──────────────────────────────────────
  const calls = [
    { customerId: allCustomers[0].id, callType: "inbound",  status: "ended",   duration: 245, outcome: "resolved",   phoneNumber: "+12025550101", summary: "Customer asked about order status. Issue resolved.", startedAt: new Date(now.getTime() - 86400000 * 1), endedAt: new Date(now.getTime() - 86400000 * 1 + 245000) },
    { customerId: allCustomers[1].id, callType: "inbound",  status: "ended",   duration: 183, outcome: "escalated",  phoneNumber: "+12025550102", summary: "Billing dispute escalated to human agent.", startedAt: new Date(now.getTime() - 86400000 * 2), endedAt: new Date(now.getTime() - 86400000 * 2 + 183000) },
    { customerId: allCustomers[2].id, callType: "outbound", status: "ended",   duration: 95,  outcome: "resolved",   phoneNumber: "+12025550103", summary: "Follow-up call. Customer satisfied with resolution.", startedAt: new Date(now.getTime() - 86400000 * 2), endedAt: new Date(now.getTime() - 86400000 * 2 + 95000) },
    { customerId: allCustomers[3].id, callType: "inbound",  status: "missed",  duration: 0,   outcome: "no-answer",  phoneNumber: "+12025550104", summary: null, startedAt: new Date(now.getTime() - 86400000 * 3), endedAt: null },
    { customerId: allCustomers[4].id, callType: "demo",     status: "ended",   duration: 60,  outcome: "resolved",   phoneNumber: "+12025550105", summary: "Demo call completed successfully.", startedAt: new Date(now.getTime() - 86400000 * 3), endedAt: new Date(now.getTime() - 86400000 * 3 + 60000) },
    { customerId: allCustomers[5].id, callType: "inbound",  status: "ended",   duration: 310, outcome: "resolved",   phoneNumber: "+12025550106", summary: "Technical support for account login issue.", startedAt: new Date(now.getTime() - 86400000 * 4), endedAt: new Date(now.getTime() - 86400000 * 4 + 310000) },
    { customerId: allCustomers[6].id, callType: "inbound",  status: "missed",  duration: 0,   outcome: "voicemail",  phoneNumber: "+12025550107", summary: null, startedAt: new Date(now.getTime() - 86400000 * 5), endedAt: null },
    { customerId: allCustomers[0].id, callType: "inbound",  status: "ended",   duration: 128, outcome: "resolved",   phoneNumber: "+12025550101", summary: "Return request processed.", startedAt: new Date(now.getTime() - 86400000 * 6), endedAt: new Date(now.getTime() - 86400000 * 6 + 128000) },
  ];

  for (const call of calls) {
    await prisma.call.create({ data: call });
  }

  // ── Support Tickets (sample data) ───────────────────────────
  await prisma.supportTicket.createMany({
    data: [
      { customerId: allCustomers[0].id, subject: "Order ORD-1001 not delivered on time", description: "My order ORD-1001 was supposed to arrive 3 days ago but hasn't.", priority: "high",   status: "in-progress", category: "shipping"  },
      { customerId: allCustomers[1].id, subject: "Wrong charge on invoice", description: "I was charged twice for my subscription.", priority: "urgent", status: "open",        category: "billing"   },
      { customerId: allCustomers[2].id, subject: "Password reset not working", description: "The reset email never arrives.", priority: "medium", status: "resolved",    category: "technical" },
      { customerId: allCustomers[3].id, subject: "Product damaged on arrival", description: "The packaging was torn and the product is broken.", priority: "high",   status: "open",        category: "shipping"  },
      { customerId: allCustomers[4].id, subject: "Refund request for ORD-1006", description: "I'd like to return my purchase and get a refund.", priority: "medium", status: "in-progress", category: "returns"   },
      { customerId: allCustomers[5].id, subject: "Cannot access account", description: "Account locked after too many login attempts.", priority: "high",   status: "resolved",    category: "technical" },
      { customerId: allCustomers[6].id, subject: "General inquiry", description: "What are your business hours?", priority: "low",    status: "closed",      category: "general"   },
    ],
  });

  // ── Knowledge Base (FAQ + Policies) ─────────────────────────
  await prisma.knowledgeBase.createMany({
    data: [
      { title: "Return Policy", content: "Customers can return any product within 30 days of purchase for a full refund. Items must be unused and in original packaging. To initiate a return, contact support with your order number.", category: "policy", tags: "returns,refund,policy" },
      { title: "Shipping Information", content: "Standard shipping takes 3-5 business days. Express shipping takes 1-2 business days. Free shipping on orders over $50. International shipping available to 50+ countries.", category: "policy", tags: "shipping,delivery,tracking" },
      { title: "How to reset your password", content: "Go to the login page and click 'Forgot Password'. Enter your email address and check your inbox for a reset link. The link expires in 24 hours. If you don't receive the email, check your spam folder.", category: "faq", tags: "password,login,account" },
      { title: "Billing & Payment Methods", content: "We accept Visa, MasterCard, American Express, PayPal, and bank transfers. All transactions are secured with SSL encryption. Billing cycles are monthly or annual.", category: "policy", tags: "billing,payment,invoice" },
      { title: "How to track an order", content: "Once your order ships, you'll receive a tracking number via email. You can also track your order by logging into your account and visiting 'Order History'.", category: "faq", tags: "order,tracking,shipping" },
      { title: "Cancellation Policy", content: "Subscriptions can be cancelled at any time before the next billing date. No cancellation fees apply. Access continues until the end of the paid period.", category: "policy", tags: "cancel,subscription,refund" },
      { title: "Account Setup Guide", content: "Create an account by clicking 'Sign Up', entering your name, email, and password. Verify your email address. Complete your profile by adding company and phone number.", category: "instruction", tags: "account,setup,registration" },
      { title: "Contacting Human Support", content: "For complex issues, the AI will escalate to a human agent. Human support is available Monday-Friday 9AM-6PM EST. You can also email support@callflowai.com or use the live chat.", category: "faq", tags: "support,human,contact,escalate" },
    ],
  });

  const totalOrders = await prisma.order.count();
  console.log("\n✅ Database seeded successfully!");
  console.log(`   • ${allCustomers.length} customers`);
  console.log(`   • ${totalOrders} orders with items`);
  console.log(`   • ${calls.length} calls`);
  console.log("   • 7 support tickets");
  console.log("   • 8 knowledge base entries");
}

main()
  .catch((e) => { console.error("❌ Seed error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
