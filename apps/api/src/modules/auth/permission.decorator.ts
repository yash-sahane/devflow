import { ProjectPermission } from "@devflow/shared";
import { SetMetadata } from "@nestjs/common";

export const PERMISSION_KEY = 'permissions';

export const RequirePermissions = (...permissions: ProjectPermission[]) => SetMetadata(PERMISSION_KEY, permissions);