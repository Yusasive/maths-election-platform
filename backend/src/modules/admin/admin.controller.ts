import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('setup')
  async checkSetup() {
    return this.adminService.isSuperAdminSetup();
  }

  @Post('setup')
  async setup(@Body() body: { email: string; password: string; name: string }) {
    const { email, password, name } = body;
    if (!email || !password || !name) throw new BadRequestException('All fields required');
    return this.adminService.setup(email, password, name);
  }

  @Post('register')
  async register(@Body() body: { email: string; password: string; name: string }) {
    const { email, password, name } = body;
    if (!email || !password || !name) throw new BadRequestException('All fields required');
    return this.adminService.register(email, password, name);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const { email, password } = body;
    if (!email || !password) throw new BadRequestException('Email and password required');
    return this.adminService.login(email, password);
  }

  @Get('profile')
  async profile(@Headers('authorization') auth: string) {
    return this.adminService.validateAdmin(auth);
  }

  // Super admin endpoints
  @Get('super/admins')
  async listAdmins(@Headers('authorization') auth: string) {
    await this.adminService.validateSuperAdmin(auth);
    return this.adminService.listAllAdmins();
  }

  @Patch('super/admins/:id/approve')
  async approve(@Param('id') id: string, @Headers('authorization') auth: string) {
    await this.adminService.validateSuperAdmin(auth);
    return this.adminService.approveAdmin(id);
  }

  @Patch('super/admins/:id/decline')
  async decline(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Headers('authorization') auth: string,
  ) {
    await this.adminService.validateSuperAdmin(auth);
    return this.adminService.declineAdmin(id, body?.reason || '');
  }

  @Delete('super/admins/:id')
  async deleteAdmin(@Param('id') id: string, @Headers('authorization') auth: string) {
    await this.adminService.validateSuperAdmin(auth);
    return this.adminService.deleteAdminAccount(id);
  }

  // Voter management (admin-only per election)
  @Get('elections/:slug/voters')
  async getVoters(
    @Param('slug') slug: string,
    @Headers('authorization') auth: string,
  ) {
    const admin = await this.adminService.validateAdmin(auth);
    // electionId is the slug here for simplicity
    return this.adminService.getVoters(slug);
  }

  @Delete('elections/:slug/voters/:matricNumber')
  async deleteVoter(
    @Param('slug') slug: string,
    @Param('matricNumber') matricNumber: string,
    @Headers('authorization') auth: string,
  ) {
    await this.adminService.validateAdmin(auth);
    return this.adminService.deleteVoter(slug, matricNumber);
  }

  @Delete('elections/:slug/voters')
  async deleteVoterByQuery(
    @Param('slug') slug: string,
    @Query('matricNumber') matricNumber: string,
    @Headers('authorization') auth: string,
  ) {
    await this.adminService.validateAdmin(auth);
    if (!matricNumber) throw new BadRequestException('matricNumber required');
    return this.adminService.deleteVoter(slug, matricNumber);
  }
}
