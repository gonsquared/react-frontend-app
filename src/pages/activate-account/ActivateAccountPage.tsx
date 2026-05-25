import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import styles from "./ActivateAccountPage.module.scss";

type ActivationState = "loading" | "success" | "error";

export default function ActivateAccountPage() {
  const [searchParams] = useSearchParams();
  const [activationState, setActivationState] =
    useState<ActivationState>("loading");
  const [message, setMessage] = useState("Activating your account...");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setActivationState("error");
      setMessage("Activation link is missing a token.");
      return;
    }

    const activateAccount = async () => {
      try {
        const response = await fetch(
          `http://localhost:4000/api/auth/activate?token=${encodeURIComponent(
            token,
          )}`,
        );
        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(
            responseData.detail || "Failed to activate your account.",
          );
        }

        setActivationState("success");
        setMessage(responseData.message || "Email address activated successfully");
      } catch (error) {
        setActivationState("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Failed to activate your account.",
        );
      }
    };

    activateAccount();
  }, [searchParams]);

  return (
    <section className={styles.authPage}>
      <div className={styles.authPanel}>
        <h1>Account Activation</h1>
        <p
          className={
            activationState === "error" ? styles.formError : styles.formSuccess
          }
          role={activationState === "error" ? "alert" : "status"}
        >
          {message}
        </p>
        {activationState === "success" ? <Link to="/login">Login</Link> : null}
      </div>
    </section>
  );
}
