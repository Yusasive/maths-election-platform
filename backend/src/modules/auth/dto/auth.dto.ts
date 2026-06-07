import { IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterVoterDto {
  @IsString()
  @MinLength(1)
  matricNumber: string;

  @IsString()
  @MinLength(2)
  fullName: string;

  @IsString()
  @MinLength(2)
  department: string;

  @IsString()
  @MinLength(1)
  level: string;

  @IsString()
  @MinLength(1)
  image: string;

  @IsOptional()
  @IsString()
  accessCode?: string;
}
