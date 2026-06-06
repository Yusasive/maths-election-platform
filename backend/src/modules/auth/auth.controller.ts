import { Controller, Post, Body, Param, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('elections/:slug/login')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Param('slug') slug: string,
    @Body() body: { matricNumber: string; fullName: string; department: string; image: string; accessCode?: string },
  ) {
    const { matricNumber, fullName, department, image, accessCode } = body;
    if (!matricNumber || !fullName || !department || !image) {
      throw new BadRequestException('All fields (matricNumber, fullName, department, image) are required');
    }
    return this.authService.registerVoter(slug, matricNumber, fullName, department, image, accessCode);
  }
}
