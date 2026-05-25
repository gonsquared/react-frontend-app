import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./pages/home/HomePage";
import ActivateAccountPage from "./pages/activate-account/ActivateAccountPage";
import LoginPage from "./pages/login/LoginPage";
import RegisterPage from "./pages/register/RegisterPage";
import Users from "./pages/users/UsersPage";
import AuthorizedLayout from "./layouts/AuthorizedLayout";
import PublicLayout from "./layouts/PublicLayout";
import styles from "./App.module.scss";

type Theme = "light" | "dark";

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark" ? "dark" : "light";
  });

  const isDarkTheme = theme === "dark";

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  };

  return (
    <Router>
      <div className={`${styles.app} ${isDarkTheme ? styles.darkTheme : ""}`}>
        <div className={styles.appBody}>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/activate-account"
                element={<ActivateAccountPage />}
              />
            </Route>
            <Route
              element={
                <AuthorizedLayout
                  isDarkTheme={isDarkTheme}
                  toggleTheme={toggleTheme}
                />
              }
            >
              <Route path="/home" element={<Home />} />
              <Route path="/users" element={<Users />} />
            </Route>
          </Routes>
        </div>
      </div>
    </Router>
  );
}
