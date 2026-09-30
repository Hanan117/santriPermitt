import {
  Controller,
  Get,
  Put,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RulesService } from './rules.service.js';
import { UpdateRulesDto } from './dto/rules.dto.js';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';

const PDF_MIME_TYPE = 'application/pdf';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Controller('rules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RulesController {
  constructor(private rulesService: RulesService) {}

  @Get()
  findAll(@CurrentUser() _user: { id: string; role: string }) {
    // All roles can view rules (read-only for non-admin)
    return this.rulesService.findAll();
  }

  @Put()
  @Roles(Role.ADMIN)
  update(@Body() dto: UpdateRulesDto, @CurrentUser() _user: { id: string }) {
    const rulesToUpdate = Object.entries(dto)
      .filter(([, v]) => v !== undefined)
      .map(([key, value]) => ({
        key: key.replace(/([A-Z])/g, '_$1').toLowerCase(),
        value: value as string,
      }));
    return this.rulesService.upsertMany(rulesToUpdate);
  }

  @Post('upload')
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = join(process.cwd(), 'public', 'uploads');
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req, file, callback) => {
          // Generate a unique filename with original extension
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (file.mimetype !== PDF_MIME_TYPE) {
          return callback(
            new BadRequestException('Only PDF files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: MAX_FILE_SIZE,
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const url = `/uploads/${file.filename}`;
    // Auto-persist so GET /rules returns it without extra PUT
    await this.rulesService.upsertMany([{ key: 'rulesPdf', value: url, description: 'URL PDF Aturan' }]);
    return { url };
  }
}
