import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersRepository } from "src/users/users.repository";
import JwtPayloadInterface from "./_utils/interfaces/jwt-payload.interface";
import { UserRoleEnum } from "src/users/_utils/user-role.enum";
import { GetUserType } from "src/users/users.entity";

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
  ) {}

  generateJwt(user: GetUserType) {
    const payload: JwtPayloadInterface = {
      email: user.email,
      id: user.id.toString(),
      role: UserRoleEnum.USER,
    };
    return this.jwtService.sign(payload);
  }

  async validateGoogleLogin(googleData: {
    googleId: string;
    email: string;
    firstname: string;
    lastname: string;
  }): Promise<GetUserType> {
    let user = await this.usersRepository.findByGoogleId(googleData.googleId);

    if (!user) {
      user = await this.usersRepository.createGoogleUser(googleData);
    }

    return user;
  }
}
