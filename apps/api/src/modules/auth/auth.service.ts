import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ username: dto.usernameOrEmail }, { email: dto.usernameOrEmail }] },
    });
    if (!user || !(await bcrypt.compare(dto.password, (user as any).password)))
      throw new UnauthorizedException('Invalid credentials');
    const payload = { sub: (user as any).id, role: (user as any).role, santriId: (user as any).santriId };
    const token = this.jwt.sign(payload);
    return {
      access_token: token,
      user: {
        id: (user as any).id,
        username: (user as any).username,
        email: (user as any).email,
        role: (user as any).role,
        santriId: (user as any).santriId,
      },
    };
  }
}
