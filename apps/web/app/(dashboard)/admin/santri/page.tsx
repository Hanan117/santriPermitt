"use client";
import * as React from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Santri = { id: string; nis: string; nama: string; kelas?: string; kamar?: string; createdAt?: string };

export default function AdminSantriPage() {
  const [data, setData] = React.useState<Santri[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [editing, setEditing] = React.useState<Santri | null>(null);
  const [form, setForm] = React.useState({ nis: "", nama: "", kelas: "", kamar: "" });
  const [showUser, setShowUser] = React.useState(false);
  const [userForm, setUserForm] = React.useState({ username: "", password: "", role: "SANTRI", santriId: "" });

  const fetchData = React.useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await apiFetch<Santri[] | { data: Santri[] }>("/santri"); setData(Array.isArray(res) ? res : (res as any).data ?? []); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat santri"); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);
  React.useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/santri", { method: "POST", body: JSON.stringify(form) });
      setToast("Santri dibuat"); setShowCreate(false); setForm({ nis: "", nama: "", kelas: "", kamar: "" }); fetchData();
    } catch (err) { setToast(err instanceof Error ? err.message : "Gagal create"); }
  }
  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      await apiFetch(`/santri/${editing.id}`, { method: "PATCH", body: JSON.stringify(form) });
      setToast("Santri diupdate"); setEditing(null); fetchData();
    } catch (err) { setToast(err instanceof Error ? err.message : "Gagal update"); }
  }
  async function handleDelete(id: string) {
    if (!confirm("Hapus santri?")) return;
    try { await apiFetch(`/santri/${id}`, { method: "DELETE" }); setToast("Santri dihapus"); fetchData(); }
    catch (err) { setToast(err instanceof Error ? err.message : "Gagal hapus"); }
  }
  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/users", { method: "POST", body: JSON.stringify(userForm) });
      setToast("User dibuat"); setShowUser(false); setUserForm({ username: "", password: "", role: "SANTRI", santriId: "" });
    } catch (err) { setToast(err instanceof Error ? err.message : "Gagal create user"); }
  }

  function openEdit(s: Santri) { setEditing(s); setForm({ nis: s.nis, nama: s.nama, kelas: s.kelas ?? "", kamar: s.kamar ?? "" }); }

  return (
    <div className="space-y-4">
      {toast && <div className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">{toast}</div>}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Admin - Data Santri</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowUser(true)}>+ User</Button>
            <Button size="sm" onClick={() => { setForm({ nis: "", nama: "", kelas: "", kamar: "" }); setShowCreate(true); }}>+ Santri</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <p>Memuat...</p> : error ? <p className="text-sm text-red-600">{error}</p> : data.length === 0 ? <p className="text-sm text-muted-foreground">Tidak ada data</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left"><th className="p-2">NIS</th><th className="p-2">Nama</th><th className="p-2">Kelas</th><th className="p-2">Kamar</th><th className="p-2">Aksi</th></tr></thead>
                <tbody>
                  {data.map((s) => (
                    <tr key={s.id} className="border-b">
                      <td className="p-2">{s.nis}</td>
                      <td className="p-2">{s.nama}</td>
                      <td className="p-2">{s.kelas ?? "-"}</td>
                      <td className="p-2">{s.kamar ?? "-"}</td>
                      <td className="p-2 flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => openEdit(s)}>Edit</Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(s.id)}>Hapus</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {(showCreate || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setShowCreate(false); setEditing(null); }}>
          <div className="w-full max-w-md rounded-lg bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold">{editing ? "Edit Santri" : "Tambah Santri"}</h3>
            <form onSubmit={editing ? handleUpdate : handleCreate} className="space-y-3">
              <Input placeholder="NIS" value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} required />
              <Input placeholder="Nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
              <Input placeholder="Kelas" value={form.kelas} onChange={(e) => setForm({ ...form, kelas: e.target.value })} />
              <Input placeholder="Kamar" value={form.kamar} onChange={(e) => setForm({ ...form, kamar: e.target.value })} />
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowCreate(false); setEditing(null); }}>Batal</Button>
                <Button type="submit" className="flex-1">{editing ? "Update" : "Simpan"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowUser(false)}>
          <div className="w-full max-w-md rounded-lg bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold">Buat User</h3>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <Input placeholder="Username" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} required />
              <Input placeholder="Password" type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required />
              <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className="flex h-10 w-full rounded-md border px-3 text-sm">
                <option value="SANTRI">SANTRI</option>
                <option value="WALI">WALI</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <Input placeholder="Santri ID (opsional)" value={userForm.santriId} onChange={(e) => setUserForm({ ...userForm, santriId: e.target.value })} />
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowUser(false)}>Batal</Button>
                <Button type="submit" className="flex-1">Buat</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
