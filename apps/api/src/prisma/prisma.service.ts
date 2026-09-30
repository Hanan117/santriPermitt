import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    const maxAttempts = 10;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.$connect();
        if (attempt > 1) console.log(`Prisma connected to DB on attempt ${attempt}`);
        return;
      } catch (err) {
        if (attempt === maxAttempts) throw err;
        console.log(
          `DB belum ready (attempt ${attempt}/${maxAttempts}). Tunggu 2 detik... Jalankan: docker compose up -d postgres`,
        );
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
