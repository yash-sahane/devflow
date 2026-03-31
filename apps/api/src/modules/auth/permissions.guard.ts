import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthorizationService } from "./authorization.service";
import { ProjectContextService } from "./project-context.service";
import { ProjectPermission } from "@devflow/shared";
import { PERMISSION_KEY } from "./permission.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
    private readonly projectContextService: ProjectContextService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<ProjectPermission[]>(PERMISSION_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { userId: string; role: string } | undefined;

    if (!user?.userId) {
      throw new ForbiddenException('Missing user context');
    }

    const projectId = await this.projectContextService.resolveProjectId(
      request.params ?? {},
    );

    if (!projectId) {
      throw new ForbiddenException('Missing project context');
    }

    for (const permission of requiredPermissions) {
      await this.authorizationService.assertPermission(user, projectId, permission);
    }

    return true;
  }
}