import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  SetupAdminDto,
  UpdateProfileDto,
  RegisterAdminDto,
  LoginAdminDto,
  DeclineAdminDto,
  PaginationDto,
  VoterPaginationDto,
} from './dto/admin.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('setup')
  async checkSetup() {
    return this.adminService.isSuperAdminSetup();
  }

  @Post('setup')
  async setup(@Body() body: SetupAdminDto) {
    return this.adminService.setup(body.email, body.password, body.name);
  }

  @Post('register')
  async register(@Body() body: RegisterAdminDto) {
    return this.adminService.register(body.email, body.password, body.name);
  }

  @Post('login')
  async login(@Body() body: LoginAdminDto) {
    return this.adminService.login(body.email, body.password);
  }

  @Get('profile')
  async profile(@Headers('authorization') auth: string) {
    return this.adminService.validateAdmin(auth);
  }

  @Put('profile')
  async updateProfile(
    @Headers('authorization') auth: string,
    @Body() body: UpdateProfileDto,
  ) {
    const admin = await this.adminService.validateAdmin(auth);
    return this.adminService.updateProfile(admin._id.toString(), body);
  }

  // Super admin endpoints
  @Get('super/admins')
  async listAdmins(
    @Headers('authorization') auth: string,
    @Query() query: PaginationDto,
  ) {
    await this.adminService.validateSuperAdmin(auth);
    return this.adminService.listAllAdmins(query.page, query.limit);
  }

  @Patch('super/admins/:id/approve')
  async approve(@Param('id') id: string, @Headers('authorization') auth: string) {
    await this.adminService.validateSuperAdmin(auth);
    return this.adminService.approveAdmin(id);
  }

  @Patch('super/admins/:id/decline')
  async decline(
    @Param('id') id: string,
    @Body() body: DeclineAdminDto,
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
    @Query() query: VoterPaginationDto,
  ) {
    await this.adminService.validateAdmin(auth);
    return this.adminService.getVoters(slug, query.page, query.limit);
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
