"use client";
// app/(dashboard)/orders/page.tsx
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ShoppingCart, Search, RefreshCw, Eye, Edit2, Package,
  Truck, CheckCircle, XCircle, Clock, AlertCircle,
} from "lucide-react";
import { Order } from "@/types";

function statusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "delivered":  return "text-green-600 border-green-200 bg-green-50";
    case "shipped":    return "text-blue-600 border-blue-200 bg-blue-50";
    case "processing": return "text-indigo-600 border-indigo-200 bg-indigo-50";
    case "confirmed":  return "text-purple-600 border-purple-200 bg-purple-50";
    case "pending":    return "text-yellow-600 border-yellow-200 bg-yellow-50";
    case "cancelled":  return "text-red-600 border-red-200 bg-red-50";
    case "returned":   return "text-orange-600 border-orange-200 bg-orange-50";
    default:           return "text-gray-600 border-gray-200 bg-gray-50";
  }
}

function paymentColor(status: string): string {
  switch (status.toLowerCase()) {
    case "paid":     return "text-green-600 border-green-200 bg-green-50";
    case "unpaid":   return "text-red-600 border-red-200 bg-red-50";
    case "refunded": return "text-orange-600 border-orange-200 bg-orange-50";
    case "partial":  return "text-yellow-600 border-yellow-200 bg-yellow-50";
    default:         return "text-gray-600 border-gray-200 bg-gray-50";
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case "delivered":  return <CheckCircle className="h-3.5 w-3.5" />;
    case "shipped":    return <Truck className="h-3.5 w-3.5" />;
    case "cancelled":  return <XCircle className="h-3.5 w-3.5" />;
    case "pending":    return <Clock className="h-3.5 w-3.5" />;
    default:           return <Package className="h-3.5 w-3.5" />;
  }
}

const ORDER_STATUSES = ["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];
const PAYMENT_STATUSES = ["all", "unpaid", "paid", "refunded", "partial"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({ status: "", paymentStatus: "", trackingNumber: "", carrier: "" });
  const [submitting, setSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (paymentFilter !== "all") params.append("payment", paymentFilter);
      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.ok) setOrders(await res.json());
    } catch (e) {
      console.error("Fetch orders error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [search, statusFilter, paymentFilter]);

  const handleOpenEdit = (order: Order) => {
    setEditOrder(order);
    setEditForm({
      status: order.status,
      paymentStatus: order.paymentStatus,
      trackingNumber: order.trackingNumber || "",
      carrier: order.carrier || "",
    });
    setEditError("");
  };

  const handleUpdateOrder = async () => {
    if (!editOrder) return;
    setSubmitting(true);
    setEditError("");
    try {
      const res = await fetch(`/api/orders/${editOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update order");
      setEditOrder(null);
      fetchOrders();
    } catch (err: any) {
      setEditError(err.message || "Failed to update");
    } finally {
      setSubmitting(false);
    }
  };

  const totalRevenue = orders
    .filter(o => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="flex flex-col">
      <Header
        title="Order Management"
        description="Track, manage and update all customer orders"
      />

      <div className="space-y-6 p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Orders",   value: orders.length,                                               color: "text-foreground" },
            { label: "Active",         value: orders.filter(o => !["delivered","cancelled","returned"].includes(o.status)).length, color: "text-blue-600" },
            { label: "Delivered",      value: orders.filter(o => o.status === "delivered").length,          color: "text-green-600" },
            { label: "Paid Revenue",   value: `$${totalRevenue.toFixed(2)}`,                               color: "text-purple-600" },
          ].map(stat => (
            <Card key={stat.label} className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className={`text-xl font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number, customer, product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map(s => (
                <SelectItem key={s} value={s}>{s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="All Payments" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUSES.map(s => (
                <SelectItem key={s} value={s}>{s === "all" ? "All Payments" : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchOrders} className="gap-1.5 text-xs h-9">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        {/* Orders Table */}
        <Card className="border-border/60 bg-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-xs text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mb-2 text-muted-foreground/50" />
                <p className="font-semibold text-foreground">No orders found</p>
                <p>Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border/60 bg-secondary/30 text-muted-foreground font-medium">
                    <tr>
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Items</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Order Status</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-mono font-semibold text-foreground">{order.orderNumber}</p>
                          {order.trackingNumber && (
                            <p className="text-[10px] text-muted-foreground">Track: {order.trackingNumber}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{order.customer?.fullName || "—"}</p>
                          {order.customer?.phone && (
                            <p className="text-[10px] text-muted-foreground font-mono">{order.customer.phone}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {order.items?.slice(0, 2).map((item, i) => (
                            <p key={i} className="text-muted-foreground">{item.productName} ×{item.quantity}</p>
                          ))}
                          {(order.items?.length || 0) > 2 && (
                            <p className="text-muted-foreground">+{(order.items?.length || 0) - 2} more</p>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">
                          ${order.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`flex w-fit items-center gap-1 ${statusColor(order.status)}`}>
                            <StatusIcon status={order.status} />
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={paymentColor(order.paymentStatus)}>
                            {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => setViewOrder(order)}
                              title="View Order Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenEdit(order)}
                              title="Update Order"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Order Modal */}
      <Dialog open={Boolean(viewOrder)} onOpenChange={() => setViewOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Order {viewOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Full order details and items
            </DialogDescription>
          </DialogHeader>

          {viewOrder && (
            <div className="space-y-4 text-xs">
              {/* Customer & Status */}
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/50 bg-secondary/20 p-3">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-semibold text-foreground">{viewOrder.customer?.fullName || "—"}</p>
                  <p className="font-mono text-muted-foreground">{viewOrder.customer?.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Order Date</p>
                  <p className="font-semibold text-foreground">
                    {new Date(viewOrder.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="outline" className={`mt-1 ${statusColor(viewOrder.status)}`}>
                    {viewOrder.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment</p>
                  <Badge variant="outline" className={`mt-1 ${paymentColor(viewOrder.paymentStatus)}`}>
                    {viewOrder.paymentStatus}
                  </Badge>
                </div>
                {viewOrder.carrier && (
                  <div>
                    <p className="text-muted-foreground">Carrier</p>
                    <p className="font-semibold text-foreground">{viewOrder.carrier}</p>
                  </div>
                )}
                {viewOrder.trackingNumber && (
                  <div>
                    <p className="text-muted-foreground">Tracking #</p>
                    <p className="font-mono font-semibold text-foreground">{viewOrder.trackingNumber}</p>
                  </div>
                )}
                {viewOrder.estimatedDelivery && (
                  <div>
                    <p className="text-muted-foreground">Est. Delivery</p>
                    <p className="font-semibold text-foreground">{new Date(viewOrder.estimatedDelivery).toDateString()}</p>
                  </div>
                )}
                {viewOrder.deliveredAt && (
                  <div>
                    <p className="text-muted-foreground">Delivered On</p>
                    <p className="font-semibold text-green-600">{new Date(viewOrder.deliveredAt).toDateString()}</p>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">Order Items</h4>
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-secondary/30 text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left">Product</th>
                        <th className="px-3 py-2 text-center">Qty</th>
                        <th className="px-3 py-2 text-right">Unit Price</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {viewOrder.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 text-foreground">{item.productName}</td>
                          <td className="px-3 py-2 text-center text-muted-foreground">{item.quantity}</td>
                          <td className="px-3 py-2 text-right text-muted-foreground">${item.unitPrice.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-foreground">${item.totalPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-border bg-secondary/20">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 font-semibold text-foreground text-right">Total</td>
                        <td className="px-3 py-2 font-bold text-foreground text-right">${viewOrder.totalAmount.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Modal */}
      <Dialog open={Boolean(editOrder)} onOpenChange={() => setEditOrder(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Order {editOrder?.orderNumber}</DialogTitle>
            <DialogDescription className="text-xs">
              Update order status, payment and tracking info.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {editError && (
              <div className="flex items-center gap-2 rounded bg-destructive/10 p-2.5 text-xs text-destructive">
                <AlertCircle className="h-4 w-4" />
                {editError}
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Order Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.filter(s => s !== "all").map(s => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Payment Status</Label>
              <Select value={editForm.paymentStatus} onValueChange={(v) => setEditForm({ ...editForm, paymentStatus: v })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.filter(s => s !== "all").map(s => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Carrier</Label>
              <Select value={editForm.carrier} onValueChange={(v) => setEditForm({ ...editForm, carrier: v })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  {["FedEx", "UPS", "USPS", "DHL", "Other"].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tracking Number</Label>
              <Input
                placeholder="e.g. FX-987654321"
                value={editForm.trackingNumber}
                onChange={(e) => setEditForm({ ...editForm, trackingNumber: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setEditOrder(null)}>Cancel</Button>
            <Button size="sm" disabled={submitting} onClick={handleUpdateOrder}>
              {submitting ? "Saving..." : "Update Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
