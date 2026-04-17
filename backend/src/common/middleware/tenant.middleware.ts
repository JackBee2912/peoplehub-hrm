import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Tenant context is extracted from JWT token in the auth guard.
    // This middleware is a placeholder for subdomain-based tenant detection
    // which can be added in later sprints.
    const authHeader = req.headers.authorization;
    if (authHeader) {
      // Tenant will be set on the request by JwtAuthGuard after token validation
      next();
    } else {
      next();
    }
  }
}
