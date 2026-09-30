import { join } from 'path';

/**
 * Direktori upload yang dipakai semua controller + static server.
 * - Lokal/dev default: `<cwd>/public/uploads` (perilaku lama, tidak berubah).
 * - Prod (VPS/Docker): set `UPLOAD_DIR=/data/uploads` + mount volume ke path itu
 *   agar file tidak hilang saat redeploy.
 * - Supabase Storage (nanti): set `STORAGE_DRIVER=supabase` dan ganti implementasi
 *   di sini + controller upload tanpa mengubah kontrak URL yang dikembalikan.
 */
export function resolveUploadDir(): string {
  const override = process.env.UPLOAD_DIR?.trim();
  if (override) return override;
  return join(process.cwd(), 'public', 'uploads');
}
