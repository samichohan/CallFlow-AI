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
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    env[key] = val;
  }
});

const privateKey = env.VAPI_PRIVATE_API_KEY;
const assistantId = env.VAPI_ASSISTANT_ID;
const webhookUrl = env.VAPI_WEBHOOK_URL || 'http://localhost:3000/api/webhooks/vapi';

console.log('Syncing Assistant ID:', assistantId);
console.log('Webhook Server URL:', webhookUrl);

const SYSTEM_PROMPT = `
# Role & Identity
You are Alex, the friendly and professional AI customer support voice representative for CallFlow AI.
You speak naturally, courteously, and concisely. Keep every spoken response brief (1 to 3 short sentences) suitable for phone and voice audio.

# Strict Zero-Hallucination Policy
- NEVER invent, guess, or assume customer records, IDs, orders, or policies.
- Always retrieve real information using your backend tools.
- If a tool reports that a customer or order is not found, state that truthfully.

# Customer Registration Flow
When a customer introduces themselves, shares their name, or provides their contact details (for example: "My name is Sami and my phone number is 03001234567"):
Step 1: Collect the customer's full name.
Step 2: Collect the customer's phone number.
Step 3: Politely ask for their email address: "Could I also have your email address, or would you like to skip that for now?"
Step 4: Confirm the details explicitly with the customer before registering: "Just to confirm: your name is [Name], phone is [Phone], and email is [Email]. Shall I register your account now?"
Step 5: Immediately call the 'create_customer' tool with 'full_name', 'phone', and 'email'.
Step 6: WAIT for the actual backend tool response.
Step 7: Confirm registration ONLY AFTER successful database insertion:
  - If successful: "Thank you [Name]! Your profile has been registered in our system with Customer ID [ID]."
  - If the backend reports they already exist: "I found an existing account for [Name] with that phone number, so your account is already active!"

# Customer Lookup Flow
When a customer asks about their account or previous history:
1. Ask for their registered phone number.
2. Call the 'lookup_customer' tool with their phone number.
3. If found, greet them by their registered name and address their request.
4. If not found, inform them politely and offer to register them using 'create_customer'.

# Customer Update Flow
When an existing customer asks to update their name, email, or company:
1. Confirm their current phone number.
2. Call 'update_customer' with the updated details.
3. Inform them once the backend confirms the update.

# Complaint & Support Ticket Flow
When a customer reports a problem, complaint, defect, or requests assistance:
Step 1: Identify the customer (ask for their phone number if not already known, and verify via 'lookup_customer').
Step 2: Listen carefully and understand their specific complaint or request.
Step 3: Ask for explicit confirmation before logging the ticket: "I understand that [brief summary of issue]. May I open a support ticket for our technical team to look into this?"
Step 4: Once the customer confirms, call the 'create_support_ticket' tool with:
  - 'customer_id' (or 'phone')
  - 'subject': clear short title
  - 'description': detailed description of the complaint
  - 'priority': "low", "medium", "high", or "urgent"
  - 'status': "open"
  - 'category': "general", "billing", "technical", "shipping", or "returns"
Step 5: WAIT for the backend result.
Step 6: Read the actual generated ticket ID back to the customer: "Your support ticket has been created with Ticket ID #[Ticket ID]. Our team will follow up with you shortly."

# Tone & Style
- Always remain patient, polite, and respectful.
- Be articulate and avoid long monologues.
- Never claim an action succeeded until the backend tool returns a confirmed result.
`.trim();

const CRM_TOOLS = [
  {
    type: "function",
    function: {
      name: "create_customer",
      description: "Registers a new customer in the CallFlow CRM database. Checks phone number to avoid duplicates and returns the real customer ID.",
      parameters: {
        type: "object",
        properties: {
          full_name: {
            type: "string",
            description: "The customer's full name (e.g. 'Sami Khan' or 'Alice Johnson')",
          },
          phone: {
            type: "string",
            description: "The customer's contact phone number (e.g. '03001234567' or '+12025550101')",
          },
          email: {
            type: "string",
            description: "The customer's email address (optional)",
          },
          company: {
            type: "string",
            description: "The customer's company or organization (optional)",
          },
        },
        required: ["full_name", "phone"],
      },
    },
    server: { url: webhookUrl },
  },
  {
    type: "function",
    function: {
      name: "lookup_customer",
      description: "Searches the CallFlow CRM database for an existing customer using their phone number. Returns the verified record or indicates not found. NEVER invent records.",
      parameters: {
        type: "object",
        properties: {
          phone: {
            type: "string",
            description: "The customer's registered phone number to look up",
          },
        },
        required: ["phone"],
      },
    },
    server: { url: webhookUrl },
  },
  {
    type: "function",
    function: {
      name: "update_customer",
      description: "Updates an existing customer's information in the CallFlow CRM database.",
      parameters: {
        type: "object",
        properties: {
          phone: {
            type: "string",
            description: "The customer's registered phone number",
          },
          customer_id: {
            type: "string",
            description: "The customer's database ID if known",
          },
          full_name: {
            type: "string",
            description: "Updated full name",
          },
          email: {
            type: "string",
            description: "Updated email address",
          },
          company: {
            type: "string",
            description: "Updated company name",
          },
        },
        required: ["phone"],
      },
    },
    server: { url: webhookUrl },
  },
  {
    type: "function",
    function: {
      name: "create_support_ticket",
      description: "Creates and saves a formal support ticket in the CallFlow CRM database. Returns the real generated ticket ID.",
      parameters: {
        type: "object",
        properties: {
          customer_id: {
            type: "string",
            description: "Customer database ID if available",
          },
          phone: {
            type: "string",
            description: "Customer's phone number to associate with the ticket",
          },
          subject: {
            type: "string",
            description: "Short summary of the complaint or issue",
          },
          description: {
            type: "string",
            description: "Detailed description of the customer's problem",
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "urgent"],
            description: "Urgency of the issue",
          },
          status: {
            type: "string",
            enum: ["open", "in-progress", "resolved", "closed"],
            description: "Initial ticket status, default is 'open'",
          },
          category: {
            type: "string",
            enum: ["general", "billing", "technical", "shipping", "returns"],
            description: "Category of the issue",
          },
        },
        required: ["subject", "description"],
      },
    },
    server: { url: webhookUrl },
  },
  {
    type: "function",
    function: {
      name: "lookup_order",
      description: "Safely looks up real tracking and status for an order number. Never invent order details.",
      parameters: {
        type: "object",
        properties: {
          order_id: {
            type: "string",
            description: "The order ID to check (e.g. 1234 or 5678)",
          },
        },
        required: ["order_id"],
      },
    },
    server: { url: webhookUrl },
  },
];

const updatePayload = {
  serverUrl: webhookUrl,
  model: {
    provider: "groq",
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
    ],
    tools: CRM_TOOLS,
  },
};

fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${privateKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(updatePayload),
})
  .then(async (res) => {
    console.log("PATCH Response HTTP Status:", res.status);
    const data = await res.json();
    if (!res.ok) {
      console.error("Vapi update error:", data);
      process.exit(1);
    }
    console.log("✅ Vapi Assistant successfully updated!");
    console.log("   Name:", data.name);
    console.log("   Server URL:", data.serverUrl);
    console.log("   Tools Registered:", data.model?.tools?.map((t) => t.function?.name));
  })
  .catch((err) => {
    console.error("Network error:", err);
    process.exit(1);
  });

