import { Injectable, Optional } from '@nestjs/common';
import { AuthGuard, AuthModuleOptions } from '@nestjs/passport';
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Nest 12 reads @Optional() via getOwnMetadata (not inherited), so the
  // optional ctor param from the passport mixin must be re-declared here.
  // Otherwise AuthModuleOptions is treated as required and boot fails in
  // every module that uses this guard without providing it.
  constructor(@Optional() options?: AuthModuleOptions) {
    super(options);
  }
}
