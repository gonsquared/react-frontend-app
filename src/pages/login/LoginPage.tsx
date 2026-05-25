import { Link } from "react-router-dom";
import styles from "./LoginPage.module.scss";

export default function LoginPage() {
  return (
    <section className={styles.authPage}>
      <div className={styles.authPanel}>
        <h1>Login</h1>
        <form className={styles.authForm}>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
            />
          </label>
          <button type="submit">Login</button>
        </form>
        <div className={styles.authLinks}>
          <Link to="/register">Sign up</Link>
          <a href="#">Forgot password?</a>
        </div>
      </div>
    </section>
  );
}
