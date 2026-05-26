import { Outlet } from "react-router-dom";
import styles from "../App.module.scss";

export default function PublicLayout() {
  return (
    <main id="main-content" className={styles.content} tabIndex={-1}>
      <Outlet />
    </main>
  );
}
