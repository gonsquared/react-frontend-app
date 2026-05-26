import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { getApiUrl, readJsonResponse } from "../../helpers/api";
import type User from "../../interfaces/User";
import styles from "./LoginPage.module.scss";

const emptyLoginForm = {
  email: "",
  password: "",
};

type LoginForm = typeof emptyLoginForm;
type LoginField = keyof LoginForm;
type FieldErrors = Partial<Record<LoginField, boolean>>;

type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
};

type BackendValidationError = {
  loc?: string[];
  msg?: string;
};

const fieldLabels: Record<string, string> = {
  email: "Email",
  password: "Password",
};

const loginFields = Object.keys(emptyLoginForm) as LoginField[];

const isLoginField = (fieldName: string): fieldName is LoginField =>
  loginFields.includes(fieldName as LoginField);

const parseErrorDetail = (detail: unknown) => {
  const fieldErrors: FieldErrors = {};

  if (typeof detail === "string") {
    const lowerDetail = detail.toLowerCase();

    if (lowerDetail.includes("email")) fieldErrors.email = true;
    if (lowerDetail.includes("password")) fieldErrors.password = true;

    return {
      message: detail,
      fieldErrors,
    };
  }

  if (Array.isArray(detail)) {
    const message = detail
      .map((error: BackendValidationError) => {
        const fieldName = error.loc?.[error.loc.length - 1];

        if (fieldName && isLoginField(fieldName)) {
          fieldErrors[fieldName] = true;
        }

        const label = fieldName ? fieldLabels[fieldName] || fieldName : "Field";
        return `${label}: ${error.msg || "Invalid value"}`;
      })
      .join(" ");

    return {
      message,
      fieldErrors,
    };
  }

  return {
    message: "Failed to log in",
    fieldErrors,
  };
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [loginForm, setLoginForm] = useState<LoginForm>(emptyLoginForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleFormChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const fieldName = name as LoginField;

    setLoginForm((currentForm) => ({
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      const response = await fetch(getApiUrl("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginForm),
      });

      const responseData = await readJsonResponse<{
        detail?: unknown;
      } & Partial<LoginResponse>>(response);

      if (!response.ok) {
        const parsedError = parseErrorDetail(responseData?.detail);
        setFieldErrors(parsedError.fieldErrors);
        throw new Error(parsedError.message);
      }

      if (!responseData?.accessToken || !responseData.tokenType || !responseData.user) {
        throw new Error("Failed to log in");
      }

      const loginResponse = responseData as LoginResponse;
      localStorage.setItem("accessToken", loginResponse.accessToken);
      localStorage.setItem("tokenType", loginResponse.tokenType);
      localStorage.setItem("authUser", JSON.stringify(loginResponse.user));
      navigate("/users");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to log in",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.authPage}>
      <div className={styles.authPanel}>
        <h1>Login</h1>
        {errorMessage ? (
          <p className={styles.formError} role="alert">
            {errorMessage}
          </p>
        ) : null}
        <form className={styles.authForm} onSubmit={handleSubmit}>
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={fieldErrors.email ? "true" : undefined}
              className={fieldErrors.email ? styles.fieldError : undefined}
              value={loginForm.email}
              onChange={handleFormChange}
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={fieldErrors.password ? "true" : undefined}
              className={fieldErrors.password ? styles.fieldError : undefined}
              value={loginForm.password}
              onChange={handleFormChange}
            />
          </label>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className={styles.authLinks}>
          <Link to="/register">Sign up</Link>
          <button type="button" disabled aria-disabled="true">
            Forgot password?
          </button>
        </div>
      </div>
    </section>
  );
}
