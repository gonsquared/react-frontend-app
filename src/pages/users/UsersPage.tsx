import { useCallback, useEffect, useRef, useState } from "react";
import type User from "../../interfaces/User";
import type { UserRole, UserStatus } from "../../interfaces/User";
import { getApiUrl, getErrorMessage, readJsonResponse } from "../../helpers/api";
import { useDialogFocusTrap } from "../../helpers/useDialogFocusTrap";
import {
  getAuthHeaders,
  getStoredAuthUser,
  handleUnauthorizedResponse,
  hasPermission,
} from "../../helpers/authSession";
import styles from "./UsersPage.module.scss";

const emptyUserForm = {
  firstName: "",
  lastName: "",
  email: "",
};

type UserFormField = keyof typeof emptyUserForm;

type ToastMessage = {
  message: string;
  type: "success" | "error";
};

type FieldErrors = Partial<Record<UserFormField, boolean>>;

const getErrorField = (message: string): UserFormField | null => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("email")) return "email";
  if (lowerMessage.includes("first name")) return "firstName";
  if (lowerMessage.includes("last name")) return "lastName";

  return null;
};

const getUserStatus = (user: User): UserStatus => user.status ?? "inactive";

const getStatusLabel = (status: UserStatus) =>
  status.charAt(0).toUpperCase() + status.slice(1);

const getUserRole = (user: User): UserRole => user.role ?? "user";

const getRoleLabel = (role: UserRole) =>
  role.charAt(0).toUpperCase() + role.slice(1);

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [authUser] = useState<User | null>(() => getStoredAuthUser());
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const isViewingUser = selectedUser !== null;
  const canEditForm = !isViewingUser || isEditingUser;
  const canManageUsers = hasPermission(authUser, "manage_users");

  const showToast = (message: string, type: ToastMessage["type"]) => {
    setToast({ message, type });
  };

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setIsEditingUser(false);
    setUserForm(emptyUserForm);
    setFieldErrors({});
  }, []);

  const openAddModal = () => {
    setSelectedUser(null);
    setIsEditingUser(false);
    setUserForm(emptyUserForm);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const openUserModal = (user: User) => {
    setSelectedUser(user);
    setIsEditingUser(false);
    setUserForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const enableUserEditing = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsEditingUser(true);
    setFieldErrors({});
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const fieldName = name as UserFormField;

    setUserForm((currentForm) => ({
      ...currentForm,
      [fieldName]: value,
    }));
    setFieldErrors((currentErrors) => {
      if (!currentErrors[fieldName]) return currentErrors;

      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];
      return nextErrors;
    });
  };

  const handleSaveUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFieldErrors({});
    setToast(null);

    try {
      const isUpdatingUser = selectedUser !== null;
      const response = await fetch(
        isUpdatingUser
          ? getApiUrl(`/api/users/${selectedUser.id}`)
          : getApiUrl("/api/users/"),
        {
          method: isUpdatingUser ? "PUT" : "POST",
          headers: {
            ...getAuthHeaders({ "Content-Type": "application/json" }),
          },
          body: JSON.stringify(userForm),
        },
      );

      if (handleUnauthorizedResponse(response)) return;

      if (!response.ok) {
        const errorData = await readJsonResponse<{ detail?: unknown }>(
          response,
        );
        throw new Error(
          getErrorMessage(errorData?.detail, "Failed to save user"),
        );
      }

      const savedUser = await readJsonResponse<User>(response);
      if (!savedUser) throw new Error("Failed to save user");
      setUsers((currentUsers) =>
        isUpdatingUser
          ? currentUsers.map((user) =>
              user.id === savedUser.id ? savedUser : user,
            )
          : [...currentUsers, savedUser],
      );
      closeModal();
      showToast(
        isUpdatingUser
          ? "User updated successfully."
          : "User created successfully.",
        "success",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save user";
      const errorField = getErrorField(message);

      if (errorField) {
        setFieldErrors({ [errorField]: true });
      }

      showToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const getData = async () => {
      try {
        setErrorMessage("");
        const response = await fetch(getApiUrl("/api/users/"), {
          headers: getAuthHeaders(),
        });
        if (handleUnauthorizedResponse(response)) return;

        if (!response.ok) {
          const errorData = await readJsonResponse<{ detail?: unknown }>(
            response,
          );
          throw new Error(
            getErrorMessage(errorData?.detail, "Failed to fetch users"),
          );
        }

        const data = (await readJsonResponse<User[]>(response)) ?? [];
        setUsers(data);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to fetch users",
        );
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

  useDialogFocusTrap({
    isOpen: isModalOpen,
    dialogRef: modalRef,
    initialFocusRef: closeButtonRef,
    onEscape: isSaving ? undefined : closeModal,
  });

  if (loading) return <p>Loading users...</p>;

  return (
    <>
      {toast ? (
        <div
          className={`${styles.toast} ${styles[toast.type]}`}
          role={toast.type === "error" ? "alert" : "status"}
        >
          {toast.message}
        </div>
      ) : null}
      <div className={styles.pageHeader}>
        <h1>Users</h1>
        {canManageUsers ? (
          <button
            className={styles.addButton}
            type="button"
            aria-label="Add user"
            onClick={openAddModal}
          >
            +
          </button>
        ) : null}
      </div>
      {errorMessage ? (
        <p className={styles.errorMessage} role="alert">
          {errorMessage}
        </p>
      ) : null}
      {!errorMessage && users.length === 0 ? (
        <p className={styles.emptyState}>No users found.</p>
      ) : null}
      {!errorMessage && users.length > 0 ? (
        <table aria-label="Users">
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const status = getUserStatus(user);

              return (
                <tr className={styles.userRow} key={user.id}>
                  <td>
                    <button
                      className={styles.rowButton}
                      type="button"
                      onClick={() => openUserModal(user)}
                    >
                      {user.firstName}
                    </button>
                  </td>
                  <td>{user.lastName}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[status]}`}>
                      {getStatusLabel(status)}
                    </span>
                  </td>
                  <td>{getRoleLabel(getUserRole(user))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}
      {isModalOpen ? (
        <div className={styles.modalOverlay} role="presentation">
          <div
            ref={modalRef}
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-user-title"
          >
            <div className={styles.modalHeader}>
              <h2 id="add-user-title">
                {isViewingUser
                  ? isEditingUser
                    ? "Edit User"
                    : "User Details"
                  : "Add User"}
              </h2>
              <button
                ref={closeButtonRef}
                className={styles.closeButton}
                type="button"
                aria-label="Close modal"
                onClick={closeModal}
                disabled={isSaving}
              >
                ×
              </button>
            </div>
            <form className={styles.modalForm} onSubmit={handleSaveUser}>
              <label>
                First Name
                <input
                  className={fieldErrors.firstName ? styles.fieldError : ""}
                  type="text"
                  name="firstName"
                  value={userForm.firstName}
                  placeholder="Jane"
                  onChange={handleFormChange}
                  required
                  minLength={2}
                  disabled={isSaving || !canEditForm}
                  aria-invalid={fieldErrors.firstName ? true : undefined}
                />
              </label>
              <label>
                Last Name
                <input
                  className={fieldErrors.lastName ? styles.fieldError : ""}
                  type="text"
                  name="lastName"
                  value={userForm.lastName}
                  placeholder="Doe"
                  onChange={handleFormChange}
                  required
                  minLength={2}
                  disabled={isSaving || !canEditForm}
                  aria-invalid={fieldErrors.lastName ? true : undefined}
                />
              </label>
              <label>
                Email
                <input
                  className={fieldErrors.email ? styles.fieldError : ""}
                  type="email"
                  name="email"
                  value={userForm.email}
                  placeholder="jane@example.com"
                  onChange={handleFormChange}
                  required
                  disabled={isSaving || !canEditForm}
                  aria-invalid={fieldErrors.email ? true : undefined}
                />
              </label>
              {isViewingUser && selectedUser ? (
                <div className={styles.readOnlyField}>
                  <span>Status</span>
                  <span
                    className={`${styles.statusBadge} ${
                      styles[getUserStatus(selectedUser)]
                    }`}
                  >
                    {getStatusLabel(getUserStatus(selectedUser))}
                  </span>
                </div>
              ) : null}
              <div className={styles.modalActions}>
                <button type="button" onClick={closeModal} disabled={isSaving}>
                  {isViewingUser ? "Close" : "Cancel"}
                </button>
                {isViewingUser && !isEditingUser ? (
                  <button
                    type="button"
                    onClick={enableUserEditing}
                    disabled={isSaving}
                    aria-label="Edit user"
                  >
                    Edit
                  </button>
                ) : (
                  <button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
