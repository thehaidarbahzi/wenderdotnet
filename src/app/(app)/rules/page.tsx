"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Plus, Pencil, Trash2, Zap, Eye, Hash, MessageSquareReply, ToggleRight, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Toggle } from "@/components/ui/toggle"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard, StatGrid } from "@/components/dashboard/stat-card"
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

  const stats = useMemo(() => {
    const total = rules.length
    const active = rules.filter((r) => r.enabled).length
    const autoReply = rules.filter((r) => r.actionType === "auto_reply").length
    const listen = total - autoReply
    return { total, active, autoReply, listen }
  }, [rules])

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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Automation · Rules"
        title="Rules"
        description="Atur bagaimana bot mendengarkan chat dan membalas otomatis. Keyword untuk pesan sederhana, regex untuk pola yang lebih fleksibel."
        actions={
          <Button onClick={openAddModal}>
            <Plus className="h-4 w-4" />
            Tambah Rule
          </Button>
        }
      />

      {!loading && rules.length > 0 && (
        <StatGrid>
          <StatCard
            label="Total Rules"
            value={stats.total}
            hint={`${stats.active} aktif · ${stats.total - stats.active} nonaktif`}
            icon={<ShieldCheck className="h-5 w-5" />}
            tone="default"
          />
          <StatCard
            label="Auto Reply"
            value={stats.autoReply}
            hint="Membalas berdasar keyword / regex"
            icon={<MessageSquareReply className="h-5 w-5" />}
            tone="success"
          />
          <StatCard
            label="Listening"
            value={stats.listen}
            hint="Hanya mendengarkan & auto-read"
            icon={<Eye className="h-5 w-5" />}
            tone="info"
          />
        </StatGrid>
      )}

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex gap-3.5">
                <Skeleton className="hidden h-11 w-11 shrink-0 rounded-lg sm:block" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-64" />
                  <Skeleton className="h-8 w-full rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/60 p-1">
          <EmptyState
            title="Belum ada rules"
            description="Buat rule pertama untuk memulai automasi. Mulai dengan Listen untuk memantau grup, atau Auto Reply untuk membalas kata kunci seperti “harga” atau “ready”."
            icon={<Zap className="h-5 w-5" />}
            action={
              <Button onClick={openAddModal}>
                <Plus className="h-4 w-4" />
                Buat Rule Pertama
              </Button>
            }
            className="border-0 bg-transparent"
          />
          <div className="mx-auto mb-8 grid max-w-2xl gap-3 px-6 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface p-3.5">
              <p className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <Eye className="h-3.5 w-3.5 text-info" /> Listen
              </p>
              <p className="mt-1 text-xs leading-relaxed text-text-muted">Pantau chat masuk & tandai terbaca otomatis. Cocok untuk grup promo.</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3.5">
              <p className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <MessageSquareReply className="h-3.5 w-3.5 text-success" /> Auto Reply
              </p>
              <p className="mt-1 text-xs leading-relaxed text-text-muted">Balas otomatis ketika keyword/regex cocok. Bisa difilter group/private.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight text-text-primary">
            Daftar rules <span className="font-normal text-text-muted">· {rules.length} total</span>
          </h2>
          <div className="grid gap-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="group relative rounded-xl border border-border bg-surface p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-1 gap-3.5">
                    <div
                      className={`hidden h-11 w-11 shrink-0 place-items-center rounded-lg border bg-surface-subtle sm:grid ${rule.actionType === "auto_reply" ? "border-success/20 bg-success/10 text-success-strong group-hover:bg-success group-hover:text-white" : "border-info/20 bg-info/10 text-info-strong group-hover:bg-info group-hover:text-white"} transition-colors`}
                    >
                      {rule.actionType === "auto_reply" ? (
                        <MessageSquareReply className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-[15px] font-semibold text-text-primary">{rule.name}</h3>
                        <Badge variant={rule.actionType === "listen" ? "info" : "success"}>
                          {rule.actionType === "listen" ? "Listen" : "Auto Reply"}
                        </Badge>
                        {!rule.enabled && <Badge variant="default">Nonaktif</Badge>}
                        {rule.enabled && rule.autoRead && rule.actionType === "listen" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-surface-subtle px-2 py-0.5 text-xs text-text-muted">
                            <ToggleRight className="h-3 w-3" /> auto-read
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                        {rule.targetType ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-subtle px-2.5 py-1 font-mono text-text-secondary">
                            <Hash className="h-3 w-3" />
                            {rule.targetType}
                            {rule.targetJid ? ` · ${rule.targetJid}` : " · semua JID"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 text-text-muted">Semua chat</span>
                        )}
                        {rule.actionType === "auto_reply" && rule.pattern && (
                          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1">
                            <span className="rounded bg-surface-subtle px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-text-muted">
                              {rule.triggerType}
                            </span>
                            <span className="truncate font-mono text-text-secondary">“{rule.pattern}”</span>
                          </span>
                        )}
                      </div>

                      {rule.actionType === "auto_reply" && rule.reply && (
                        <div className="mt-3 rounded-lg border border-border bg-surface-subtle/70 px-3 py-2.5">
                          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Balasan</p>
                          <p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-text-secondary">
                            {rule.reply}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1 self-stretch border-t border-border pt-3 sm:border-0 sm:pt-0">
                    <Toggle checked={rule.enabled} onChange={() => toggleRule(rule)} />
                    <span className="mx-1 h-4 w-px bg-border" aria-hidden />
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(rule)} aria-label={`Edit ${rule.name}`} className="h-9 w-9 p-0">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm(rule.id)}
                      aria-label={`Hapus ${rule.name}`}
                      className="h-9 w-9 p-0 text-text-muted hover:text-error-strong hover:bg-error/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
        <div className="space-y-5">
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs leading-relaxed text-text-secondary">
            {form.actionType === "auto_reply"
              ? "Auto Reply akan mengirim balasan otomatis ketika pola cocok. Gunakan keyword untuk kata sederhana, regex untuk pola kompleks."
              : "Listen hanya memantau chat dan menandai terbaca. Cocok untuk analitik atau auto-read grup."}
          </div>

          <div className="space-y-2">
            <label htmlFor="rule-name" className="text-sm font-medium text-text-primary">
              Nama Rule <span className="text-error">*</span>
            </label>
            <Input id="rule-name" placeholder="Contoh: Balas harga otomatis" value={form.name} onChange={(e) => updateForm("name", e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="rule-action" className="text-sm font-medium text-text-primary">
                Tipe Aksi
              </label>
              <select
                id="rule-action"
                className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                value={form.actionType}
                onChange={(e) => updateForm("actionType", e.target.value as "listen" | "auto_reply")}
              >
                <option value="listen">Listen</option>
                <option value="auto_reply">Auto Reply</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="rule-target" className="text-sm font-medium text-text-primary">
                Tipe Target
              </label>
              <select
                id="rule-target"
                className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                value={form.targetType}
                onChange={(e) => updateForm("targetType", e.target.value as "group" | "private" | "")}
              >
                <option value="">Semua</option>
                <option value="group">Group</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="rule-target-jid" className="text-sm font-medium text-text-primary">
              Target JID <span className="font-normal text-text-muted">(opsional)</span>
            </label>
            <Input id="rule-target-jid" placeholder="Contoh: 120363xxx@g.us — kosongkan untuk semua" value={form.targetJid} onChange={(e) => updateForm("targetJid", e.target.value)} />
            <p className="text-xs text-text-muted">ID spesifik grup/user. Kosongkan untuk berlaku di semua chat sesuai tipe target.</p>
          </div>

          {form.actionType === "auto_reply" && (
            <>
              <div className="space-y-2">
                <label htmlFor="rule-trigger" className="text-sm font-medium text-text-primary">
                  Tipe Trigger
                </label>
                <select
                  id="rule-trigger"
                  className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  value={form.triggerType}
                  onChange={(e) => updateForm("triggerType", e.target.value as "keyword" | "regex")}
                >
                  <option value="keyword">Keyword</option>
                  <option value="regex">Regex</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="rule-pattern" className="text-sm font-medium text-text-primary">
                  Pola
                </label>
                <Input
                  id="rule-pattern"
                  placeholder={form.triggerType === "keyword" ? "Contoh: harga, ready, stok" : "Contoh: ^halo.*"}
                  value={form.pattern}
                  onChange={(e) => updateForm("pattern", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="rule-reply" className="text-sm font-medium text-text-primary">
                  Balasan
                </label>
                <textarea
                  id="rule-reply"
                  className="min-h-[110px] w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5 text-sm leading-relaxed text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  placeholder="Tulis balasan otomatis..."
                  value={form.reply}
                  onChange={(e) => updateForm("reply", e.target.value)}
                />
              </div>
            </>
          )}

          {form.actionType === "listen" && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-subtle/50 px-3 py-3">
              <div>
                <p className="text-sm font-medium text-text-primary">Auto Read</p>
                <p className="text-xs text-text-muted">Tandai chat sebagai terbaca otomatis</p>
              </div>
              <Toggle checked={form.autoRead} onChange={(checked) => updateForm("autoRead", checked)} />
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-border bg-surface-subtle/50 px-3 py-3">
            <div>
              <p className="text-sm font-medium text-text-primary">Aktif</p>
              <p className="text-xs text-text-muted">Rule langsung berjalan jika aktif</p>
            </div>
            <Toggle checked={form.enabled} onChange={(checked) => updateForm("enabled", checked)} />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setModalOpen(false)
                setEditing(null)
              }}
            >
              Batal
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? "Simpan perubahan" : "Buat rule"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Hapus Rule">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-text-secondary">Apakah kamu yakin ingin menghapus rule ini? Automasi terkait akan berhenti dan tindakan ini tidak dapat dibatalkan.</p>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
