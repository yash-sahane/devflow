import { IsString, IsNotEmpty } from 'class-validator';

export class CreateBuildDto {
  @IsString()
  @IsNotEmpty()
  commitSha!: string;
}
