import { useEffect, useState } from "react";
import User from "../interfaces/User";
import styles from "./UsersPage.module.scss";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    console.log("Fetching users data...");
    const getData = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/users");
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

  if (loading) return <p>Loading users...</p>;

  return (
    <>
      <div className={styles.pageHeader}>
        <h1>Users</h1>
        <button
          className={styles.addButton}
          type="button"
          aria-label="Add user"
          onClick={() => setIsModalOpen(true)}
        >
          +
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
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
              <h2 id="add-user-title">Add User</h2>
              <button
                className={styles.closeButton}
                type="button"
                aria-label="Close modal"
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </button>
            </div>
            <form
              className={styles.modalForm}
              onSubmit={(event) => event.preventDefault()}
            >
              <label>
                First Name
                <input type="text" placeholder="Jane" />
              </label>
              <label>
                Last Name
                <input type="text" placeholder="Doe" />
              </label>
              <label>
                Email
                <input type="email" placeholder="jane@example.com" />
              </label>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
