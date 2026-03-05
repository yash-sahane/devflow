import { BuildStatus } from '../enums/build-status.enum';

export interface Build {
  id: string;
  projectId: string;
  commitSha: string;
  status: BuildStatus;
}
