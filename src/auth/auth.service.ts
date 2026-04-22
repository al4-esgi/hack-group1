import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import JwtPayloadInterface from "./_utils/interfaces/jwt-payload.interface";
import { GetUserType } from "src/users/users.entity";

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
  ) {}

  generateJwt(user: GetUserType) {
    const payload: JwtPayloadInterface = {
      email: user.email,
      id: user.id.toString(),
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}
