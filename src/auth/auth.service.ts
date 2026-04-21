import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './_utils/dto/request/login.dto';

import { UsersRepository } from 'src/users/users.repository';
import { UsersService } from 'src/users/users.service';
import { EncryptionService } from '../encryption/encryption.service';
import { NodemailerService } from '../nodemailer/nodemailer.service';
import { ConfirmRecoverAccountPasswordDto } from './_utils/dto/request/confirm-recover-account-password.dto';
import { RecoverAccountPasswordDto } from './_utils/dto/request/recover-account-password.dto';
import JwtPayloadInterface from './_utils/interfaces/jwt-payload.interface';
import { SelectUser } from 'src/users/users.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private usersService: UsersService,
    private jwtService: JwtService,
    private nodemailerService: NodemailerService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async validateUser(email: string, pass: string) {
    // const user = await this.usersRepository.findOneByEmailOrThrow(email);
    //
    // const passwordStatus = await this.encryptionService.compare(pass, user.password);
    // if (!passwordStatus.isPasswordCorrect) throw new UnauthorizedException('WRONG_CREDENTIALS');
    // if (passwordStatus.isEncryptionChanged) {
    //   await this.usersRepository.updatePasswordById(user._id, pass);
    // }
    //
    // return user;
  }

  async login(login: LoginDto) {
    // const user = await this.validateUser(login.email, login.password);
    //
    // const payload: JwtPayloadInterface = { email: user.email, id: user._id.toString(), role: user.role };
    // return { accessToken: this.jwtService.sign(payload), user: this.usersService.getUser(user) };
  }

  async recoverAccountPassword(body: RecoverAccountPasswordDto) {
    // const recoveredUser = await this.usersRepository.recoverAccountPassword(body.email);
    // const token = recoveredUser.recoveryToken;
    // const tokenExpires = recoveredUser.recoveryTokenExpires;
    // if (!token || !tokenExpires) throw new BadRequestException('Error while generate recovering token');
    // return this.nodemailerService.sendForgotPasswordEmail(
    //   recoveredUser.email,
    //   recoveredUser.firstname,
    //   token,
    //   tokenExpires,
    // );
  }

  async confirmRecoverAccountPassword(body: ConfirmRecoverAccountPasswordDto) {
    // const user = await this.usersRepository.findOneByTokenOrThrow(body.token);
    // return this.usersRepository.updatePasswordById(user._id, body.password);
  }
}
