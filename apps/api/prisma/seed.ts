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
    update: {},
    create: { email: 'santri1@test.id', username: 'santri1', password: await bcrypt.hash('santri123',10), role: Role.SANTRI, santriId: santri.id },
  });
  await prisma.user.upsert({
    where: { username: 'wali1' },
    update: {},
    create: { email: 'wali1@test.id', username: 'wali1', password: await bcrypt.hash('wali123',10), role: Role.WALI, santriId: santri.id },
  });
}
main().finally(()=>prisma.$disconnect());
