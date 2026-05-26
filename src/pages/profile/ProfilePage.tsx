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

export default function ProfilePage() {
  const authUser = getStoredAuthUser();

  if (!authUser) {
    return <p>Profile unavailable.</p>;
  }

  const fullName = `${authUser.firstName} ${authUser.lastName}`.trim();
  const permissions =
    authUser.role === "admin"
      ? ["manage_users", "manage_own"]
      : (authUser.permissions ?? ["manage_own"]);

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
                {getPermissionLabel(permission as UserPermission)}
              </li>
            ))}
          </ul>
        </dd>
      </dl>
    </section>
  );
}
