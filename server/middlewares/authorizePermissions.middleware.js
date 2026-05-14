// middleware/authorize.js
import { ROLE_PERMISSIONS } from "../config/roles/roles.config.js";

export function authorizePermissions(...requiredPermissions) {
    return (req, res, next) => {
        const role = req.user.role;

        const permissions = ROLE_PERMISSIONS[role] || [];

        const hasAccess = requiredPermissions.every(p =>
            permissions.includes(p)
        );

        if (!hasAccess) {
            return res.status(403).json({ message: "Forbidden" });
        }

        next();
    };
}





// router.post(
//     "/users",
//     checkAuth,
//     authorizePermissions("create_user"),
//     (req, res) => {
//         res.json({ message: "User created" });
//     }
// );

// // admin only
// router.delete(
//     "/users/:id",
//     checkAuth,
//     authorizePermissions("delete_user"),
//     (req, res) => {
//         res.json({ message: "User deleted" });
//     }
// );