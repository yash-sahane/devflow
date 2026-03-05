import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsUrl()
  @IsNotEmpty()
  repoUrl!: string;
}
