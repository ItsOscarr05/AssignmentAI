import { test, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import React from "react";
import Login from "../Login.jsx";
import { mocks } from "@/test/setup";
import { act } from "react-dom/test-utils";

// Mock AuthContext
const mockLogin = vi.fn();
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

test("renders login form with all elements", () => {
  render(<Login />);

  // Check for heading
  expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();

  // Check for form fields
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

  // Check for buttons
  expect(
    screen.getByRole("button", { name: /login|logging in/i })
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
});

test("validates required fields", async () => {
  render(<Login />);

  // Try to submit without filling fields
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /login|logging in/i }));
  });

  const emailInput = screen.getByLabelText(/email/i);
  const passwordInput = screen.getByLabelText(/password/i);

  expect(emailInput).toBeRequired();
  expect(passwordInput).toBeRequired();
  expect(emailInput).toBeInvalid();
  expect(passwordInput).toBeInvalid();
});

test("validates email format", async () => {
  render(<Login />);

  const emailInput = screen.getByLabelText(/email/i);
  await act(async () => {
    await userEvent.type(emailInput, "invalid-email");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    fireEvent.click(screen.getByRole("button", { name: /login|logging in/i }));
  });

  // Email input should have validation error
  expect(emailInput).toBeInvalid();
});

test("shows loading state during submission", async () => {
  // Mock login to be slow
  mockLogin.mockImplementationOnce(
    () => new Promise((resolve) => setTimeout(resolve, 100))
  );

  render(<Login />);

  // Fill in the form
  await act(async () => {
    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    fireEvent.click(screen.getByRole("button", { name: /login|logging in/i }));
  });

  // Button should be disabled and show loading text
  expect(screen.getByRole("button", { name: /logging in/i })).toBeDisabled();
});

test("handles successful login", async () => {
  mockLogin.mockResolvedValueOnce(undefined);

  render(<Login />);

  // Fill in the form
  await act(async () => {
    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    fireEvent.click(screen.getByRole("button", { name: /login|logging in/i }));
  });

  // Check if login was called with correct credentials
  await waitFor(() => {
    expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});

test("handles login failure", async () => {
  // Mock failed login
  mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"));

  render(<Login />);

  // Fill in the form
  await act(async () => {
    await userEvent.type(screen.getByLabelText(/email/i), "wrong@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "wrongpass");
    fireEvent.click(screen.getByRole("button", { name: /login|logging in/i }));
  });

  // Check if error message is displayed
  await waitFor(() => {
    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });

  // Check if button is re-enabled
  expect(
    screen.getByRole("button", { name: /login|logging in/i })
  ).not.toBeDisabled();
});
