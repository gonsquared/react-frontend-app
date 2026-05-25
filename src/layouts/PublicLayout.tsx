import { Outlet } from "react-router-dom";
import styles from "../App.module.scss";

export default function PublicLayout() {
  return (
    <main className={styles.content}>
      <Outlet />
    </main>
  );
}
