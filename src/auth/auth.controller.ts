import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from 'src/users/_utils/dto/request/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { ConfirmRecoverAccountPasswordDto } from './_utils/dto/request/confirm-recover-account-password.dto';
import { LoginDto } from './_utils/dto/request/login.dto';
import { RecoverAccountPasswordDto } from './_utils/dto/request/recover-account-password.dto';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register user.' })
  register(@Body() body: CreateUserDto) {
    return this.usersService.createUser(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user.' })
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @HttpCode(204)
  @Post('recover-password')
  @ApiOperation({ summary: 'Send a mail with a recovery link.' })
  recoverAccountPassword(@Body() body: RecoverAccountPasswordDto) {
    return this.authService.recoverAccountPassword(body);
  }

  @HttpCode(204)
  @Post('confirm-recover-password')
  @ApiOperation({ summary: 'Confirm the recover password with token' })
  confirmRecoverAccountPassword(@Body() body: ConfirmRecoverAccountPasswordDto) {
    return this.authService.confirmRecoverAccountPassword(body);
  }
}
