import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "@nestjs/passport";
import { ApiOperation,  ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { UsersService } from "src/users/users.service";
import { EnvironmentVariables } from "../_utils/config/env.config";
import { AuthService } from "./auth.service";

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
    // initiates Google OAuth2 login flow
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Google OAuth2 callback" })
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = await this.authService.validateGoogleLogin(req.user as any);
    const jwt = this.authService.generateJwt(user);

    const frontUrl = this.configService.get("FRONT_URL");
    res.redirect(`${frontUrl}/auth/callback#token=${encodeURIComponent(jwt)}`);
  }
}
