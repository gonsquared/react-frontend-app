import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { getApiUrl, readJsonResponse } from "../../helpers/api";
import styles from "./RegisterPage.module.scss";

const emptyRegistrationForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  verifyPassword: "",
};

type RegistrationForm = typeof emptyRegistrationForm;
type RegistrationField = keyof RegistrationForm;
type FieldErrors = Partial<Record<RegistrationField, boolean>>;

type BackendValidationError = {
  loc?: string[];
  msg?: string;
};

const fieldLabels: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  email: "Email address",
  password: "Password",
  verifyPassword: "Verify password",
};

const registrationFields = Object.keys(
  emptyRegistrationForm,
) as RegistrationField[];

const isRegistrationField = (fieldName: string): fieldName is RegistrationField =>
  registrationFields.includes(fieldName as RegistrationField);

const fieldFromMessage = (message: string): RegistrationField | null => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("email")) return "email";
  if (lowerMessage.includes("verify password")) return "verifyPassword";
  if (lowerMessage.includes("password")) return "password";
  if (lowerMessage.includes("first name")) return "firstName";
  if (lowerMessage.includes("last name")) return "lastName";

  return null;
};

const parseErrorDetail = (detail: unknown) => {
  const fieldErrors: FieldErrors = {};

  if (typeof detail === "string") {
    const fieldName = fieldFromMessage(detail);
    if (fieldName) fieldErrors[fieldName] = true;

    return {
      message: detail,
      fieldErrors,
    };
  }

  if (Array.isArray(detail)) {
    const message = detail
      .map((error: BackendValidationError) => {
        const fieldName = error.loc?.[error.loc.length - 1];
        if (fieldName && isRegistrationField(fieldName)) {
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
    message: "Failed to register user",
    fieldErrors,
  };
};

export default function RegisterPage() {
  const [registrationForm, setRegistrationForm] = useState<RegistrationForm>(
    emptyRegistrationForm,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleFormChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const fieldName = name as RegistrationField;

    setRegistrationForm((currentForm) => ({
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
    setSuccessMessage(null);
    setFieldErrors({});

    try {
      const response = await fetch(getApiUrl("/api/auth/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationForm),
      });

      const responseData = await readJsonResponse<{
        detail?: unknown;
        message?: string;
      }>(response);

      if (!response.ok) {
        const parsedError = parseErrorDetail(responseData?.detail);
        setFieldErrors(parsedError.fieldErrors);
        throw new Error(parsedError.message);
      }

      setRegistrationForm(emptyRegistrationForm);
      setSuccessMessage(
        responseData?.message ||
          "Registration successful. Please check your email to activate your account.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to register user",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.authPage}>
      <div className={styles.authPanel}>
        <h1>User Registration</h1>
        {errorMessage ? (
          <p className={styles.formError} role="alert">
            {errorMessage}
          </p>
        ) : null}
        {successMessage ? (
          <p className={styles.formSuccess} role="status">
            {successMessage}
          </p>
        ) : null}
        <form className={styles.authForm} onSubmit={handleSubmit}>
          <label>
            First name
            <input
              name="firstName"
              type="text"
              autoComplete="given-name"
              minLength={2}
              maxLength={100}
              required
              aria-invalid={fieldErrors.firstName ? "true" : undefined}
              className={fieldErrors.firstName ? styles.fieldError : undefined}
              value={registrationForm.firstName}
              onChange={handleFormChange}
            />
          </label>
          <label>
            Last name
            <input
              name="lastName"
              type="text"
              autoComplete="family-name"
              minLength={2}
              maxLength={100}
              required
              aria-invalid={fieldErrors.lastName ? "true" : undefined}
              className={fieldErrors.lastName ? styles.fieldError : undefined}
              value={registrationForm.lastName}
              onChange={handleFormChange}
            />
          </label>
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={fieldErrors.email ? "true" : undefined}
              className={fieldErrors.email ? styles.fieldError : undefined}
              value={registrationForm.email}
              onChange={handleFormChange}
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
              aria-invalid={fieldErrors.password ? "true" : undefined}
              className={fieldErrors.password ? styles.fieldError : undefined}
              value={registrationForm.password}
              onChange={handleFormChange}
            />
          </label>
          <label>
            Verify password
            <input
              name="verifyPassword"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
              aria-invalid={fieldErrors.verifyPassword ? "true" : undefined}
              className={
                fieldErrors.verifyPassword ? styles.fieldError : undefined
              }
              value={registrationForm.verifyPassword}
              onChange={handleFormChange}
            />
          </label>
          <div className={styles.formActions}>
            <Link to="/login">Back</Link>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
