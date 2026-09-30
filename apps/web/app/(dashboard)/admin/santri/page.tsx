"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SkeletonRows } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

type Santri = { id: string; nis: string; nama: string; kelas?: string; kamar?: string; createdAt?: string };

type PendingUser = { id: string; username: string; email: string; role: string; santriId?: string | null; createdAt?: string };

type WaliLink = { santriId: string; waliUserId: string; hubungan?: string; santri?: Santri };

const EMPTY_FORM = { nis: "", nama: "", kelas: "", kamar: "" };

export default function AdminSantriPage() {
  const [data, setData] = React.useState<Santri[]>([]);
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [editing, setEditing] = React.useState<Santri | null>(null);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = React.useState(false);
  const [showUser, setShowUser] = React.useState(false);
  const [userForm, setUserForm] = React.useState({ username: "", password: "", role: "SANTRI", santriId: "" });
  const [userLoading, setUserLoading] = React.useState(false);
  const [pending, setPending] = React.useState<PendingUser[]>([]);
  const [allUsers, setAllUsers] = React.useState<PendingUser[]>([]);
  const [waliLinks, setWaliLinks] = React.useState<WaliLink[]>([]);
  const [waliQuery, setWaliQuery] = React.useState("");
  const [waliLoading, setWaliLoading] = React.useState(true);
  const [editWali, setEditWali] = React.useState<PendingUser | null>(null);
  const [editWaliQuery, setEditWaliQuery] = React.useState("");
  const [editWaliLoading, setEditWaliLoading] = React.useState(false);
  const [linkTarget, setLinkTarget] = React.useState<PendingUser | null>(null);
  const [linkQuery, setLinkQuery] = React.useState("");
  const [linkLoading, setLinkLoading] = React.useState(false);
  const [inlineForm, setInlineForm] = React.useState({ nis: "", nama: "", kelas: "", kamar: "" });
  const [inlineLoading, setInlineLoading] = React.useState(false);
  const [linkMounted, setLinkMounted] = React.useState(false);
  React.useEffect(() => { setLinkMounted(true); }, []);

  const fetchData = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiFetch<Santri[] | { data: Santri[] }>("/santri");
      setData(Array.isArray(res) ? res : (res.data ?? []));
    }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat santri"); }
    finally { setLoading(false); }
  }, []);

  const fetchPending = React.useCallback(async () => {
    try {
      const res = await apiFetch<PendingUser[]>("/users");
      const list = Array.isArray(res) ? res : [];
      setAllUsers(list);
      setPending(list.filter((u) => u.role !== "ADMIN" && !u.santriId));
    } catch {
      // admin-only endpoint; abaikan bila gagal
    }
  }, []);

  const fetchWali = React.useCallback(async () => {
    setWaliLoading(true);
    try {
      const res = await apiFetch<WaliLink[]>("/wali");
      setWaliLinks(Array.isArray(res) ? res : []);
    } catch {
      setWaliLinks([]);
    } finally {
      setWaliLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => { fetchData(); fetchPending(); fetchWali(); }, 0);
    return () => clearTimeout(t);
  }, [fetchData, fetchPending, fetchWali]);
  React.useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  const query = q.trim().toLowerCase();
  const shown = query
    ? data.filter((s) =>
        s.nama.toLowerCase().includes(query) ||
        s.nis.toLowerCase().includes(query) ||
        (s.kelas ?? "").toLowerCase().includes(query) ||
        (s.kamar ?? "").toLowerCase().includes(query),
      )
    : data;

  function closeForm() { setShowCreate(false); setEditing(null); setForm(EMPTY_FORM); }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    try {
      await apiFetch("/santri", { method: "POST", body: JSON.stringify(form) });
      setToast("Santri dibuat"); closeForm(); fetchData();
    } catch (err) { setToast(err instanceof Error ? err.message : "Gagal create"); }
    finally { setFormLoading(false); }
  }
  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setFormLoading(true);
    try {
      await apiFetch(`/santri/${editing.id}`, { method: "PATCH", body: JSON.stringify(form) });
      setToast("Santri diupdate"); closeForm(); fetchData();
    } catch (err) { setToast(err instanceof Error ? err.message : "Gagal update"); }
    finally { setFormLoading(false); }
  }
  async function handleDelete(id: string) {
    if (!confirm("Hapus santri?")) return;
    try { await apiFetch(`/santri/${id}`, { method: "DELETE" }); setToast("Santri dihapus"); fetchData(); }
    catch (err) { setToast(err instanceof Error ? err.message : "Gagal hapus"); }
  }
  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setUserLoading(true);
    try {
      await apiFetch("/users", { method: "POST", body: JSON.stringify(userForm) });
      setToast("User dibuat"); setShowUser(false); setUserForm({ username: "", password: "", role: "SANTRI", santriId: "" });
    } catch (err) { setToast(err instanceof Error ? err.message : "Gagal create user"); }
    finally { setUserLoading(false); }
  }

  function openEdit(s: Santri) { setEditing(s); setForm({ nis: s.nis, nama: s.nama, kelas: s.kelas ?? "", kamar: s.kamar ?? "" }); }

  function openLink(u: PendingUser) {
    setLinkTarget(u);
    setLinkQuery("");
    setInlineForm({ nis: u.username, nama: "", kelas: "", kamar: "" });
  }

  function closeLink() {
    setLinkTarget(null);
    setLinkQuery("");
    setInlineForm({ nis: "", nama: "", kelas: "", kamar: "" });
  }

  /** Tautkan pivot wali→santri (hubungan otomatis "Wali"). Return true bila panggilan pivot dilakukan. */
  async function linkWaliPivot(santriId: string): Promise<boolean> {
    if (!linkTarget || linkTarget.role !== "WALI") return false;
    await apiFetch("/wali/link", {
      method: "POST",
      body: JSON.stringify({ santriId, waliUserId: linkTarget.id, hubungan: "Wali" }),
    });
    return true;
  }

  /** Kompensasi opsi A: hapus pivot bila langkah lanjutan gagal, agar tidak ada data setengah. */
  async function rollbackWaliPivot(santriId: string) {
    if (!linkTarget) return;
    try {
      await apiFetch(`/wali/${santriId}/${linkTarget.id}`, { method: "DELETE" });
    } catch {
      // abaikan: admin akan melihat error utama
    }
  }

  async function handleLinkExisting(santriId: string) {
    if (!linkTarget) return;
    setLinkLoading(true);
    let pivotDone = false;
    try {
      pivotDone = await linkWaliPivot(santriId);
      await apiFetch(`/users/${linkTarget.id}/link`, { method: "PATCH", body: JSON.stringify({ santriId }) });
      setToast(`Akun ${linkTarget.username} tertaut`); closeLink(); fetchPending(); fetchWali();
    } catch (err) {
      if (pivotDone) await rollbackWaliPivot(santriId);
      setToast(err instanceof Error ? err.message : "Gagal menautkan");
    }
    finally { setLinkLoading(false); }
  }

  // ── Data Wali Terkait: gabung User.santriId + pivot hubungan ──
  const linkedWali = React.useMemo(() => {
    const pivotByUser = new Map(waliLinks.map((l) => [l.waliUserId, l]));
    return allUsers
      .filter((u) => u.role === "WALI" && u.santriId)
      .map((u) => {
        const santri = data.find((s) => s.id === u.santriId);
        const pivot = pivotByUser.get(u.id);
        return { user: u, santri, hubungan: pivot?.hubungan ?? "Wali" };
      });
  }, [allUsers, data, waliLinks]);

  const waliShown = React.useMemo(() => {
    const qq = waliQuery.trim().toLowerCase();
    if (!qq) return linkedWali;
    return linkedWali.filter(
      (r) =>
        r.user.username.toLowerCase().includes(qq) ||
        r.user.email.toLowerCase().includes(qq) ||
        (r.santri?.nama ?? "").toLowerCase().includes(qq) ||
        (r.santri?.nis ?? "").toLowerCase().includes(qq),
    );
  }, [linkedWali, waliQuery]);

  async function handleUnlinkWali(userId: string, santriId: string, username: string) {
    if (!confirm(`Lepas tautan wali ${username}? Akun tidak dihapus.`)) return;
    try {
      await apiFetch(`/wali/${santriId}/${userId}`, { method: "DELETE" });
      setToast(`Tautan ${username} dilepas`);
      fetchPending();
      fetchWali();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Gagal melepas tautan");
    }
  }

  async function handleEditWaliChoose(santriId: string) {
    if (!editWali) return;
    setEditWaliLoading(true);
    try {
      await apiFetch("/wali/link", {
        method: "POST",
        body: JSON.stringify({ santriId, waliUserId: editWali.id, hubungan: "Wali" }),
      });
      await apiFetch(`/users/${editWali.id}/link`, { method: "PATCH", body: JSON.stringify({ santriId }) });
      // bersihkan pivot lama bila pindah santri
      if (editWali.santriId && editWali.santriId !== santriId) {
        try {
          await apiFetch(`/wali/${editWali.santriId}/${editWali.id}`, { method: "DELETE" });
          // kembalikan pivot baru yang sempat tertimpa oleh DELETE? tidak perlu — POST sudah di atas, tapi
          // bila DELETE lama menghapus yang baru (id sama tidak mungkin karena santriId beda), aman.
        } catch { /* abaikan */ }
      }
      setToast(`Wali ${editWali.username} dipindah tautan`);
      setEditWali(null);
      setEditWaliQuery("");
      fetchPending();
      fetchWali();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Gagal memindah tautan");
    } finally {
      setEditWaliLoading(false);
    }
  }

  const editWaliShown = editWaliQuery.trim().toLowerCase()
    ? data.filter((s) =>
        s.nama.toLowerCase().includes(editWaliQuery.trim().toLowerCase()) ||
        s.nis.toLowerCase().includes(editWaliQuery.trim().toLowerCase()),
      )
    : data;

  const linkShown = linkQuery.trim().toLowerCase()
    ? data.filter((s) =>
        s.nama.toLowerCase().includes(linkQuery.trim().toLowerCase()) ||
        s.nis.toLowerCase().includes(linkQuery.trim().toLowerCase()),
      )
    : data;

  const isSantriLink = linkTarget?.role === "SANTRI";
  const autoSantri = React.useMemo(() => {
    if (!linkTarget || linkTarget.role !== "SANTRI") return null;
    const byNis = data.find((s) => s.nis.toLowerCase() === linkTarget.username.toLowerCase());
    return byNis ?? null;
  }, [linkTarget, data]);

  async function handleLinkSantriAuto() {
    if (!linkTarget || !autoSantri) return;
    setLinkLoading(true);
    try {
      await apiFetch(`/users/${linkTarget.id}/link`, { method: "PATCH", body: JSON.stringify({ santriId: autoSantri.id }) });
      setToast(`Akun ${linkTarget.username} tertaut ke ${autoSantri.nama}`);
      closeLink();
      fetchPending();
      fetchWali();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Gagal menautkan");
    } finally {
      setLinkLoading(false);
    }
  }

  async function handleInlineCreateAndLink(e: React.FormEvent) {
    e.preventDefault();
    if (!linkTarget) return;
    if (!inlineForm.nis.trim()) {
      setToast("NIS wajib diisi");
      return;
    }
    if (!inlineForm.nama.trim()) {
      setToast("Nama wajib diisi");
      return;
    }
    setInlineLoading(true);
    try {
      const created = await apiFetch<Santri>("/santri", {
        method: "POST",
        body: JSON.stringify({ nis: inlineForm.nis.trim(), nama: inlineForm.nama.trim(), kelas: inlineForm.kelas.trim(), kamar: inlineForm.kamar.trim() }),
      });
      const newId = (created as unknown as { id: string })?.id ?? (created as unknown as { data: { id: string } })?.data?.id;
      const santriId = newId ?? (created as unknown as string);
      // fallback: refresh data and find by NIS if id not returned directly
      let targetId: string | null = typeof santriId === "string" ? santriId : null;
      if (!targetId) {
        // fetch latest and resolve by NIS
        const res = await apiFetch<Santri[] | { data: Santri[] }>("/santri");
        const list = Array.isArray(res) ? res : (res.data ?? []);
        targetId = list.find((s) => s.nis === inlineForm.nis.trim())?.id ?? null;
      }
      if (!targetId) throw new Error("Gagal mendapatkan ID santri baru");
      await apiFetch(`/users/${linkTarget.id}/link`, { method: "PATCH", body: JSON.stringify({ santriId: targetId }) });
      setToast(`Santri ${inlineForm.nama} dibuat & akun ${linkTarget.username} tertaut`);
      closeLink();
      fetchData();
      fetchPending();
      fetchWali();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Gagal buat & tautkan");
    } finally {
      setInlineLoading(false);
    }
  }

  const formOpen = showCreate || editing !== null;

  return (
    <div className="space-y-4">
      {toast && <div className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-card animate-fade-up">{toast}</div>}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle>Admin - Data Santri</CardTitle>
            <Badge variant="info">{data.length} santri</Badge>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowUser(true)}>+ User</Button>
            <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setShowCreate(true); }}>+ Santri</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="sticky top-14 z-10 -mx-1 mb-4 bg-card/95 px-1 py-2 backdrop-blur">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama, NIS, kelas, kamar..."
              className="sm:max-w-xs"
              aria-label="Cari santri"
            />
          </div>
          {loading ? <SkeletonRows rows={6} /> : error ? (
            <EmptyState icon="⚠" title="Gagal memuat data" description={error} action={<Button size="sm" onClick={fetchData}>Coba lagi</Button>} />
          ) : shown.length === 0 ? (
            <EmptyState
              icon="🎓"
              title={query ? "Tidak ada hasil" : "Belum ada santri"}
              description={query ? `Tidak ada santri yang cocok dengan "${q}".` : "Tambahkan santri pertama lewat tombol + Santri."}
              action={!query ? <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setShowCreate(true); }}>+ Santri</Button> : undefined}
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/60 text-left">
                    <th className="p-2.5 font-semibold">NIS</th>
                    <th className="p-2.5 font-semibold">Nama</th>
                    <th className="p-2.5 font-semibold">Kelas</th>
                    <th className="p-2.5 font-semibold">Kamar</th>
                    <th className="p-2.5 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((s) => (
                    <tr key={s.id} className="border-b border-border transition-colors last:border-0 hover:bg-card-hover">
                      <td className="p-2.5 font-medium tabular-nums">{s.nis}</td>
                      <td className="p-2.5">{s.nama}</td>
                      <td className="p-2.5">{s.kelas ?? "-"}</td>
                      <td className="p-2.5">{s.kamar ?? "-"}</td>
                      <td className="p-2.5">
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => openEdit(s)}>Edit</Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(s.id)}>Hapus</Button>
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle>Data Wali Terkait</CardTitle>
            <Badge variant="info">{linkedWali.length} wali</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="sticky top-14 z-10 -mx-1 mb-4 bg-card/95 px-1 py-2 backdrop-blur">
            <Input
              value={waliQuery}
              onChange={(e) => setWaliQuery(e.target.value)}
              placeholder="Cari wali, santri, NIS..."
              className="sm:max-w-xs"
              aria-label="Cari wali"
            />
          </div>
          {waliLoading ? <SkeletonRows rows={4} /> : waliShown.length === 0 ? (
            <EmptyState
              icon="👪"
              title={waliQuery ? "Tidak ada hasil" : "Belum ada wali tertaut"}
              description={waliQuery ? `Tidak ada wali yang cocok dengan "${waliQuery}".` : "Tautkan akun WALI dari bagian Akun menunggu tautan."}
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/60 text-left">
                    <th className="p-2.5 font-semibold">Username</th>
                    <th className="p-2.5 font-semibold">Email</th>
                    <th className="p-2.5 font-semibold">Santri Terkait</th>
                    <th className="p-2.5 font-semibold">Hubungan</th>
                    <th className="p-2.5 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {waliShown.map((r) => (
                    <tr key={r.user.id} className="border-b border-border transition-colors last:border-0 hover:bg-card-hover">
                      <td className="p-2.5 font-medium">{r.user.username}</td>
                      <td className="p-2.5 max-w-48 truncate text-muted-foreground">{r.user.email}</td>
                      <td className="p-2.5">
                        {r.santri ? (
                          <span>{r.santri.nama} <span className="text-muted-foreground tabular-nums">({r.santri.nis})</span></span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-2.5">
                        <Badge variant="info">{r.hubungan}</Badge>
                      </td>
                      <td className="p-2.5">
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => { setEditWali(r.user); setEditWaliQuery(""); }}>Edit</Button>
                          <Button size="sm" variant="outline" onClick={() => r.user.santriId && handleUnlinkWali(r.user.id, r.user.santriId, r.user.username)}>Hapus</Button>
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle>Akun menunggu tautan</CardTitle>
            <Badge variant={pending.length > 0 ? "warning" : "success"} dot>{pending.length} menunggu</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <EmptyState icon="✓" title="Semua akun tertaut" description="Tidak ada pendaftar yang menunggu verifikasi." />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/60 text-left">
                    <th className="p-2.5 font-semibold">Username</th>
                    <th className="p-2.5 font-semibold">Email</th>
                    <th className="p-2.5 font-semibold">Role</th>
                    <th className="p-2.5 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((u) => (
                    <tr key={u.id} className="border-b border-border transition-colors last:border-0 hover:bg-card-hover">
                      <td className="p-2.5 font-medium">{u.username}</td>
                      <td className="p-2.5 max-w-48 truncate text-muted-foreground">{u.email}</td>
                      <td className="p-2.5">
                        <Badge variant={u.role === "WALI" ? "info" : "default"}>{u.role}</Badge>
                      </td>
                      <td className="p-2.5">
                        <Button size="sm" onClick={() => openLink(u)}>
                          Tautkan
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {linkMounted
        ? createPortal(
            <>
              <Modal
                open={formOpen}
                onClose={closeForm}
                title={editing ? "Edit Santri" : "Tambah Santri"}        footer={null}
              >
                <form onSubmit={editing ? handleUpdate : handleCreate} className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input placeholder="NIS" value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} required aria-label="NIS" />
                    <Input placeholder="Nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required aria-label="Nama" />
                    <Input placeholder="Kelas" value={form.kelas} onChange={(e) => setForm({ ...form, kelas: e.target.value })} aria-label="Kelas" />
                    <Input placeholder="Kamar" value={form.kamar} onChange={(e) => setForm({ ...form, kamar: e.target.value })} aria-label="Kamar" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button type="button" variant="outline" className="flex-1" onClick={closeForm}>Batal</Button>
                    <Button type="submit" className="flex-1" loading={formLoading}>{editing ? "Update" : "Simpan"}</Button>
                  </div>
                </form>
              </Modal>

              <Modal
                open={showUser}
                onClose={() => setShowUser(false)}
                title="Buat User"
                description="Buat akun login yang terhubung ke santri."
                footer={null}
              >
                <form onSubmit={handleCreateUser} className="space-y-3">
                  <Input placeholder="Username" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} required aria-label="Username" />
                  <Input placeholder="Password" type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required aria-label="Password" />
                  <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm" aria-label="Role">
                    <option value="SANTRI">SANTRI</option>
                    <option value="WALI">WALI</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <Input placeholder="Santri ID (opsional)" value={userForm.santriId} onChange={(e) => setUserForm({ ...userForm, santriId: e.target.value })} aria-label="Santri ID" />
                  <div className="flex gap-2 pt-1">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowUser(false)}>Batal</Button>
                    <Button type="submit" className="flex-1" loading={userLoading}>Buat</Button>
                  </div>
                </form>
              </Modal>

              <Modal
                open={editWali !== null}
                onClose={() => { setEditWali(null); setEditWaliQuery(""); }}
                title={editWali ? `Edit wali ${editWali.username}` : "Edit wali"}
                description="Pindah tautan wali ke santri lain."
                footer={null}
                className="m-auto max-w-sm p-5 max-h-[calc(100vh-2rem)] overflow-y-auto"
              >
                <div className="space-y-2">
                  <Input
                    value={editWaliQuery}
                    onChange={(e) => setEditWaliQuery(e.target.value)}
                    placeholder="Cari nama atau NIS..."
                    aria-label="Cari santri untuk wali"
                  />
                  <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
                    {editWaliShown.length === 0 ? (
                      <p className="py-2 text-center text-sm text-muted-foreground">Tidak ada santri yang cocok.</p>
                    ) : (
                      editWaliShown.slice(0, 8).map((s) => (
                        <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{s.nama}</p>
                            <p className="truncate text-xs text-muted-foreground tabular-nums">{s.nis}{s.kelas ? ` • ${s.kelas}` : ""}</p>
                          </div>
                          <Button size="sm" variant="outline" loading={editWaliLoading} onClick={() => handleEditWaliChoose(s.id)}>
                            Pilih
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Modal>

              <Modal
              open={linkTarget !== null}
              onClose={closeLink}
              title={linkTarget ? `Tautkan ${linkTarget.username} (${linkTarget.role})` : "Tautkan akun"}
              description={
                isSantriLink
                  ? "Akun santri akan otomatis tertaut ke data santri berikut."
                  : "Pilih santri untuk akun ini. Hubungan otomatis tercatat sebagai Wali."
              }
              footer={null}
              className="m-auto max-w-sm p-5 max-h-[calc(100vh-2rem)] overflow-y-auto [&>h3]:text-center [&>p]:text-center"
            >
        {isSantriLink ? (
          <div className="space-y-4">
            {autoSantri ? (
              <>
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-center text-sm font-semibold">{autoSantri.nama}</p>
                  <dl className="mt-3 grid grid-cols-[90px_1fr] gap-x-2 gap-y-1.5 text-sm">
                    <dt className="text-muted-foreground">NIS</dt>
                    <dd className="font-medium tabular-nums">{autoSantri.nis}</dd>
                    <dt className="text-muted-foreground">Username</dt>
                    <dd className="font-medium">{linkTarget?.username}</dd>
                    <dt className="text-muted-foreground">Kelas</dt>
                    <dd>{autoSantri.kelas ?? "-"}</dd>
                    <dt className="text-muted-foreground">Kamar</dt>
                    <dd>{autoSantri.kamar ?? "-"}</dd>
                  </dl>
                </div>
                <Button className="w-full" loading={linkLoading} onClick={handleLinkSantriAuto}>
                  Tautkan Otomatis
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-dashed border-border p-3 text-center">
                  <p className="text-sm font-medium">Data santri tidak ditemukan</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    NIS <span className="font-medium tabular-nums">{linkTarget?.username}</span> belum ada — buat langsung di sini:
                  </p>
                </div>
                <form onSubmit={handleInlineCreateAndLink} className="space-y-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">NIS *</label>
                    <Input value={inlineForm.nis} onChange={(e) => setInlineForm({ ...inlineForm, nis: e.target.value })} placeholder="NIS" required aria-label="NIS inline" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Nama *</label>
                    <Input value={inlineForm.nama} onChange={(e) => setInlineForm({ ...inlineForm, nama: e.target.value })} placeholder="Nama santri" required aria-label="Nama santri inline" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Kelas</label>
                      <Input value={inlineForm.kelas} onChange={(e) => setInlineForm({ ...inlineForm, kelas: e.target.value })} placeholder="Kelas" aria-label="Kelas inline" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Kamar</label>
                      <Input value={inlineForm.kamar} onChange={(e) => setInlineForm({ ...inlineForm, kamar: e.target.value })} placeholder="Kamar" aria-label="Kamar inline" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" loading={inlineLoading}>
                    Buat & Tautkan Otomatis
                  </Button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <section className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground text-center">Pilih santri yang sudah ada</h4>
              <Input
                value={linkQuery}
                onChange={(e) => setLinkQuery(e.target.value)}
                placeholder="Cari nama atau NIS..."
                aria-label="Cari santri untuk ditautkan"
              />
              <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                {linkShown.length === 0 ? (
                  <p className="py-2 text-center text-sm text-muted-foreground">Tidak ada santri yang cocok.</p>
                ) : (
                  linkShown.slice(0, 8).map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{s.nama}</p>
                        <p className="truncate text-xs text-muted-foreground tabular-nums">{s.nis}{s.kelas ? ` • ${s.kelas}` : ""}</p>
                      </div>
                      <Button size="sm" variant="outline" loading={linkLoading} onClick={() => handleLinkExisting(s.id)}>
                        Pilih
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
            </Modal>
            </>,
            document.body
          )
        : null}
    </div>
  );
}
