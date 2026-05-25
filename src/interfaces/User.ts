export type UserStatus = "inactive" | "active" | "archived";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status?: UserStatus;
}

export default User;
