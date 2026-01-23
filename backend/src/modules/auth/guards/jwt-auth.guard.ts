import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

/**
 * JWT Auth Guard placeholder
 * TODO: Implement full JWT authentication in Session 1.x
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canActivate(_context: ExecutionContext): boolean {
    // Placeholder - always allow for now
    // TODO: Implement JWT validation
    return true;
  }
}
