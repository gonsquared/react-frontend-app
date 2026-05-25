import { Link } from "react-router-dom";
import styles from "./RegisterPage.module.scss";

export default function RegisterPage() {
  return (
    <section className={styles.authPage}>
      <div className={styles.authPanel}>
        <h1>User Registration</h1>
        <form className={styles.authForm}>
          <label>
            First name
            <input name="firstName" type="text" autoComplete="given-name" />
          </label>
          <label>
            Last name
            <input name="lastName" type="text" autoComplete="family-name" />
          </label>
          <label>
            Email address
            <input name="email" type="email" autoComplete="email" />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="new-password" />
          </label>
          <label>
            Verify password
            <input
              name="verifyPassword"
              type="password"
              autoComplete="new-password"
            />
          </label>
          <div className={styles.formActions}>
            <Link to="/login">Back</Link>
            <button type="submit">Submit</button>
          </div>
        </form>
      </div>
    </section>
  );
}
