"use client";
// app/(dashboard)/tickets/page.tsx
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Ticket, Plus, Search, Edit2, Trash2, RefreshCw, AlertCircle, CheckCircle, Clock
} from "lucide-react";
import { statusColor } from "@/lib/utils";
import { SupportTicket, Customer } from "@/types";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Modal Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<SupportTicket | null>(null);
  const [formData, setFormData] = useState({
    customerId: "",
    subject: "",
    description: "",
    priority: "medium",
    status: "open",
    category: "general",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<SupportTicket | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter && priorityFilter !== "all") params.append("priority", priorityFilter);

      const res = await fetch(`/api/tickets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (e) {
      console.error("Failed to fetch tickets:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersList = async () => {
    try {
      const res = await fetch("/api/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchTickets();
    fetchCustomersList();
  }, [search, statusFilter, priorityFilter]);

  const handleOpenAdd = () => {
    setEditingTicket(null);
    setFormData({
      customerId: "",
      subject: "",
      description: "",
      priority: "medium",
      status: "open",
      category: "general",
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (t: SupportTicket) => {
    setEditingTicket(t);
    setFormData({
      customerId: t.customerId || "",
      subject: t.subject,
      description: t.description,
      priority: t.priority,
      status: t.status,
      category: t.category,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.subject.trim() || !formData.description.trim()) {
      setFormError("Subject and Description are required.");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingTicket ? `/api/tickets/${editingTicket.id}` : "/api/tickets";
      const method = editingTicket ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save ticket");

      setModalOpen(false);
      fetchTickets();
    } catch (err: any) {
      setFormError(err.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/tickets/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      fetchTickets();
    } catch (err) {
      console.error("Delete ticket error:", err);
    }
  };

  return (
    <div className="flex flex-col">
      <Header
        title="Support Ticket System"
        description="Track, prioritize, and resolve customer issues created manually or via AI assistant"
      />

      <div className="space-y-6 p-6">
        {/* Actions & Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3 max-w-2xl">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subject, description, customer..."
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
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-36 h-9 text-xs">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 text-xs self-start sm:self-auto">
            <Plus className="h-3.5 w-3.5" />
            Create Ticket
          </Button>
        </div>

        {/* Tickets Table */}
        <Card className="border-border/60 bg-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground">
                <Ticket className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="font-semibold text-foreground">No support tickets found</p>
                <p>Click 'Create Ticket' to open a new case.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border/60 bg-secondary/30 text-muted-foreground font-medium">
                    <tr>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {tickets.map((t) => (
                      <tr key={t.id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-4 py-3 max-w-[280px]">
                          <p className="font-semibold text-foreground">{t.subject}</p>
                          <p className="truncate text-muted-foreground text-[11px]">{t.description}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{t.customer?.fullName || "Guest Customer"}</p>
                          {t.customer?.phone && (
                            <p className="font-mono text-[10px] text-muted-foreground">{t.customer.phone}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 capitalize text-muted-foreground">{t.category}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={statusColor(t.priority)}>
                            {t.priority}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={statusColor(t.status)}>
                            {t.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(t.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenEdit(t)}
                              title="Edit Ticket"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteTarget(t)}
                              title="Delete Ticket"
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

      {/* Add / Edit Ticket Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTicket ? "Update Support Ticket" : "New Support Ticket"}</DialogTitle>
            <DialogDescription className="text-xs">
              Fill in ticket details and assign customer relationship.
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
              <Label className="text-xs">Linked Customer (Optional)</Label>
              <Select
                value={formData.customerId || "none"}
                onValueChange={(val) => setFormData({ ...formData, customerId: val === "none" ? "" : val })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No customer linked</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.fullName} ({c.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Subject *</Label>
              <Input
                required
                placeholder="e.g. Delayed package delivery"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Description *</Label>
              <Textarea
                required
                rows={3}
                placeholder="Details of the issue..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="shipping">Shipping</SelectItem>
                    <SelectItem value="returns">Returns</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(val) => setFormData({ ...formData, priority: val })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? "Saving..." : editingTicket ? "Save Changes" : "Create Ticket"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete Ticket</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete ticket: <strong>{deleteTarget?.subject}</strong>?
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
    </div>
  );
}

