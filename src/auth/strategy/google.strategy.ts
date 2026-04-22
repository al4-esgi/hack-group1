import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, Profile, VerifyCallback } from "passport-google-oauth20";
import { EnvironmentVariables } from "../../_utils/config/env.config";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
	constructor(
		private readonly configService: ConfigService<EnvironmentVariables, true>,
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
		accessToken: string,
		refreshToken: string,
		profile: Profile,
		done: VerifyCallback,
	): Promise<any> {
		const { name, emails, id } = profile;
		const user = {
			googleId: id,
			email: emails?.[0]?.value || "",
			firstname: name?.givenName || "",
			lastname: name?.familyName || "",
		};
		done(null, user);
	}
}
