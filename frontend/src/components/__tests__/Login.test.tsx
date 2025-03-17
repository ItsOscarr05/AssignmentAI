import { test, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import React from "react";
import Login from "../Login";
import { mocks } from "@/test/setup";

// Create a wrapper component that provides the necessary context
function renderLoginComponent() {
  return render(<Login />);
}

test("renders login form with all elements", () => {
  renderLoginComponent();

  // Check for heading
  expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();

  // Check for form fields
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

  // Check for buttons
  expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /don't have an account\? register/i })
  ).toBeInTheDocument();
});

test("validates required fields", async () => {
  renderLoginComponent();

  // Try to submit without filling fields
  const submitButton = screen.getByRole("button", { name: /login/i });
  await userEvent.click(submitButton);

  // Check for HTML5 validation messages
  const emailInput = screen.getByLabelText(/email/i);
  const passwordInput = screen.getByLabelText(/password/i);

  expect(emailInput).toBeRequired();
  expect(passwordInput).toBeRequired();
});

test("validates email format", async () => {
  renderLoginComponent();

  const emailInput = screen.getByLabelText(/email/i);
  await userEvent.type(emailInput, "invalid-email");

  // Move focus to trigger validation
  emailInput.blur();

  // Email input should have validation error
  expect(emailInput).toBeInvalid();
});

test("shows loading state during submission", async () => {
  // Mock login to be slow
  mocks.mockLogin.mockImplementationOnce(
    () => new Promise((resolve) => setTimeout(resolve, 100))
  );

  renderLoginComponent();

  // Fill in the form
  await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
  await userEvent.type(screen.getByLabelText(/password/i), "password123");

  // Submit the form
  const submitButton = screen.getByRole("button", { name: /login/i });
  await userEvent.click(submitButton);

  // Button should be disabled and show loading text
  expect(submitButton).toBeDisabled();
  expect(screen.getByText(/logging in\.\.\./i)).toBeInTheDocument();
});

test("handles successful login", async () => {
  // Mock successful login
  mocks.mockLogin.mockResolvedValueOnce({});

  renderLoginComponent();

  // Fill in the form
  await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
  await userEvent.type(screen.getByLabelText(/password/i), "password123");

  // Submit the form
  await userEvent.click(screen.getByRole("button", { name: /login/i }));

  // Check if login was called with correct credentials
  await waitFor(() => {
    expect(mocks.mockLogin).toHaveBeenCalledWith(
      "test@example.com",
      "password123"
    );
  });

  // Check if navigation occurred
  await waitFor(() => {
    expect(mocks.mockNavigate).toHaveBeenCalledWith("/");
  });
});

test("handles login failure", async () => {
  // Mock failed login
  mocks.mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"));

  renderLoginComponent();

  // Fill in the form
  await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
  await userEvent.type(screen.getByLabelText(/password/i), "password123");

  // Submit the form
  await userEvent.click(screen.getByRole("button", { name: /login/i }));

  // Check if error message is displayed
  await waitFor(() => {
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials");
  });

  // Check if button is re-enabled
  expect(screen.getByRole("button", { name: /login/i })).not.toBeDisabled();
});
