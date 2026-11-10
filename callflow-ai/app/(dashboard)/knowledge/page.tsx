"use client";
// app/(dashboard)/knowledge/page.tsx
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
  BookOpen, Plus, Search, Edit2, Trash2, RefreshCw, AlertCircle, ShieldAlert
} from "lucide-react";
import { KnowledgeBase } from "@/types";

export default function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeBase | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "faq",
    tags: "",
    isActive: true,
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeBase | null>(null);

  const fetchKnowledge = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (categoryFilter && categoryFilter !== "all") params.append("category", categoryFilter);

      const res = await fetch(`/api/knowledge?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (e) {
      console.error("Failed to fetch knowledge base:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, [search, categoryFilter]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ title: "", content: "", category: "faq", tags: "", isActive: true });
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (item: KnowledgeBase) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      content: item.content,
      category: item.category,
      tags: item.tags || "",
      isActive: item.isActive,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.title.trim() || !formData.content.trim()) {
      setFormError("Title and Content are required.");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingItem ? `/api/knowledge/${editingItem.id}` : "/api/knowledge";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save entry");

      setModalOpen(false);
      fetchKnowledge();
    } catch (err: any) {
      setFormError(err.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/knowledge/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      fetchKnowledge();
    } catch (err) {
      console.error("Delete entry error:", err);
    }
  };

  return (
    <div className="flex flex-col">
      <Header
        title="Knowledge Base & FAQ"
        description="Company policies, FAQs, and support guidelines consulted by the AI Calling Agent"
      />

      <div className="space-y-6 p-6">
        {/* Architecture Notice */}
        <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs text-foreground">
          <ShieldAlert className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-primary">Zero-Hallucination Verified Knowledge</p>
            <p className="text-muted-foreground mt-0.5">
              Entries saved here are structured database-driven guidelines fed into the AI voice prompt.
              The agent strictly refuses to invent answers when requested information is absent.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search knowledge articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36 h-9 text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="faq">FAQ</SelectItem>
                <SelectItem value="policy">Policy</SelectItem>
                <SelectItem value="instruction">Instruction</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add Article
          </Button>
        </div>

        {/* Knowledge Articles Grid */}
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground">
            <BookOpen className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="font-semibold text-foreground">No knowledge articles found</p>
            <p>Click 'Add Article' above to register your first policy or FAQ.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {items.map((item) => (
              <Card key={item.id} className="border-border/60 bg-card hover:border-border transition-all">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant="outline" className="capitalize text-[10px] mb-1">
                        {item.category}
                      </Badge>
                      <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => handleOpenEdit(item)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.content}
                  </p>

                  {item.tags && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.tags.split(",").map((tag, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-secondary/80 px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono"
                        >
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Article" : "New Knowledge Article"}</DialogTitle>
            <DialogDescription className="text-xs">
              Provide accurate guidelines for customer questions and AI lookup.
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
              <Label className="text-xs">Title *</Label>
              <Input
                required
                placeholder="e.g. Return Policy (30 Days)"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

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
                  <SelectItem value="faq">FAQ</SelectItem>
                  <SelectItem value="policy">Company Policy</SelectItem>
                  <SelectItem value="instruction">Support Instruction</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Content *</Label>
              <Textarea
                required
                rows={5}
                placeholder="Full policy or answer instructions..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tags (comma-separated)</Label>
              <Input
                placeholder="refund, return, policy"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? "Saving..." : editingItem ? "Save Changes" : "Create Article"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete Article</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete article: <strong>{deleteTarget?.title}</strong>?
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

