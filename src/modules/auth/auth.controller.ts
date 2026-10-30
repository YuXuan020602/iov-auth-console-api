import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '登录（返回 JWT + 用户信息）' })
  async login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body.email, body.password);
  }

  @Get('me')
  @ApiOperation({ summary: '获取当前登录用户（从 Authorization header 解析）' })
  @ApiBearerAuth()
  async me(@Req() req: { headers: { authorization?: string } }) {
    const auth = req.headers.authorization;
    if (!auth) return null;
    const token = auth.replace('Bearer ', '');
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
      return this.auth.validateUser(payload.sub);
    } catch {
      return null;
    }
  }
}
