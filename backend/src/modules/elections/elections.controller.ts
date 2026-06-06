import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { ElectionsService } from './elections.service';
import { AdminService } from '../admin/admin.service';

@Controller('elections')
export class ElectionsController {
  constructor(
    private readonly electionsService: ElectionsService,
    private readonly adminService: AdminService,
  ) {}

  @Get()
  async list() {
    return this.electionsService.listPublic();
  }

  @Get('all')
  async listAll(@Headers('authorization') auth: string) {
    await this.adminService.validateSuperAdmin(auth);
    return this.electionsService.listAll();
  }

  @Get('mine')
  async mine(@Headers('authorization') auth: string) {
    const admin = await this.adminService.validateAdmin(auth);
    return this.electionsService.listByAdmin(admin._id.toString());
  }

  @Post()
  async create(
    @Body() body: {
      title: string;
      description?: string;
      status?: string;
      accessCode?: string;
      isPublic?: boolean;
      votingStartTime: string;
      votingEndTime: string;
      slug?: string;
    },
    @Headers('authorization') auth: string,
  ) {
    const admin = await this.adminService.validateAdmin(auth);
    return this.electionsService.create(admin._id.toString(), body);
  }

  @Get(':slug')
  async getOne(@Param('slug') slug: string) {
    return this.electionsService.getBySlug(slug);
  }

  @Get(':slug/stats')
  async stats(@Param('slug') slug: string, @Headers('authorization') auth: string) {
    await this.adminService.validateAdmin(auth);
    return this.electionsService.getStats(slug);
  }

  @Put(':slug')
  async update(
    @Param('slug') slug: string,
    @Body() body: {
      title?: string;
      description?: string;
      status?: string;
      accessCode?: string;
      isPublic?: boolean;
      votingStartTime?: string;
      votingEndTime?: string;
    },
    @Headers('authorization') auth: string,
  ) {
    const admin = await this.adminService.validateAdmin(auth);
    return this.electionsService.update(slug, admin._id.toString(), admin.role, body);
  }

  @Delete(':slug')
  async remove(@Param('slug') slug: string, @Headers('authorization') auth: string) {
    const admin = await this.adminService.validateAdmin(auth);
    return this.electionsService.remove(slug, admin._id.toString(), admin.role);
  }
}
