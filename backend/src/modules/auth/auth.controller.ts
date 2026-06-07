import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterVoterDto } from './dto/auth.dto';

@Controller('elections/:slug/login')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async register(@Param('slug') slug: string, @Body() body: RegisterVoterDto) {
    return this.authService.registerVoter(
      slug,
      body.matricNumber,
      body.fullName,
      body.department,
      body.level,
      body.image,
      body.accessCode,
    );
  }
}
