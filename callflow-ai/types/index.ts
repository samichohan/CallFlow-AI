// types/index.ts
// Shared TypeScript types for the entire application.

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  company?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count?: { calls: number; supportTickets: number; orders?: number };
  orders?: Order[];
}

export interface Call {
  id: string;
  vapiCallId?: string | null;
  customerId?: string | null;
  phoneNumber?: string | null;
  callType: string;
  status: string;
  duration?: number | null;
  transcript?: string | null;
  summary?: string | null;
  recordingUrl?: string | null;
  outcome?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt: string;
  customer?: Customer | null;
}

export interface SupportTicket {
  id: string;
  customerId?: string | null;
  subject: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer | null;
}

export interface KnowledgeBase {
  id: string;
  title: string;
  content: string;
  category: string;
  tags?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productName: string;
  sku?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  customerId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  currency: string;
  deliveryAddress?: string | null;
  deliveryMethod?: string | null;
  trackingNumber?: string | null;
  carrier?: string | null;
  estimatedDelivery?: string | null;
  deliveredAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; fullName: string; phone: string; email?: string | null } | null;
  items?: OrderItem[];
}

export interface DashboardStats {
  totalCustomers: number;
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  avgCallDuration: number;
  totalTickets: number;
  resolvedTickets: number;
  pendingTickets: number;
}

export interface CallsChartData {
  date: string;
  total: number;
  answered: number;
  missed: number;
}

