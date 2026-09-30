import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { SantriModule } from './modules/santri/santri.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { PermissionsModule } from './modules/permissions/permissions.module.js';
import { WaliModule } from './modules/wali/wali.module.js';
import { RulesModule } from './modules/rules/rules.module.js';
import { ContactModule } from './modules/contact/contact.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SantriModule,
    NotificationsModule,
    PermissionsModule,
    WaliModule,
    RulesModule,
    ContactModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
