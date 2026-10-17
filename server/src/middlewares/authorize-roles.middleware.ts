import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../shared/types/index.js';

export class RoleMiddleware {
    /**
     * Authorize access based on allowed roles.
     * Note: 'owner' role inherently inherits all 'admin' and 'manager' permissions.
     */
    static authorize(...allowedRoles: UserRole[]) {
        return (req: Request, res: Response, next: NextFunction): void => {
            const userRole = req.user?.role;
            if (!userRole) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required for this resource',
                });
                return;
            }

            // Owner inherits admin and manager permissions
            const effectiveRoles = new Set<UserRole>(allowedRoles);
            if (effectiveRoles.has('admin') || effectiveRoles.has('manager')) {
                effectiveRoles.add('owner');
            }

            if (!effectiveRoles.has(userRole)) {
                res.status(403).json({
                    success: false,
                    message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]`,
                });
                return;
            }

            next();
        };
    }
}

export const authorizeRoles = RoleMiddleware.authorize;
