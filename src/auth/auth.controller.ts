import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "@nestjs/passport";
import { ApiOperation,  ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { EnvironmentVariables } from "../_utils/config/env.config";
import { AuthService } from "./auth.service";
import { GetUserType } from "src/users/users.entity";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  @Get("google")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Initiate Google OAuth2 login flow" })
  async googleAuth() {
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Google OAuth2 callback" })
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = req.user as GetUserType
    const jwt = this.authService.generateJwt(user);

    const frontUrl = this.configService.get("FRONT_URL");
    res.redirect(`${frontUrl}/auth/callback#token=${encodeURIComponent(jwt)}`);
  }
}
