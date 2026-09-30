import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class RulesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const rules = await (this.prisma as any).systemRule.findMany({
      orderBy: { key: 'asc' },
    });
    return rules.map((r: any) => ({
      key: r.key,
      value: r.value,
      description: r.description,
    }));
  }

  async findByKey(key: string) {
    const rule = await (this.prisma as any).systemRule.findUnique({ where: { key } });
    if (!rule) throw new NotFoundException(`Rule '${key}' not found`);
    return { key: rule.key, value: rule.value, description: rule.description };
  }

  async upsertMany(rules: { key: string; value: string; description?: string }[]) {
    const results = await Promise.all(
      rules.map((r) =>
        (this.prisma as any).systemRule.upsert({
          where: { key: r.key },
          update: { value: r.value, description: r.description },
          create: r,
        }),
      ),
    );
    return results.map((r: any) => ({
      key: r.key,
      value: r.value,
      description: r.description,
    }));
  }
}