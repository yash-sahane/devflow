import { IsString, IsNotEmpty, IsUrl, IsOptional } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsUrl()
  @IsNotEmpty()
  repoUrl?: string;
}
