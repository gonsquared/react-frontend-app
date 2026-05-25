import { useEffect, useState } from "react";
import User from "../interfaces/User";
import styles from "./UsersPage.module.scss";

const emptyUserForm = {
  firstName: "",
  lastName: "",
  email: "",
};

type ToastMessage = {
  message: string;
  type: "success" | "error";
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
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
    setSaveError("");
  };

  const openAddModal = () => {
    setSelectedUser(null);
    setIsEditingUser(false);
    setUserForm(emptyUserForm);
    setSaveError("");
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
    setSaveError("");
    setIsModalOpen(true);
  };

  const enableUserEditing = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setIsEditingUser(true);
    setSaveError("");
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setUserForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSaveUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveError("");
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
      setSaveError(message);
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
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
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
            </tr>
          ))}
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
                  type="text"
                  name="firstName"
                  value={userForm.firstName}
                  placeholder="Jane"
                  onChange={handleFormChange}
                  required
                  minLength={2}
                  disabled={isSaving || !canEditForm}
                />
              </label>
              <label>
                Last Name
                <input
                  type="text"
                  name="lastName"
                  value={userForm.lastName}
                  placeholder="Doe"
                  onChange={handleFormChange}
                  required
                  minLength={2}
                  disabled={isSaving || !canEditForm}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={userForm.email}
                  placeholder="jane@example.com"
                  onChange={handleFormChange}
                  required
                  disabled={isSaving || !canEditForm}
                />
              </label>
              {saveError ? (
                <p className={styles.formError} role="alert">
                  {saveError}
                </p>
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
