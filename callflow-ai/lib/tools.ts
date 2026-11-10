// lib/tools.ts
// Real backend tools for Customer CRM, Orders, and Support Tickets.
// Directly interacts with Prisma database with argument validation and error handling.

import { prisma } from "@/lib/prisma";

export interface ToolResult {
  success: boolean;
  message: string;
  [key: string]: any;
}

// ─────────────────────────────────────────────────────────────────
// HELPER: format order for voice response
// ─────────────────────────────────────────────────────────────────
function formatOrderForVoice(order: any): object {
  const items = order.items?.map((i: any) => ({
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
    estimated_delivery: order.estimatedDelivery
      ? new Date(order.estimatedDelivery).toDateString()
      : null,
    delivered_at: order.deliveredAt
      ? new Date(order.deliveredAt).toDateString()
      : null,
    order_date: new Date(order.createdAt).toDateString(),
    items,
    item_count: items.length,
  };
}

// ─────────────────────────────────────────────────────────────────
// 1. create_customer
// ─────────────────────────────────────────────────────────────────
export async function executeCreateCustomer(args: Record<string, any>): Promise<ToolResult> {
  const fullName = (args.full_name || args.fullName || args.name || "").trim();
  const phone    = (args.phone || args.phone_number || args.phoneNumber || "").trim();
  const email    = (args.email || "").trim() || null;
  const company  = (args.company || "").trim() || null;

  if (!fullName) return { success: false, message: "Customer full name is required." };
  if (!phone)    return { success: false, message: "Customer phone number is required." };

  try {
    const existing = await prisma.customer.findUnique({
      where: { phone },
      include: { _count: { select: { calls: true, supportTickets: true, orders: true } } },
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
  } catch (error: any) {
    console.error("Error in executeCreateCustomer:", error);
    return { success: false, message: `Database error creating customer: ${error.message || "Unknown error"}` };
  }
}

// ─────────────────────────────────────────────────────────────────
// 2. lookup_customer
// ─────────────────────────────────────────────────────────────────
export async function executeLookupCustomer(args: Record<string, any>): Promise<ToolResult> {
  const phone = (args.phone || args.phone_number || args.phoneNumber || "").trim();
  const email = (args.email || "").trim();
  const name  = (args.name || args.full_name || args.fullName || "").trim();

  if (!phone && !email && !name) {
    return { success: false, found: false, message: "Please provide a phone number, email, or name to search." };
  }

  try {
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          phone ? { phone: { contains: phone } } : {},
          email ? { email: { contains: email } } : {},
          name  ? { fullName: { contains: name } }  : {},
        ].filter((c) => Object.keys(c).length > 0),
      },
      include: {
        supportTickets: {
          take: 3,
          orderBy: { createdAt: "desc" },
          select: { id: true, subject: true, status: true, priority: true, createdAt: true },
        },
        orders: {
          take: 3,
          orderBy: { createdAt: "desc" },
          select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true },
        },
        calls: {
          take: 2,
          orderBy: { createdAt: "desc" },
          select: { id: true, duration: true, summary: true, createdAt: true },
        },
      },
    });

    if (!customer) {
      return {
        success: true,
        found: false,
        message: `No customer record found matching ${phone || email || name} in CallFlow database.`,
      };
    }

    return {
      success: true,
      found: true,
      customer_id: customer.id,
      full_name: customer.fullName,
      phone: customer.phone,
      email: customer.email,
      company: customer.company,
      status: customer.status,
      created_at: customer.createdAt.toISOString(),
      order_count: customer.orders.length,
      recent_orders: customer.orders.map((o) => ({
        order_number: o.orderNumber,
        status: o.status,
        total: `$${o.totalAmount.toFixed(2)}`,
        date: new Date(o.createdAt).toDateString(),
      })),
      recent_tickets: customer.supportTickets.map((t) => ({
        ticket_id: t.id,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
      })),
      message: `Found customer '${customer.fullName}' (ID: ${customer.id}, Phone: ${customer.phone}, Status: ${customer.status}). They have ${customer.orders.length} order(s).`,
    };
  } catch (error: any) {
    console.error("Error in executeLookupCustomer:", error);
    return { success: false, found: false, message: `Database error looking up customer: ${error.message || "Unknown error"}` };
  }
}

// ─────────────────────────────────────────────────────────────────
// 3. update_customer
// ─────────────────────────────────────────────────────────────────
export async function executeUpdateCustomer(args: Record<string, any>): Promise<ToolResult> {
  const customerId = (args.customer_id || args.customerId || "").trim();
  const phone      = (args.phone || args.phone_number || args.phoneNumber || "").trim();
  const fullName   = (args.full_name || args.fullName || "").trim();
  const email      = (args.email || "").trim();
  const company    = (args.company || "").trim();
  const status     = (args.status || "").trim();

  try {
    let target = null;
    if (customerId) {
      target = await prisma.customer.findUnique({ where: { id: customerId } });
    } else if (phone) {
      target = await prisma.customer.findUnique({ where: { phone } });
    }

    if (!target) {
      return { success: false, message: `Customer not found with ${customerId ? `ID: ${customerId}` : `Phone: ${phone}`}. Cannot update.` };
    }

    const updated = await prisma.customer.update({
      where: { id: target.id },
      data: {
        ...(fullName && { fullName }),
        ...(email    && { email }),
        ...(company  && { company }),
        ...(status   && { status }),
      },
    });

    return {
      success: true,
      customer_id: updated.id,
      full_name: updated.fullName,
      phone: updated.phone,
      email: updated.email,
      company: updated.company,
      status: updated.status,
      message: `Customer '${updated.fullName}' (ID: ${updated.id}) successfully updated in database.`,
    };
  } catch (error: any) {
    console.error("Error in executeUpdateCustomer:", error);
    return { success: false, message: `Database error updating customer: ${error.message || "Unknown error"}` };
  }
}

// ─────────────────────────────────────────────────────────────────
// 4. create_support_ticket
// ─────────────────────────────────────────────────────────────────
export async function executeCreateSupportTicket(args: Record<string, any>): Promise<ToolResult> {
  let customerId = (args.customer_id || args.customerId || "").trim();
  const phone       = (args.phone || args.phone_number || args.phoneNumber || "").trim();
  const subject     = (args.subject || "").trim();
  const description = (args.description || "").trim();
  const priority    = (args.priority || "medium").toLowerCase();
  const status      = (args.status || "open").toLowerCase();
  const category    = (args.category || "general").toLowerCase();

  if (!subject)     return { success: false, message: "Ticket subject is required." };
  if (!description) return { success: false, message: "Ticket description is required." };

  try {
    if (!customerId && phone) {
      const cust = await prisma.customer.findUnique({ where: { phone } });
      if (cust) customerId = cust.id;
    }

    let customerName = "Guest Customer";
    if (customerId) {
      const existingCustomer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (existingCustomer) {
        customerName = existingCustomer.fullName;
      } else {
        customerId = "";
      }
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        customerId: customerId || null,
        subject,
        description,
        priority: ["low", "medium", "high", "urgent"].includes(priority) ? priority : "medium",
        status:   ["open", "in-progress", "resolved", "closed"].includes(status) ? status : "open",
        category: ["general", "billing", "technical", "shipping", "returns"].includes(category) ? category : "general",
      },
      include: { customer: true },
    });

    return {
      success: true,
      ticket_id: ticket.id,
      customer_id: ticket.customerId,
      customer_name: ticket.customer?.fullName || customerName,
      subject: ticket.subject,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      category: ticket.category,
      created_at: ticket.createdAt.toISOString(),
      message: `Support ticket #${ticket.id.slice(0, 8)} successfully created for ${customerName} (Subject: '${ticket.subject}', Priority: ${ticket.priority}).`,
    };
  } catch (error: any) {
    console.error("Error in executeCreateSupportTicket:", error);
    return { success: false, message: `Database error creating support ticket: ${error.message || "Unknown error"}` };
  }
}

// ─────────────────────────────────────────────────────────────────
// 5. get_latest_order  ← KEY FIX: finds order by PHONE, no order ID needed
// ─────────────────────────────────────────────────────────────────
export async function executeGetLatestOrder(args: Record<string, any>): Promise<ToolResult> {
  const phone      = (args.phone || args.phone_number || args.phoneNumber || "").trim();
  const customerId = (args.customer_id || args.customerId || "").trim();

  if (!phone && !customerId) {
    return {
      success: false,
      found: false,
      message: "Please provide the customer's registered phone number to look up their latest order.",
    };
  }

  try {
    // Find customer first
    let customer: any = null;
    if (customerId) {
      customer = await prisma.customer.findUnique({ where: { id: customerId } });
    }
    if (!customer && phone) {
      customer = await prisma.customer.findUnique({ where: { phone } });
    }

    if (!customer) {
      return {
        success: true,
        found: false,
        message: `No customer found with phone number ${phone}. Please verify the phone number or register first.`,
      };
    }

    // Get the most recent order
    const latestOrder = await prisma.order.findFirst({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });

    if (!latestOrder) {
      return {
        success: true,
        found: false,
        customer_id: customer.id,
        customer_name: customer.fullName,
        message: `Customer '${customer.fullName}' has no orders on record yet.`,
      };
    }

    const formatted = formatOrderForVoice(latestOrder);

    return {
      success: true,
      found: true,
      customer_id: customer.id,
      customer_name: customer.fullName,
      ...formatted,
      message: `Latest order for ${customer.fullName}: Order ${latestOrder.orderNumber} placed on ${new Date(latestOrder.createdAt).toDateString()}. Status: ${latestOrder.status}. Total: $${latestOrder.totalAmount.toFixed(2)}. Payment: ${latestOrder.paymentStatus}. ${latestOrder.carrier ? `Carrier: ${latestOrder.carrier}.` : ""} ${latestOrder.trackingNumber ? `Tracking: ${latestOrder.trackingNumber}.` : ""} ${latestOrder.estimatedDelivery ? `Estimated delivery: ${new Date(latestOrder.estimatedDelivery).toDateString()}.` : ""} ${latestOrder.deliveredAt ? `Delivered on: ${new Date(latestOrder.deliveredAt).toDateString()}.` : ""}`.trim(),
    };
  } catch (error: any) {
    console.error("Error in executeGetLatestOrder:", error);
    return { success: false, found: false, message: `Database error fetching latest order: ${error.message || "Unknown error"}` };
  }
}

// ─────────────────────────────────────────────────────────────────
// 6. lookup_order  ← by order ID or order number
// ─────────────────────────────────────────────────────────────────
export async function executeLookupOrder(args: Record<string, any>): Promise<ToolResult> {
  const orderId     = (args.order_id || args.orderId || "").toString().trim();
  const orderNumber = (args.order_number || args.orderNumber || "").toString().trim();
  const phone       = (args.phone || "").toString().trim();

  if (!orderId && !orderNumber && !phone) {
    return { success: false, found: false, message: "Please provide an order ID, order number, or phone number to look up." };
  }

  try {
    let order: any = null;

    if (orderId) {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true, customer: true },
      });
    }

    if (!order && orderNumber) {
      order = await prisma.order.findUnique({
        where: { orderNumber },
        include: { items: true, customer: true },
      });
    }

    // Search by phone: get customer then their latest order
    if (!order && phone) {
      const customer = await prisma.customer.findUnique({ where: { phone } });
      if (customer) {
        order = await prisma.order.findFirst({
          where: { customerId: customer.id },
          orderBy: { createdAt: "desc" },
          include: { items: true, customer: true },
        });
      }
    }

    if (!order) {
      return {
        success: true,
        found: false,
        message: `No order found with that information in our database. Please check the order number and try again.`,
      };
    }

    const formatted = formatOrderForVoice(order);

    return {
      success: true,
      found: true,
      customer_name: order.customer?.fullName || "Unknown",
      ...formatted,
      message: `Order ${order.orderNumber}: Status is ${order.status}. Total: $${order.totalAmount.toFixed(2)}. Payment: ${order.paymentStatus}. ${order.carrier ? `Shipped via ${order.carrier}.` : ""} ${order.trackingNumber ? `Tracking: ${order.trackingNumber}.` : ""} ${order.estimatedDelivery ? `Estimated delivery: ${new Date(order.estimatedDelivery).toDateString()}.` : ""} ${order.deliveredAt ? `Delivered: ${new Date(order.deliveredAt).toDateString()}.` : ""}`.trim(),
    };
  } catch (error: any) {
    console.error("Error in executeLookupOrder:", error);
    return { success: false, found: false, message: `Database error looking up order: ${error.message || "Unknown error"}` };
  }
}

// ─────────────────────────────────────────────────────────────────
// 7. get_customer_orders  ← full order history by phone
// ─────────────────────────────────────────────────────────────────
export async function executeGetCustomerOrders(args: Record<string, any>): Promise<ToolResult> {
  const phone      = (args.phone || args.phone_number || args.phoneNumber || "").trim();
  const customerId = (args.customer_id || args.customerId || "").trim();

  if (!phone && !customerId) {
    return { success: false, found: false, message: "Please provide the customer's phone number to look up their order history." };
  }

  try {
    let customer: any = null;
    if (customerId) customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer && phone) customer = await prisma.customer.findUnique({ where: { phone } });

    if (!customer) {
      return { success: true, found: false, message: `No customer found with phone ${phone}. Please verify the phone number.` };
    }

    const orders = await prisma.order.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });

    if (orders.length === 0) {
      return {
        success: true,
        found: true,
        customer_id: customer.id,
        customer_name: customer.fullName,
        order_count: 0,
        orders: [],
        message: `Customer '${customer.fullName}' has no orders on record.`,
      };
    }

    const formattedOrders = orders.map(formatOrderForVoice);

    return {
      success: true,
      found: true,
      customer_id: customer.id,
      customer_name: customer.fullName,
      order_count: orders.length,
      orders: formattedOrders,
      message: `Found ${orders.length} order(s) for ${customer.fullName}. Most recent: Order ${orders[0].orderNumber}, status ${orders[0].status}, placed ${new Date(orders[0].createdAt).toDateString()}.`,
    };
  } catch (error: any) {
    console.error("Error in executeGetCustomerOrders:", error);
    return { success: false, found: false, message: `Database error fetching orders: ${error.message || "Unknown error"}` };
  }
}

// ─────────────────────────────────────────────────────────────────
// 8. create_order
// ─────────────────────────────────────────────────────────────────
export async function executeCreateOrder(args: Record<string, any>): Promise<ToolResult> {
  const phone        = (args.phone || "").trim();
  const customerId   = (args.customer_id || args.customerId || "").trim();
  const productName  = (args.product_name || args.productName || "").trim();
  const quantity     = parseInt(args.quantity || "1", 10) || 1;
  const unitPrice    = parseFloat(args.unit_price || args.unitPrice || args.price || "0");
  const deliveryMethod = (args.delivery_method || args.deliveryMethod || "standard").trim();
  const deliveryAddress = (args.delivery_address || args.deliveryAddress || "").trim();

  if (!productName) return { success: false, message: "Product name is required to create an order." };
  if (unitPrice <= 0) return { success: false, message: "Valid unit price is required to create an order." };

  try {
    let customer: any = null;
    if (customerId) customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer && phone) customer = await prisma.customer.findUnique({ where: { phone } });
    if (!customer) return { success: false, message: "Customer not found. Please register the customer first before creating an order." };

    // Generate order number
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
        currency: "USD",
        deliveryMethod,
        deliveryAddress: deliveryAddress || null,
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
      customer_id: customer.id,
      customer_name: customer.fullName,
      product: productName,
      quantity,
      total_amount: `$${order.totalAmount.toFixed(2)}`,
      status: order.status,
      payment_status: order.paymentStatus,
      message: `Order ${order.orderNumber} created for ${customer.fullName}. Product: ${productName} x${quantity}. Total: $${order.totalAmount.toFixed(2)}. Status: Pending payment.`,
    };
  } catch (error: any) {
    console.error("Error in executeCreateOrder:", error);
    return { success: false, message: `Database error creating order: ${error.message || "Unknown error"}` };
  }
}

// ─────────────────────────────────────────────────────────────────
// 9. update_order
// ─────────────────────────────────────────────────────────────────
export async function executeUpdateOrder(args: Record<string, any>): Promise<ToolResult> {
  const orderId     = (args.order_id || args.orderId || "").trim();
  const orderNumber = (args.order_number || args.orderNumber || "").trim();
  const newStatus   = (args.status || "").trim();
  const paymentStatus = (args.payment_status || args.paymentStatus || "").trim();
  const trackingNumber = (args.tracking_number || args.trackingNumber || "").trim();
  const carrier     = (args.carrier || "").trim();

  if (!orderId && !orderNumber) {
    return { success: false, message: "Order ID or order number is required to update an order." };
  }

  try {
    let order: any = null;
    if (orderId) order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order && orderNumber) order = await prisma.order.findUnique({ where: { orderNumber } });

    if (!order) return { success: false, message: `Order not found. Cannot update.` };

    const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];
    const validPayment  = ["unpaid", "paid", "refunded", "partial"];

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        ...(newStatus    && validStatuses.includes(newStatus)  && { status: newStatus }),
        ...(paymentStatus && validPayment.includes(paymentStatus) && { paymentStatus }),
        ...(trackingNumber && { trackingNumber }),
        ...(carrier      && { carrier }),
        ...(newStatus === "delivered" && { deliveredAt: new Date() }),
      },
      include: { items: true, customer: true },
    });

    return {
      success: true,
      order_id: updated.id,
      order_number: updated.orderNumber,
      status: updated.status,
      payment_status: updated.paymentStatus,
      tracking_number: updated.trackingNumber,
      carrier: updated.carrier,
      message: `Order ${updated.orderNumber} updated successfully. Status: ${updated.status}. Payment: ${updated.paymentStatus}.`,
    };
  } catch (error: any) {
    console.error("Error in executeUpdateOrder:", error);
    return { success: false, message: `Database error updating order: ${error.message || "Unknown error"}` };
  }
}

// ─────────────────────────────────────────────────────────────────
// 10. lookup_support_ticket
// ─────────────────────────────────────────────────────────────────
export async function executeLookupSupportTicket(args: Record<string, any>): Promise<ToolResult> {
  const ticketId = (args.ticket_id || args.ticketId || "").trim();
  const phone    = (args.phone || "").trim();

  if (!ticketId && !phone) {
    return { success: false, found: false, message: "Please provide a ticket ID or phone number to look up a support ticket." };
  }

  try {
    let ticket: any = null;

    if (ticketId) {
      ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: { customer: true },
      });
    }

    if (!ticket && phone) {
      const customer = await prisma.customer.findUnique({ where: { phone } });
      if (customer) {
        ticket = await prisma.supportTicket.findFirst({
          where: { customerId: customer.id },
          orderBy: { createdAt: "desc" },
          include: { customer: true },
        });
      }
    }

    if (!ticket) {
      return { success: true, found: false, message: "No support ticket found with that information." };
    }

    return {
      success: true,
      found: true,
      ticket_id: ticket.id,
      customer_name: ticket.customer?.fullName || "Guest",
      subject: ticket.subject,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      category: ticket.category,
      created_at: new Date(ticket.createdAt).toDateString(),
      updated_at: new Date(ticket.updatedAt).toDateString(),
      message: `Support ticket #${ticket.id.slice(0, 8)}: "${ticket.subject}" — Status: ${ticket.status}, Priority: ${ticket.priority}. Created: ${new Date(ticket.createdAt).toDateString()}.`,
    };
  } catch (error: any) {
    console.error("Error in executeLookupSupportTicket:", error);
    return { success: false, found: false, message: `Database error looking up ticket: ${error.message || "Unknown error"}` };
  }
}

// ─────────────────────────────────────────────────────────────────
// 11. update_support_ticket
// ─────────────────────────────────────────────────────────────────
export async function executeUpdateSupportTicket(args: Record<string, any>): Promise<ToolResult> {
  const ticketId  = (args.ticket_id || args.ticketId || "").trim();
  const newStatus = (args.status || "").trim();
  const priority  = (args.priority || "").trim();

  if (!ticketId) return { success: false, message: "Ticket ID is required to update a support ticket." };

  try {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) return { success: false, message: `Ticket not found with ID: ${ticketId}` };

    const validStatuses  = ["open", "in-progress", "resolved", "closed"];
    const validPriority  = ["low", "medium", "high", "urgent"];

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...(newStatus && validStatuses.includes(newStatus) && { status: newStatus }),
        ...(priority  && validPriority.includes(priority)  && { priority }),
      },
    });

    return {
      success: true,
      ticket_id: updated.id,
      status: updated.status,
      priority: updated.priority,
      message: `Support ticket #${updated.id.slice(0, 8)} updated. Status: ${updated.status}, Priority: ${updated.priority}.`,
    };
  } catch (error: any) {
    console.error("Error in executeUpdateSupportTicket:", error);
    return { success: false, message: `Database error updating ticket: ${error.message || "Unknown error"}` };
  }
}

// ─────────────────────────────────────────────────────────────────
// MASTER DISPATCHER
// ─────────────────────────────────────────────────────────────────
export async function executeTool(name: string, args: Record<string, any>): Promise<ToolResult> {
  const n = name.toLowerCase().trim();

  switch (n) {
    case "create_customer":          return executeCreateCustomer(args);
    case "lookup_customer":          return executeLookupCustomer(args);
    case "update_customer":          return executeUpdateCustomer(args);
    case "create_support_ticket":    return executeCreateSupportTicket(args);
    case "lookup_support_ticket":    return executeLookupSupportTicket(args);
    case "update_support_ticket":    return executeUpdateSupportTicket(args);
    case "get_latest_order":         return executeGetLatestOrder(args);
    case "lookup_order":             return executeLookupOrder(args);
    case "get_customer_orders":      return executeGetCustomerOrders(args);
    case "create_order":             return executeCreateOrder(args);
    case "update_order":             return executeUpdateOrder(args);
    default:
      return { success: false, message: `Tool '${name}' is not recognized by CallFlow backend.` };
  }
}
