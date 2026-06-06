import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}

@Controller()
export class RootController {
  @Get()
  root() {
    return { status: 'ok', service: 'Election Platform API', timestamp: new Date().toISOString() };
  }
}
