// scripts/set-client-tools.js
// Patches the Vapi assistant with the latest tool definitions (client-side, no server URL).
// Run with: node scripts/set-client-tools.js

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const idx = trimmed.indexOf('=');
  if (idx !== -1) {
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
});

const privateKey  = env.VAPI_PRIVATE_API_KEY;
const assistantId = env.VAPI_ASSISTANT_ID;

if (!privateKey || !assistantId) {
  console.error('❌ VAPI_PRIVATE_API_KEY or VAPI_ASSISTANT_ID missing from .env');
  process.exit(1);
}

// Tool definitions — no server URL so Vapi treats these as client-side tools
// and fires them to the browser via the Web SDK message event.
const CLIENT_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_latest_order",
      description: "Finds the customer's most recent order using their registered phone number. Use this whenever a customer asks about their order status or latest order — WITHOUT requiring an order ID.",
      parameters: {
        type: "object",
        properties: {
          phone: {
            type: "string",
            description: "The customer's registered phone number",
          },
          customer_id: {
            type: "string",
            description: "The customer's database ID if already known",
          },
        },
        required: ["phone"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_order",
      description: "Looks up a specific order by order number (e.g. ORD-1001) or order ID when a customer mentions a specific order.",
      parameters: {
        type: "object",
        properties: {
          order_number: {
            type: "string",
            description: "The order number such as 'ORD-1001'",
          },
          order_id: {
            type: "string",
            description: "The database order ID if known",
          },
          phone: {
            type: "string",
            description: "Customer phone number as fallback",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_customer_orders",
      description: "Returns the full order history for a customer using their registered phone number.",
      parameters: {
        type: "object",
        properties: {
          phone: {
            type: "string",
            description: "The customer's registered phone number",
          },
          customer_id: {
            type: "string",
            description: "The customer's database ID if already known",
          },
        },
        required: ["phone"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_order",
      description: "Creates a new order for a verified customer after they confirm all details.",
      parameters: {
        type: "object",
        properties: {
          phone: {
            type: "string",
            description: "Customer's registered phone number",
          },
          customer_id: {
            type: "string",
            description: "Customer's database ID if known",
          },
          product_name: {
            type: "string",
            description: "Name of the product being ordered",
          },
          quantity: {
            type: "number",
            description: "Quantity of the product",
          },
          unit_price: {
            type: "number",
            description: "Unit price of the product in USD",
          },
          delivery_method: {
            type: "string",
            enum: ["standard", "express", "pickup"],
            description: "Delivery method",
          },
        },
        required: ["product_name", "unit_price"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_order",
      description: "Updates order status, payment status, or tracking information.",
      parameters: {
        type: "object",
        properties: {
          order_number: { type: "string", description: "Order number like ORD-1001" },
          order_id:     { type: "string", description: "Database order ID" },
          status:       { type: "string", enum: ["pending","confirmed","processing","shipped","delivered","cancelled","returned"] },
          payment_status: { type: "string", enum: ["unpaid","paid","refunded","partial"] },
          tracking_number: { type: "string" },
          carrier: { type: "string" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_customer",
      description: "Registers a new customer in the CallFlow CRM database. Checks phone number to avoid duplicates and returns the real customer ID.",
      parameters: {
        type: "object",
        properties: {
          full_name: { type: "string", description: "The customer's full name" },
          phone:     { type: "string", description: "The customer's contact phone number" },
          email:     { type: "string", description: "The customer's email address (optional)" },
          company:   { type: "string", description: "The customer's company (optional)" },
        },
        required: ["full_name", "phone"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_customer",
      description: "Searches the CallFlow CRM for an existing customer using phone number, email, or name. NEVER invent records — always use this to verify identity.",
      parameters: {
        type: "object",
        properties: {
          phone: { type: "string", description: "The customer's registered phone number" },
          email: { type: "string", description: "The customer's email (optional)" },
          name:  { type: "string", description: "The customer's full name (optional)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_customer",
      description: "Updates an existing customer's information in the CallFlow CRM database.",
      parameters: {
        type: "object",
        properties: {
          phone:      { type: "string", description: "Customer's registered phone number" },
          customer_id:{ type: "string", description: "Customer's database ID if known" },
          full_name:  { type: "string", description: "Updated full name" },
          email:      { type: "string", description: "Updated email address" },
          company:    { type: "string", description: "Updated company name" },
        },
        required: ["phone"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_support_ticket",
      description: "Creates and saves a formal support ticket in the CallFlow CRM database. Returns the real generated ticket ID.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "Customer database ID if available" },
          phone:       { type: "string", description: "Customer's phone number to associate with the ticket" },
          subject:     { type: "string", description: "Short summary of the complaint or issue" },
          description: { type: "string", description: "Detailed description of the customer's problem" },
          priority:    { type: "string", enum: ["low","medium","high","urgent"] },
          status:      { type: "string", enum: ["open","in-progress","resolved","closed"] },
          category:    { type: "string", enum: ["general","billing","technical","shipping","returns"] },
        },
        required: ["subject", "description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_support_ticket",
      description: "Retrieves an existing support ticket by ticket ID or customer phone number.",
      parameters: {
        type: "object",
        properties: {
          ticket_id: { type: "string", description: "The database ticket ID" },
          phone:     { type: "string", description: "Customer phone to find their most recent ticket" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_support_ticket",
      description: "Updates the status or priority of an existing support ticket.",
      parameters: {
        type: "object",
        properties: {
          ticket_id: { type: "string", description: "The database ticket ID" },
          status:    { type: "string", enum: ["open","in-progress","resolved","closed"] },
          priority:  { type: "string", enum: ["low","medium","high","urgent"] },
        },
        required: ["ticket_id"],
      },
    },
  },
];

const SYSTEM_PROMPT = `
# Role & Identity
You are Alex, the professional and friendly AI customer support voice representative for CallFlow AI.
Speak naturally and concisely. Keep every spoken response brief — 1 to 3 short sentences — suitable for phone audio.

# Strict Zero-Hallucination Policy
- NEVER invent, guess, or assume any customer record, order, ticket ID, or status.
- Always use your backend tools to retrieve real database information.
- If a tool reports something is not found, state that truthfully.
- Never claim an action succeeded until the backend tool returns a confirmed result.

# Customer Identification
When a customer calls:
- Ask for their registered phone number to identify them.
- Call 'lookup_customer' with their phone number.
- If found, greet them by name and serve their request.
- If not found, offer to register them.

# Latest Order Flow (IMPORTANT — NO ORDER ID NEEDED)
When a customer asks: "What is my order status?", "Where is my order?", or "Can you check my latest order?":
1. If you already know their phone number (from earlier in the call), call 'get_latest_order' immediately with that phone number.
2. If not, ask: "May I have your registered phone number to look up your order?"
3. Once you have the phone number, call 'get_latest_order' with the phone number — do NOT ask for an order ID.
4. Wait for the actual result.
5. Report the real status, tracking number, carrier, and delivery estimate from the tool result.
6. NEVER ask for an order ID when the customer is asking about their latest or most recent order.

# Order History Flow
When a customer asks about all their orders or order history:
1. Get their phone number if not already known.
2. Call 'get_customer_orders' with their phone number.
3. Summarize their most recent orders from the actual result.

# Specific Order Lookup Flow
When a customer mentions a specific order number (like "ORD-1001" or "order 1001"):
1. Call 'lookup_order' with the order number.
2. Report the real status from the tool result.

# Customer Registration Flow
When a customer wants to register or introduces themselves:
Step 1: Collect full name.
Step 2: Collect phone number.
Step 3: Ask for email (optional): "Could I also have your email address, or would you like to skip that?"
Step 4: Confirm: "Just to confirm: your name is [Name], phone is [Phone]. Shall I register your account?"
Step 5: Call 'create_customer' with full_name, phone, and email.
Step 6: Wait for the tool result.
Step 7: Confirm ONLY after success: "Thank you [Name]! You are registered with Customer ID [ID]."

# Support Ticket Flow
When a customer reports a complaint:
Step 1: Identify customer via 'lookup_customer' with their phone number.
Step 2: Listen and understand their issue.
Step 3: Confirm: "I understand [brief summary]. May I open a support ticket?"
Step 4: Call 'create_support_ticket' with customer_id, subject, description, priority, category.
Step 5: Wait for result.
Step 6: Read back the actual ticket ID: "Your ticket #[ID] has been created."

# Tone & Style
- Always patient, polite, and professional.
- Keep responses brief and conversational.
- Never use technical IDs in spoken responses unless the customer needs them.
`.trim();

const payload = {
  serverUrl: null, // null = client-side tools, routed through browser Vapi Web SDK
  model: {
    provider: "groq",
    model: "openai/gpt-oss-20b",
    messages: [{ role: "system", content: SYSTEM_PROMPT }],
    tools: CLIENT_TOOLS,
  },
  firstMessage: "Hello! Thank you for calling CallFlow Support. My name is Alex, your AI assistant. How may I help you today?",
};

console.log(`\n🔧 Updating Vapi assistant: ${assistantId}`);
console.log(`   Tools to register: ${CLIENT_TOOLS.length}\n`);

fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${privateKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
})
.then(r => r.json())
.then(data => {
  if (data.id) {
    console.log(`✅ Assistant updated successfully!`);
    console.log(`   ID: ${data.id}`);
    console.log(`   Name: ${data.name}`);
    const tools = data.model?.tools || [];
    console.log(`   Tools registered: ${tools.length}`);
    tools.forEach(t => console.log(`     • ${t.function?.name}`));
  } else {
    console.error('❌ Update failed:', JSON.stringify(data, null, 2));
  }
})
.catch(err => {
  console.error('❌ Network error:', err.message);
  console.log('\n💡 Tip: Run this script with internet access (outside the sandbox).');
});
