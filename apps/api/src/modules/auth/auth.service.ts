import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

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

  async register(dto: RegisterDto) {
    if ((dto.role as string) !== 'SANTRI' && (dto.role as string) !== 'WALI') {
      throw new ForbiddenException('Hanya role SANTRI atau WALI yang dapat mendaftar mandiri');
    }
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ username: dto.username }, { email: dto.email }] },
    });
    if (existing) throw new ConflictException('Username atau email sudah terdaftar');
    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password: hash,
        role: dto.role as any,
        santriId: null,
      },
    });
    return {
      message: 'Pendaftaran berhasil, silakan login',
      user: {
        id: (user as any).id,
        username: (user as any).username,
        email: (user as any).email,
        role: (user as any).role,
        santriId: null,
      },
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const valid = await bcrypt.compare(dto.oldPassword, (user as any).password);
    if (!valid) throw new BadRequestException('Password lama salah');
    if (dto.oldPassword === dto.newPassword) throw new BadRequestException('Password baru harus berbeda');
    const hash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hash } });
    return { message: 'Password berhasil diubah' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, role: true, santriId: true, phone: true, avatar: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
