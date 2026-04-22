import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, Profile, VerifyCallback } from "passport-google-oauth20";
import { EnvironmentVariables } from "../../_utils/config/env.config";
import { UsersService } from "src/users/users.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
	constructor(
		private readonly configService: ConfigService<EnvironmentVariables, true>,
		private readonly usersService: UsersService
	) {
		const clientID = configService.get("GOOGLE_CLIENT_ID");
		const clientSecret = configService.get("GOOGLE_CLIENT_SECRET");
		const callbackURL = configService.get("GOOGLE_CALLBACK_URL");

		if (!clientID || !clientSecret) {
			throw new UnauthorizedException("Google OAuth2 not configured");
		}

		super({
			clientID,
			clientSecret,
			callbackURL,
			scope: ["email", "profile"],
		});
	}

	async validate(
		_accessToken: string,
		_refreshToken: string,
		profile: Profile,
		done: VerifyCallback,
	): Promise<any> {
    const user = this.usersService.upsertUserFromGoogle(profile)

		done(null, user);
	}
}
