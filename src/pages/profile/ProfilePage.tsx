import type User from "../../interfaces/User";
import type {
  UserPermission,
  UserRole,
  UserStatus,
} from "../../interfaces/User";
import styles from "./ProfilePage.module.scss";

const getStoredAuthUser = (): User | null => {
  const authUser = localStorage.getItem("authUser");

  if (!authUser) return null;

  try {
    return JSON.parse(authUser) as User;
  } catch {
    return null;
  }
};

const formatLabel = (value: string): string => {
  const label = value.replaceAll("_", " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const getStatusLabel = (status?: UserStatus): string =>
  formatLabel(status ?? "inactive");

const getRoleLabel = (role?: UserRole): string => formatLabel(role ?? "user");

const getPermissionLabel = (permission: UserPermission): string =>
  formatLabel(permission);

const getUserPermissions = (user: User): UserPermission[] => {
  if (user.permissions) return user.permissions;

  return user.role === "admin"
    ? ["manage_users", "manage_own", "manage_notes", "manage_own_notes"]
    : ["manage_own", "manage_own_notes"];
};

export default function ProfilePage() {
  const authUser = getStoredAuthUser();

  if (!authUser) {
    return <p>Profile unavailable.</p>;
  }

  const fullName = `${authUser.firstName} ${authUser.lastName}`.trim();
  const permissions = getUserPermissions(authUser);

  return (
    <section className={styles.profilePage}>
      <div className={styles.profileHeader}>
        <h1>Profile</h1>
        <p className={styles.profileName}>{fullName}</p>
      </div>

      <dl className={styles.profileDetails}>
        <dt>Email</dt>
        <dd>{authUser.email}</dd>

        <dt>Status</dt>
        <dd>{getStatusLabel(authUser.status)}</dd>

        <dt>Role</dt>
        <dd>{getRoleLabel(authUser.role)}</dd>

        <dt>Permissions</dt>
        <dd>
          <ul className={styles.permissionList}>
            {permissions.map((permission) => (
              <li className={styles.permissionItem} key={permission}>
                {getPermissionLabel(permission)}
              </li>
            ))}
          </ul>
        </dd>
      </dl>
    </section>
  );
}
