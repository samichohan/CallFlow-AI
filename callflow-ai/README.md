# 📞 CallFlow AI — Smart Voice Agent & Customer Support CRM

**CallFlow AI** is a production-grade AI Voice Calling Agent and Customer Support CRM. Built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, **Prisma ORM (SQLite/PostgreSQL)**, and **Vapi AI** powered by **Groq LLaMA 3.1 70B**.

---

## 🌟 Key Features

1. **AI Calling Voice Agent**:
   - Web browser demo calling using `@vapi-ai/web`.
   - Real-time speech transcription & live call duration timer.
   - LLM powered by Groq through Vapi for sub-500ms voice latencies.
   - Zero-hallucination guardrails forbidding fabricated order or customer records.

2. **Full CRM & Contact Management**:
   - Complete CRUD operations for customers (name, phone, email, company, status).
   - Drill-down customer profile displaying historic calls and support tickets.
   - Fast filtering by status and instant multi-field search.

3. **Call History & AI Summaries**:
   - Detailed call log including status, duration, full transcripts, and AI-generated summaries.
   - Audio playback support for recorded sessions.
   - Outcome classification: `resolved`, `escalated`, `voicemail`, `no-answer`.

4. **Support Ticket System**:
   - Tickets linked to customers with priority (`low`, `medium`, `high`, `urgent`) and status workflows (`open`, `in-progress`, `resolved`, `closed`).
   - Automated ticket creation directly triggered by the voice agent during live phone calls.

5. **Serverless Vapi Webhook Integration**:
   - Endpoint: `POST /api/webhooks/vapi`
   - Handles `status-update`, `transcript`, `end-of-call-report`, and `tool-calls`.
   - **CRM Server Tools**:
     1. `lookup_customer`: Search customer profile and tickets by phone/email/name.
     2. `create_customer`: Automatically save newly identified callers to the CRM.
     3. `create_support_ticket`: Log follow-up tickets from conversation context.
     4. `lookup_support_ticket`: Find existing ticket status.
     5. `lookup_order`: Safely verify real orders (e.g. #1234, #5678, #9999).

6. **Knowledge Base Management**:
   - Admin CRUD for FAQs, company return policies, and support guides.
   - Factual grounding for the voice assistant.

7. **Interactive SaaS Dashboard**:
   - Dark theme sidebar with responsive navigation.
   - Real KPI cards: Total Customers, Calls, Answer Rate, Avg Duration, Pending Tickets.
   - Activity area chart and status distribution charts powered by Recharts.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons, Recharts
- **Backend**: Next.js Route Handlers (`app/api/*`)
- **Database**: SQLite (local development) via Prisma ORM (ready for PostgreSQL)
- **Voice AI Engine**: Vapi AI Web SDK (`@vapi-ai/web`)
- **LLM Engine**: Groq (`llama-3.1-70b-versatile` via Vapi)

---

## 📁 Project Structure

```
callflow-ai/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx              # App layout with Sidebar
│   │   ├── overview/page.tsx       # SaaS overview dashboard & KPIs
│   │   ├── agent/page.tsx          # AI Calling Agent with Browser Voice
│   │   ├── customers/page.tsx      # Customer CRM CRUD & Profiles
│   │   ├── calls/page.tsx          # Call History, Transcripts & Summaries
│   │   ├── tickets/page.tsx        # Support Ticket Management
│   │   ├── analytics/page.tsx      # Analytics & Distribution Charts
│   │   ├── knowledge/page.tsx      # FAQ & Company Policies
│   │   └── settings/page.tsx       # System Config & Webhook status
│   ├── api/
│   │   ├── stats/route.ts          # Aggregate KPI calculations
│   │   ├── customers/route.ts      # Customer GET / POST
│   │   ├── customers/[id]/route.ts # Customer GET / PUT / DELETE
│   │   ├── calls/route.ts          # Calls GET / POST
│   │   ├── calls/[id]/route.ts     # Calls GET / PUT / DELETE
│   │   ├── tickets/route.ts        # Tickets GET / POST
│   │   ├── tickets/[id]/route.ts   # Tickets GET / PUT / DELETE
│   │   ├── knowledge/route.ts      # Knowledge Base GET / POST
│   │   ├── knowledge/[id]/route.ts # Knowledge Base GET / PUT / DELETE
│   │   └── webhooks/vapi/route.ts  # Vapi Webhook & AI Tool Server
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                         # Reusable UI primitives (Button, Card, Dialog, etc.)
│   ├── layout/                     # Sidebar & Header components
│   └── dashboard/                  # Stats cards, charts, and tables
├── hooks/
│   └── useVapi.ts                  # React Hook managing Vapi browser voice lifecycle
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── utils.ts                    # Utility formatters & styles
│   └── vapi.ts                     # Vapi assistant configuration schema
├── prisma/
│   ├── schema.prisma               # Prisma data models
│   └── seed.ts                     # Realistic demo seed data
├── types/
│   └── index.ts                    # TypeScript definitions
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🚀 Installation & Local Setup

### 1. Navigate into project directory
```bash
cd callflow-ai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_VAPI_PUBLIC_KEY="your_vapi_public_key"
VAPI_PRIVATE_API_KEY="your_vapi_private_key"
VAPI_ASSISTANT_ID="your_vapi_assistant_id"
GROQ_API_KEY="your_groq_api_key"
```

### 4. Setup Prisma Database & Seed Demo Data
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

### 5. Launch Development Server
```bash
npm run dev
```
Open **http://localhost:3000** in your browser.

---

## 🎙️ How to Test a Demo Call

1. Go to the **AI Calling Agent** tab (`/agent`).
2. Ensure you have your microphone enabled in your browser.
3. Click **"Start Demo Call"**.
4. Speak naturally to Alex:
   - *"Hello, can you look up my account? My phone is +12025550101."*
   - *"Can you check the shipping status of order 1234?"*
   - *"I'd like to open a ticket regarding delayed delivery."*
5. Watch the transcript appear in real-time.
6. Click **"End Call"** — the duration, transcript, and AI summary will be automatically recorded to the CRM.

---

## 🔗 Connecting Vapi Webhook (for Production / Inbound calls)

1. Expose your local port using ngrok:
   ```bash
   ngrok http 3000
   ```
2. Copy your forwarding URL (e.g., `https://abc-123.ngrok-free.app`).
3. In your **[Vapi Dashboard](https://dashboard.vapi.ai)**:
   - Navigate to **Assistants** -> your assistant -> **Server URL**.
   - Set the URL to: `https://abc-123.ngrok-free.app/api/webhooks/vapi`.
4. Now, all tool calls, call reports, and live transcripts will securely synchronize to your CallFlow database!

---

## 🛡️ Limitations & Production Readiness

- **SQLite to PostgreSQL**: The Prisma schema is 100% prepared for PostgreSQL. For cloud deployments (Vercel, Railway, Supabase), change `provider = "sqlite"` to `provider = "postgresql"` and update `DATABASE_URL`.
- **Outbound Phone Calling**: Outbound PSTN calling is disabled by default for safety and compliance. It activates only once an approved `VAPI_PHONE_NUMBER_ID` is attached.

