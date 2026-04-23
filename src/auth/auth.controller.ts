import { Controller, Get, Req, Res, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "@nestjs/passport";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { EnvironmentVariables } from "../_utils/config/env.config";
import { AuthService } from "./auth.service";
import { GetUserType } from "src/users/users.entity";
import { GoogleAuthGuard } from "./strategy/google-auth.guard";
import { Platform } from "./_utils/enums/platform.enum";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  @Get("google")
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: "Initiate Google OAuth2 login flow" })
  @ApiQuery({ name: "platform", enum: Platform, required: false })
  async googleAuth() {}

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Google OAuth2 callback" })
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const userWithPlatform = req.user as GetUserType & { platform?: string };
    const { platform, ...user } = userWithPlatform;

    const jwt = this.authService.generateJwt(user);
    const frontUrl = this.configService.get("FRONT_URL");
    const mobileOauthRedirectUrl = this.configService.get("MOBILE_REDIRECT_URI");

    if (platform === "MOBILE") {
      res.redirect(
        `${mobileOauthRedirectUrl}://auth/callback?token=${encodeURIComponent(jwt)}`,
      );
    } else {
      res.redirect(
        `${frontUrl}/auth/callback#token=${encodeURIComponent(jwt)}`,
      );
    }
  }

  @Get("callback")
  @ApiOperation({
    summary: "Redirect callback to mobile deep link preserving query params",
  })
  async callbackRedirect(@Req() req: Request, @Res() res: Response) {
    const mobileOauthRedirectUrl = this.configService.get("MOBILE_REDIRECT_URI");
    const redirectPathWithQuery = req.originalUrl
      .replace(/^\/api\/v1\//, "")
      .replace(/^\//, "");

    res.redirect(`${mobileOauthRedirectUrl}://${redirectPathWithQuery}`);
  }
}
