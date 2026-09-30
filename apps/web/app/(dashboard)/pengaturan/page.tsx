"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getTheme, setTheme } from "@/lib/theme";
import { clearToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export default function PengaturanPage() {
  const router = useRouter();
  const [theme, setThemeState] = React.useState<"light" | "dark">("light");
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  const [user, setUser] = React.useState<{ id?: string; username?: string; email?: string; role?: string; phone?: string; avatar?: string; santriId?: string | null } | null>(null);
  const [phone, setPhone] = React.useState("");
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [santriInfo, setSantriInfo] = React.useState<{ nama?: string; nis?: string; kelas?: string; kamar?: string } | null>(null);
  // password
  const [pwOld, setPwOld] = React.useState("");
  const [pwNew, setPwNew] = React.useState("");
  const [pwConfirm, setPwConfirm] = React.useState("");
  const [savingPw, setSavingPw] = React.useState(false);
  const [pwMessage, setPwMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  // delete account
  const [showDelete, setShowDelete] = React.useState(false);
  const [deletePwd, setDeletePwd] = React.useState("");
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const t = getTheme();
    setThemeState(t);
    // fetch me + full user detail
    apiFetch<{ id: string; username?: string; email?: string; role?: string; santriId?: string | null }>("/auth/me")
      .then(async (me) => {
        // try to get full user with phone/avatar
        try {
          const full = await apiFetch<{ username?: string; email?: string; role?: string; phone?: string; avatar?: string; santriId?: string | null }>(`/users/${me.id}`);
          setUser({ id: me.id, ...full, role: me.role ?? full.role });
          setPhone(full.phone ?? "");
          if (full.avatar) setAvatarPreview(full.avatar);
          // fetch santri info if linked
          const sid = full.santriId ?? me.santriId;
          if (sid) {
            try {
              const s = await apiFetch<{ nama?: string; nis?: string; kelas?: string; kamar?: string }>(`/santri/${sid}`);
              setSantriInfo(s);
            } catch { /* ignore */ }
          }
        } catch {
          setUser(me);
        }
      })
      .catch(() => {});
  }, []);

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    setThemeState(newTheme);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const formData = new FormData(e.currentTarget);
      const payload: any = {
        email: formData.get("email"),
        phone: phone,
      };
      await apiFetch("/users/me", { method: "PATCH", body: JSON.stringify(payload) });
      setMessage({ type: "success", text: "Pengaturan disimpan" });
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message ?? "Gagal menyimpan" });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowed.includes(f.type)) {
      setMessage({ type: "error", text: "Hanya JPG, PNG, atau WEBP yang diperbolehkan" });
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Ukuran foto maksimal 2MB" });
      return;
    }
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
    setMessage(null);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", avatarFile);
      const res = await apiFetch<{ avatar: string }>("/users/me/avatar", { method: "POST", body: fd });
      setAvatarPreview(res.avatar);
      setUser((prev) => (prev ? { ...prev, avatar: res.avatar } : prev));
      setAvatarFile(null);
      setMessage({ type: "success", text: "Foto profil berhasil diperbarui" });
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message ?? "Gagal mengunggah foto" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage(null);
    if (!pwOld || !pwNew || !pwConfirm) {
      setPwMessage({ type: "error", text: "Lengkapi semua field password" });
      return;
    }
    if (pwNew.length < 6) {
      setPwMessage({ type: "error", text: "Password baru minimal 6 karakter" });
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwMessage({ type: "error", text: "Konfirmasi password tidak cocok" });
      return;
    }
    setSavingPw(true);
    try {
      await apiFetch("/auth/change-password", { method: "POST", body: JSON.stringify({ oldPassword: pwOld, newPassword: pwNew }) });
      setPwMessage({ type: "success", text: "Password berhasil diubah" });
      setPwOld(""); setPwNew(""); setPwConfirm("");
    } catch (err: any) {
      setPwMessage({ type: "error", text: err?.message ?? "Gagal mengubah password" });
    } finally {
      setSavingPw(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);
    if (!deletePwd) {
      setDeleteError("Password wajib diisi");
      return;
    }
    setDeleteLoading(true);
    try {
      await apiFetch("/users/me", { method: "DELETE", body: JSON.stringify({ password: deletePwd }) });
      clearToken();
      setShowDelete(false);
      router.push("/login?deleted=1");
    } catch (err: any) {
      setDeleteError(err?.message ?? "Gagal menghapus akun");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground mt-1">Kelola akun dan preferensi tampilan</p>
      </div>

      {message && (
        <div
          className={cn(
            "rounded-lg p-4 text-sm",
            message.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          )}
          role="alert"
        >
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profil Akun</CardTitle>
          <CardDescription>Informasi akun Anda — kelola foto, kontak, dan keamanan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/20 p-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border bg-brand-gradient flex items-center justify-center text-white font-bold text-lg">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                initials(user?.username)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{user?.username ?? "-"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.role ?? ""} {santriInfo?.nama ? `• ${santriInfo.nama}` : ""}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
                  Pilih Foto
                </label>
                {avatarFile && (
                  <Button type="button" size="sm" disabled={uploadingAvatar} onClick={handleAvatarUpload}>
                    {uploadingAvatar ? "Mengunggah..." : "Simpan Foto"}
                  </Button>
                )}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">JPG/PNG/WEBP, maks 2MB</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium">Username</label>
              <Input id="username" name="username" defaultValue={user?.username ?? ""} disabled />
              <p className="text-xs text-muted-foreground">Username tidak dapat diubah</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">Email</label>
              <Input id="email" name="email" type="email" defaultValue={user?.email ?? ""} />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium">No. WhatsApp</label>
              <Input id="phone" name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
              <p className="text-xs text-muted-foreground">Untuk notifikasi status izin (opsional)</p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Role</label>
              <Input value={user?.role ?? ""} disabled />
            </div>
            {santriInfo && (
              <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
                <p className="font-medium text-xs text-muted-foreground mb-1">Info Santri Terkait</p>
                <p className="font-semibold">{santriInfo.nama} <span className="font-normal text-muted-foreground">• {santriInfo.nis}</span></p>
                <p className="text-xs text-muted-foreground">{santriInfo.kelas} • Kamar {santriInfo.kamar}</p>
              </div>
            )}
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </form>

          {/* Ganti Password collapsible */}
          <details className="rounded-xl border border-border bg-card">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium flex items-center justify-between select-none">
              <span>Ganti Password</span>
              <span className="text-xs text-muted-foreground">Klik untuk buka</span>
            </summary>
            <div className="border-t border-border p-4 space-y-3">
              {pwMessage && (
                <div className={cn("rounded-lg p-3 text-xs", pwMessage.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300")} role="alert">
                  {pwMessage.text}
                </div>
              )}
              <form onSubmit={handlePasswordChange} className="space-y-3">
                <div className="space-y-2">
                  <label className="block text-xs font-medium">Password Lama</label>
                  <Input type="password" value={pwOld} onChange={(e) => setPwOld(e.target.value)} placeholder="••••••" />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium">Password Baru</label>
                  <Input type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} placeholder="Minimal 6 karakter" />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium">Konfirmasi Password Baru</label>
                  <Input type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} placeholder="Ulangi password baru" />
                </div>
                <Button type="submit" disabled={savingPw} size="sm" className="w-full sm:w-auto">
                  {savingPw ? "Menyimpan..." : "Update Password"}
                </Button>
              </form>
            </div>
          </details>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tampilan</CardTitle>
          <CardDescription>Pengaturan tema aplikasi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Mode Tema</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => handleThemeChange("light")}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors",
                  theme === "light"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                )}
              >
                <span className="h-5 w-5">☀️</span> Siang
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange("dark")}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors",
                  theme === "dark"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                )}
              >
                <span className="h-5 w-5">🌙</span> Malam
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Zona Bahaya</CardTitle>
          <CardDescription>Tindakan permanen — hapus akun beserta data terkait</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Akun akan dihapus permanen. Data santri tetap disimpan sebagai arsip. Notifikasi dan tautan wali akan ikut terhapus.</p>
          <Button variant="danger" onClick={() => { setDeletePwd(""); setDeleteError(null); setShowDelete(true); }}>
            Hapus Akun
          </Button>
        </CardContent>
      </Card>

      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Hapus Akun Permanen?"
        description="Masukkan password untuk konfirmasi. Tindakan tidak dapat dibatalkan."
        footer={null}
      >
        <form onSubmit={handleDeleteAccount} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Password</label>
            <Input type="password" value={deletePwd} onChange={(e) => setDeletePwd(e.target.value)} placeholder="Password akun" required aria-label="Password konfirmasi hapus akun" />
          </div>
          {deleteError && <p className="text-sm text-red-600 dark:text-red-400" role="alert">{deleteError}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowDelete(false)}>Batal</Button>
            <Button type="submit" variant="danger" className="flex-1" loading={deleteLoading}>Hapus Permanen</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
