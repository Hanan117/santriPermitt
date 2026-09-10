"use client";
import * as React from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SkeletonRows } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

type Santri = { id: string; nis: string; nama: string; kelas?: string; kamar?: string; createdAt?: string };

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

  const fetchData = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiFetch<Santri[] | { data: Santri[] }>("/santri");
      setData(Array.isArray(res) ? res : (res.data ?? []));
    }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat santri"); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => { fetchData(); }, 0);
    return () => clearTimeout(t);
  }, [fetchData]);
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

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? "Edit Santri" : "Tambah Santri"}
        footer={null}
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
    </div>
  );
}
