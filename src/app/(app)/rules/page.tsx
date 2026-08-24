"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Toggle } from "@/components/ui/toggle"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface Rule {
  id: string
  name: string
  actionType: "listen" | "auto_reply"
  targetType: "group" | "private" | ""
  targetJid: string
  triggerType: "keyword" | "regex"
  pattern: string
  reply: string
  autoRead: boolean
  enabled: boolean
  createdAt?: string
}

const emptyForm: Omit<Rule, "id"> = {
  name: "",
  actionType: "listen",
  targetType: "",
  targetJid: "",
  triggerType: "keyword",
  pattern: "",
  reply: "",
  autoRead: true,
  enabled: true,
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Rule | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchRules = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/rules")
      if (!res.ok) throw new Error("Failed to fetch rules")
      const data = await res.json()
      setRules(data)
    } catch {
      toast.error("Gagal memuat rules")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial load; migrate to RSC data loading to satisfy set-state-in-effect
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRules()
  }, [fetchRules])

  const openAddModal = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEditModal = (rule: Rule) => {
    setEditing(rule)
    setForm({
      name: rule.name,
      actionType: rule.actionType,
      targetType: rule.targetType,
      targetJid: rule.targetJid,
      triggerType: rule.triggerType,
      pattern: rule.pattern,
      reply: rule.reply,
      autoRead: rule.autoRead,
      enabled: rule.enabled,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nama rule harus diisi")
      return
    }
    setSaving(true)
    try {
      const url = editing ? `/api/rules/${editing.id}` : "/api/rules"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed to save rule")
      toast.success(editing ? "Rule diperbarui" : "Rule ditambahkan")
      setModalOpen(false)
      setEditing(null)
      setForm(emptyForm)
      fetchRules()
    } catch {
      toast.error("Gagal menyimpan rule")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/rules/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete rule")
      toast.success("Rule dihapus")
      setDeleteConfirm(null)
      fetchRules()
    } catch {
      toast.error("Gagal menghapus rule")
    }
  }

  const toggleRule = async (rule: Rule) => {
    try {
      const res = await fetch(`/api/rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rule, enabled: !rule.enabled }),
      })
      if (!res.ok) throw new Error("Failed to toggle rule")
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r))
      )
    } catch {
      toast.error("Gagal mengubah status rule")
    }
  }

  const updateForm = (key: keyof typeof form, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Rules</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Kelola aturan auto-reply dan listening
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Rule
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-[var(--radius-md)]" />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <EmptyState
          title="Belum ada rules"
          description="Buat rule pertama untuk memulai automasi chat."
        />
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-surface p-4"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary">
                    {rule.name}
                  </span>
                  <Badge
                    variant={
                      rule.actionType === "listen" ? "info" : "success"
                    }
                  >
                    {rule.actionType === "listen" ? "Listen" : "Auto Reply"}
                  </Badge>
                  {!rule.enabled && (
                    <Badge variant="default">Nonaktif</Badge>
                  )}
                </div>
                <p className="text-sm text-text-secondary">
                  {rule.targetType && (
                    <span>
                      Target: {rule.targetType}
                      {rule.targetJid && ` (${rule.targetJid})`}
                      {" · "}
                    </span>
                  )}
                  {rule.actionType === "auto_reply" && (
                    <span>
                      {rule.triggerType}: {rule.pattern}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Toggle
                  checked={rule.enabled}
                  onChange={() => toggleRule(rule)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditModal(rule)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirm(rule.id)}
                >
                  <Trash2 className="h-4 w-4 text-error" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        title={editing ? "Edit Rule" : "Tambah Rule"}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Nama</label>
            <Input
              placeholder="Nama rule"
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Tipe Aksi
            </label>
            <select
              className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              value={form.actionType}
              onChange={(e) =>
                updateForm(
                  "actionType",
                  e.target.value as "listen" | "auto_reply"
                )
              }
            >
              <option value="listen">Listen</option>
              <option value="auto_reply">Auto Reply</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Tipe Target
            </label>
            <select
              className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              value={form.targetType}
              onChange={(e) =>
                updateForm(
                  "targetType",
                  e.target.value as "group" | "private" | ""
                )
              }
            >
              <option value="">Semua</option>
              <option value="group">Group</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Target JID
            </label>
            <Input
              placeholder="Contoh: 120363xxx@g.us"
              value={form.targetJid}
              onChange={(e) => updateForm("targetJid", e.target.value)}
            />
          </div>

          {form.actionType === "auto_reply" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  Tipe Trigger
                </label>
                <select
                  className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  value={form.triggerType}
                  onChange={(e) =>
                    updateForm(
                      "triggerType",
                      e.target.value as "keyword" | "regex"
                    )
                  }
                >
                  <option value="keyword">Keyword</option>
                  <option value="regex">Regex</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  Pola
                </label>
                <Input
                  placeholder={
                    form.triggerType === "keyword"
                      ? "Kata kunci"
                      : "Regular expression"
                  }
                  value={form.pattern}
                  onChange={(e) => updateForm("pattern", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  Balasan
                </label>
                <textarea
                  className="min-h-[100px] w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  placeholder="Tulis balasan..."
                  value={form.reply}
                  onChange={(e) => updateForm("reply", e.target.value)}
                />
              </div>
            </>
          )}

          {form.actionType === "listen" && (
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Auto Read
              </label>
              <Toggle
                checked={form.autoRead}
                onChange={(checked) => updateForm("autoRead", checked)}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-primary">
              Aktif
            </label>
            <Toggle
              checked={form.enabled}
              onChange={(checked) => updateForm("enabled", checked)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setModalOpen(false)
                setEditing(null)
              }}
            >
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Hapus Rule"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Apakah kamu yakin ingin menghapus rule ini? Tindakan ini tidak dapat
            dibatalkan.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
