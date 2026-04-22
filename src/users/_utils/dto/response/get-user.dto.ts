import { ApiProperty } from "@nestjs/swagger";

export class GetUserDto {
	@ApiProperty()
	id: string;

	@ApiProperty()
	firstname: string;

	@ApiProperty()
	lastname: string;

	@ApiProperty()
	email: string;

	@ApiProperty({ required: false, nullable: true })
	photoUrl: string | null;
}
