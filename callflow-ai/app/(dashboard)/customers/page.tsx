"use client";
// app/(dashboard)/customers/page.tsx
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, UserPlus, Search, Edit2, Trash2, Phone, Mail, Building, Eye, RefreshCw, AlertCircle
} from "lucide-react";
import { statusColor } from "@/lib/utils";
import { Customer } from "@/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Form Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    company: "",
    status: "active",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Profile Drawer / View Modal
  const [viewCustomer, setViewCustomer] = useState<any | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Delete Confirmation
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/customers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (e) {
      console.error("Fetch customers failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({ fullName: "", phone: "", email: "", company: "", status: "active" });
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      fullName: c.fullName,
      phone: c.phone,
      email: c.email || "",
      company: c.company || "",
      status: c.status,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.fullName.trim() || !formData.phone.trim()) {
      setFormError("Full Name and Phone Number are required.");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : "/api/customers";
      const method = editingCustomer ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save customer");

      setModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      setFormError(err.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/customers/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      fetchCustomers();
    } catch (err) {
      console.error("Delete customer error:", err);
    }
  };

  const handleViewCustomer = async (id: string) => {
    setViewLoading(true);
    try {
      const res = await fetch(`/api/customers/${id}`);
      if (res.ok) {
        const data = await res.json();
        setViewCustomer(data);
      }
    } catch (err) {
      console.error("View customer details error:", err);
    } finally {
      setViewLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <Header
        title="Customer CRM"
        description="Manage customer profiles, contact info, and linked calls & tickets"
      />

      <div className="space-y-6 p-6">
        {/* Actions & Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, email..."
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
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 text-xs">
            <UserPlus className="h-3.5 w-3.5" />
            Add Customer
          </Button>
        </div>

        {/* Customer Table */}
        <Card className="border-border/60 bg-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground">
                <Users className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="font-semibold text-foreground">No customers found</p>
                <p>Try modifying your search or click 'Add Customer' above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border/60 bg-secondary/30 text-muted-foreground font-medium">
                    <tr>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Company</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Calls</th>
                      <th className="px-4 py-3">Orders</th>
                      <th className="px-4 py-3">Tickets</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground">{c.fullName}</p>
                          {c.email && <p className="text-[11px] text-muted-foreground">{c.email}</p>}
                        </td>
                        <td className="px-4 py-3 font-mono">{c.phone}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.company || "—"}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={statusColor(c.status)}>
                            {c.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{c._count?.calls ?? 0}</td>
                        <td className="px-4 py-3 font-semibold">{c._count?.orders ?? 0}</td>
                        <td className="px-4 py-3">{c._count?.supportTickets ?? 0}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => handleViewCustomer(c.id)}
                              title="View Customer Profile"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenEdit(c)}
                              title="Edit Customer"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteTarget(c)}
                              title="Delete Customer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

      {/* Add / Edit Customer Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            <DialogDescription className="text-xs">
              Fill in customer profile details for CRM record tracking.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {formError && (
              <div className="flex items-center gap-2 rounded bg-destructive/10 p-2.5 text-xs text-destructive">
                <AlertCircle className="h-4 w-4" />
                {formError}
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Full Name *</Label>
              <Input
                required
                placeholder="e.g. Sarah Connor"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Phone Number *</Label>
              <Input
                required
                placeholder="+12025550199"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Email Address</Label>
              <Input
                type="email"
                placeholder="sarah@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Company</Label>
              <Input
                placeholder="Acme Corp"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Customer Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? "Saving..." : editingCustomer ? "Save Changes" : "Create Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete Customer</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete <strong>{deleteTarget?.fullName}</strong>?
              This will also unassign associated calls and support tickets.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Customer Details Modal */}
      <Dialog open={Boolean(viewCustomer)} onOpenChange={() => setViewCustomer(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{viewCustomer?.fullName}</span>
              <Badge variant="outline" className={statusColor(viewCustomer?.status)}>
                {viewCustomer?.status}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Customer Profile, Call History, and Support Tickets
            </DialogDescription>
          </DialogHeader>

          {viewCustomer && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/50 bg-secondary/20 p-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-mono">{viewCustomer.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{viewCustomer.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{viewCustomer.company || "No company"}</span>
                </div>
                <div className="text-muted-foreground">
                  Joined: {new Date(viewCustomer.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Linked Calls */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">Previous Calls ({viewCustomer.calls?.length || 0})</h4>
                {viewCustomer.calls?.length === 0 ? (
                  <p className="text-muted-foreground">No call history recorded.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {viewCustomer.calls.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between rounded border border-border/40 p-2">
                        <div>
                          <p className="font-medium text-foreground">{c.summary || "Call completed"}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(c.createdAt).toLocaleString()} • Duration: {c.duration || 0}s
                          </p>
                        </div>
                        <Badge variant="outline" className={statusColor(c.status)}>
                          {c.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Orders */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">Customer Orders ({viewCustomer.orders?.length || 0})</h4>
                {viewCustomer.orders?.length === 0 ? (
                  <p className="text-muted-foreground">No orders recorded for this customer.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {viewCustomer.orders.map((o: any) => (
                      <div key={o.id} className="flex items-center justify-between rounded border border-border/40 p-2">
                        <div>
                          <p className="font-semibold text-foreground font-mono">{o.orderNumber} • ${o.totalAmount.toFixed(2)}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(o.createdAt).toLocaleDateString()} • {o.items?.length || 0} item(s) {o.carrier ? `• ${o.carrier}` : ""} {o.trackingNumber ? `(${o.trackingNumber})` : ""}
                          </p>
                        </div>
                        <Badge variant="outline" className={statusColor(o.status)}>
                          {o.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Tickets */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">Support Tickets ({viewCustomer.supportTickets?.length || 0})</h4>
                {viewCustomer.supportTickets?.length === 0 ? (
                  <p className="text-muted-foreground">No support tickets found.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {viewCustomer.supportTickets.map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between rounded border border-border/40 p-2">
                        <div>
                          <p className="font-medium text-foreground">{t.subject}</p>
                          <p className="text-[10px] text-muted-foreground">{t.category} • Priority: {t.priority}</p>
                        </div>
                        <Badge variant="outline" className={statusColor(t.status)}>
                          {t.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

