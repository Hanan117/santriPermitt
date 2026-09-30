import { Controller, Get, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { NotificationsService } from './notifications.service.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  findByUser(@CurrentUser() user: { id: string }) {
    return this.notificationsService.findByUser(user.id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Delete('read-all')
  deleteRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.deleteRead(user.id);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.notificationsService.markRead(id, user.id);
  }

  @Delete(':id')
  deleteOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.notificationsService.deleteOne(id, user.id);
  }
}
