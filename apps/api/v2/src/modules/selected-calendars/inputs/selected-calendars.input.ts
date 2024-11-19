import { IsInt, IsString } from "class-validator";

export class SelectedCalendarsInputDto {
  @IsString()
  readonly integration!: string;

  @IsString()
  readonly externalId!: string;

  @IsInt()
  readonly credentialId!: number;

  @IsInt()
  readonly defaultReminder!: number;
}

export class SelectedCalendarsQueryParamsInputDto {
  @IsString()
  readonly integration!: string;

  @IsString()
  readonly externalId!: string;

  @IsString()
  readonly credentialId!: string;
}
