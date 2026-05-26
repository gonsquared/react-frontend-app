export type UserStatus = "inactive" | "active" | "archived";
export type UserRole = "admin" | "user";
export type UserPermission = "manage_users" | "manage_own";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status?: UserStatus;
  role?: UserRole;
  permissions?: UserPermission[];
}

export default User;
