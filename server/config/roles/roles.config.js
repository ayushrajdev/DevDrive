// config/roles.js
export const ROLES = {
    ADMIN: "admin",
    MANAGER: "manager",
    USER: "user"
};

export const ROLE_PERMISSIONS = {
    admin: ["create_user", "delete_user", "view_reports"],
    manager: ["create_user", "view_reports"],
    user: ["view_profile"]
};