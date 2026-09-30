import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { WaliService } from '../wali/wali.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private wali: WaliService,
  ) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() u: any) {
    const dbUser = await this.auth.getMe((u as any).id);
    const base = { ...(dbUser as any), ...(u as any), ...dbUser } as any;
    // prefer DB values
    base.id = (dbUser as any).id;
    base.username = (dbUser as any).username;
    base.email = (dbUser as any).email;
    base.role = (dbUser as any).role;
    base.santriId = (dbUser as any).santriId;
    base.avatar = (dbUser as any).avatar ?? null;
    base.phone = (dbUser as any).phone ?? null;
    if (base.role === 'ADMIN') return { ...base, linked: true };
    if (base.role === 'WALI') {
      const anak = await this.wali.findAnakSaya(base.id);
      return { ...base, linked: !!base.santriId || anak.length > 0, anakCount: anak.length };
    }
    return { ...base, linked: !!base.santriId };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@CurrentUser() u: any, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword((u as any).id, dto);
  }
}
