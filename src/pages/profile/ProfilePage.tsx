import { useRef, useState } from "react";
import { getApiUrl, getErrorMessage, readJsonResponse } from "../../helpers/api";
import {
  getAuthHeaders,
  getStoredAuthUser,
  handleUnauthorizedResponse,
} from "../../helpers/authSession";
import type User from "../../interfaces/User";
import type {
  UserPermission,
  UserRole,
  UserStatus,
} from "../../interfaces/User";
import styles from "./ProfilePage.module.scss";

const avatarPlaceholder =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='24' fill='%23d9dee7'/%3E%3Ccircle cx='24' cy='19' r='8' fill='%23747f8f'/%3E%3Cpath d='M10 42c2.7-8.6 8-13 14-13s11.3 4.4 14 13' fill='%23747f8f'/%3E%3C/svg%3E";

const allowedAvatarTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const maxAvatarSizeBytes = 2 * 1024 * 1024;

const getSafeAvatarUrl = (avatarUrl?: string): string => {
  if (!avatarUrl) return avatarPlaceholder;

  if (/^data:image\/(?:png|jpeg|gif|webp);base64,/i.test(avatarUrl)) {
    return avatarUrl;
  }

  try {
    const url = new URL(avatarUrl, window.location.origin);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return avatarPlaceholder;
  }

  return avatarPlaceholder;
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

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Failed to read avatar image"));
    });
    reader.addEventListener("error", () => {
      reject(new Error("Failed to read avatar image"));
    });
    reader.readAsDataURL(file);
  });

export default function ProfilePage() {
  const [authUser, setAuthUser] = useState<User | null>(() => getStoredAuthUser());
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!authUser) {
    return <p>Profile unavailable.</p>;
  }

  const fullName = `${authUser.firstName} ${authUser.lastName}`.trim();
  const permissions = getUserPermissions(authUser);
  const avatarUrl = getSafeAvatarUrl(authUser.avatarUrl);

  const updateAvatar = async (file: File) => {
    setUploadMessage("");
    setUploadError("");

    if (!allowedAvatarTypes.includes(file.type)) {
      setUploadError("Avatar must be a PNG, JPEG, GIF, or WebP image.");
      return;
    }

    if (file.size > maxAvatarSizeBytes) {
      setUploadError("Avatar image must be 2 MB or smaller.");
      return;
    }

    setIsUploading(true);

    try {
      const avatarDataUrl = await readFileAsDataUrl(file);
      const response = await fetch(
        getApiUrl(`/api/users/${authUser.id}/avatar`),
        {
          method: "PATCH",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ avatarUrl: avatarDataUrl }),
        },
      );

      if (handleUnauthorizedResponse(response)) return;

      if (!response.ok) {
        const errorData = await readJsonResponse<{ detail?: unknown }>(
          response,
        );
        throw new Error(
          getErrorMessage(errorData?.detail, "Failed to update avatar"),
        );
      }

      const updatedUser = await readJsonResponse<User>(response);
      if (!updatedUser) throw new Error("Failed to update avatar");
      setAuthUser(updatedUser);
      localStorage.setItem("authUser", JSON.stringify(updatedUser));
      setUploadMessage("Avatar updated.");
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Failed to update avatar",
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <section className={styles.profilePage}>
      <div className={styles.profileHeader}>
        <h1>Profile</h1>
        <div className={styles.profileIdentity}>
          <p className={styles.profileName}>{fullName}</p>
          <button
            className={styles.avatarButton}
            type="button"
            aria-label="Update avatar image"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <img
              className={styles.avatarImage}
              src={avatarUrl}
              alt={`${fullName} avatar`}
              width="64"
              height="64"
            />
          </button>
          <input
            ref={fileInputRef}
            className={styles.avatarInput}
            type="file"
            accept="image/*"
            aria-label="Avatar image"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void updateAvatar(file);
              }
            }}
          />
        </div>
        {uploadMessage ? (
          <p className={styles.uploadMessage} role="status">
            {uploadMessage}
          </p>
        ) : null}
        {uploadError ? (
          <p className={styles.uploadError} role="alert">
            {uploadError}
          </p>
        ) : null}
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
