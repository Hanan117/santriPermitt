import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ContactService } from './contact.service.js';
import { CreateContactDto } from './dto/contact.dto.js';

@Controller('contact')
@UseGuards(JwtAuthGuard)
export class ContactController {
  constructor(private contactService: ContactService) {}

  @Post()
  create(@Body() dto: CreateContactDto, @CurrentUser() user: { id: string; role: string }) {
    return this.contactService.create(dto, user.id);
  }

  @Get()
  findByUser(@CurrentUser() user: { id: string }) {
    return this.contactService.findByUser(user.id);
  }

  @Get('all')
  findAll() {
    return this.contactService.findAll();
  }
}