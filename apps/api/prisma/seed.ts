import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { email: 'admin@santripermit.id', username: 'admin', password: hash, role: Role.ADMIN },
  });
  const santri = await prisma.santri.upsert({
    where: { nis: 'SANTRI001' },
    update: {},
    create: { nis: 'SANTRI001', nama: 'Ahmad Santri', kelas: 'XII-A', kamar: 'A-101', noHp: '08123456789' },
  });
  await prisma.user.upsert({
    where: { username: 'santri1' },
    // Repair link on re-seed: rows created before the link existed keep santriId null otherwise
    update: { santriId: santri.id },
    create: { email: 'santri1@test.id', username: 'santri1', password: await bcrypt.hash('santri123',10), role: Role.SANTRI, santriId: santri.id },
  });
  const wali = await prisma.user.upsert({
    where: { username: 'wali1' },
    // Repair link on re-seed: rows created before the link existed keep santriId null otherwise
    update: { santriId: santri.id },
    create: { email: 'wali1@test.id', username: 'wali1', password: await bcrypt.hash('wali123',10), role: Role.WALI, santriId: santri.id },
  });
  // Pivot link powers GET /wali/anak-saya — seed it so the demo wali page is not empty
  await (prisma as any).waliSantri.upsert({
    where: { santriId_waliUserId: { santriId: santri.id, waliUserId: wali.id } },
    update: { hubungan: 'Wali' },
    create: { santriId: santri.id, waliUserId: wali.id, hubungan: 'Wali' },
  });

  const defaultRules = [
    { key: 'default_return_time', value: '17:00', description: 'Batas waktu default kembali untuk izin keluar sementara' },
    { key: 'max_duration_days', value: '3', description: 'Durasi maksimal izin pulang (hari)' },
    { key: 'monthly_quota', value: '6', description: 'Kuota izin per santri per bulan' },
    { key: 'late_fee', value: '5000', description: 'Denda keterlambatan per jam (Rp)' },
    { key: 'approval_level', value: '1', description: 'Tingkat approval: 1 = Pengasuh, 2 = Wali Kelas + Pengasuh' },
    { key: 'cs_whatsapp', value: '6287755889669', description: 'Nomor WA Admin/CS Hubungi CS' },
  ];
  for (const rule of defaultRules) {
    await prisma.systemRule.upsert({
      where: { key: rule.key },
      update: {},
      create: rule,
    });
  }
}
main().finally(()=>prisma.$disconnect());
