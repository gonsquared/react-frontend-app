import { useEffect, useState } from "react";
import User, { type UserStatus } from "../../interfaces/User";
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
  const isViewingUser = selectedUser !== null;
  const canEditForm = !isViewingUser || isEditingUser;

  const showToast = (message: string, type: ToastMessage["type"]) => {
    setToast({ message, type });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setIsEditingUser(false);
    setUserForm(emptyUserForm);
    setFieldErrors({});
  };

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
          ? `http://localhost:4000/api/users/${selectedUser.id}`
          : "http://localhost:4000/api/users/",
        {
          method: isUpdatingUser ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userForm),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to save user");
      }

      const savedUser: User = await response.json();
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
    console.log("Fetching users data...");
    const getData = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/users/");
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  useEffect(() => {
    console.log("Users data updated:", users);
  }, [users]);

  useEffect(() => {
    if (!toast) return;

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

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
        <button
          className={styles.addButton}
          type="button"
          aria-label="Add user"
          onClick={openAddModal}
        >
          +
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const status = getUserStatus(user);

            return (
              <tr
                className={styles.userRow}
                key={user.id}
                tabIndex={0}
                onClick={() => openUserModal(user)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openUserModal(user);
                  }
                }}
              >
                <td>{user.firstName}</td>
                <td>{user.lastName}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[status]}`}>
                    {getStatusLabel(status)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {isModalOpen ? (
        <div className={styles.modalOverlay} role="presentation">
          <div
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
