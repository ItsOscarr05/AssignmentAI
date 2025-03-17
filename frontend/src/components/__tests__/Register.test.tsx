import { test, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import Register from "../Register";

// Mock AuthContext
const mockRegister = vi.fn();
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    register: mockRegister,
  }),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

test("renders registration form with all elements", () => {
  render(<Register />);
  expect(
    screen.getByRole("heading", { name: /register/i })
  ).toBeInTheDocument();
  expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /register|creating account/i })
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
});

test("validates required fields", async () => {
  render(<Register />);

  await act(async () => {
    fireEvent.click(
      screen.getByRole("button", { name: /register|creating account/i })
    );
  });

  const fullNameInput = screen.getByLabelText(/full name/i);
  const emailInput = screen.getByLabelText(/email/i);
  const passwordInput = screen.getByLabelText(/^password$/i);
  const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

  expect(fullNameInput).toBeRequired();
  expect(emailInput).toBeRequired();
  expect(passwordInput).toBeRequired();
  expect(confirmPasswordInput).toBeRequired();

  expect(fullNameInput).toBeInvalid();
  expect(emailInput).toBeInvalid();
  expect(passwordInput).toBeInvalid();
  expect(confirmPasswordInput).toBeInvalid();
});

test("validates email format", async () => {
  render(<Register />);

  const emailInput = screen.getByLabelText(/email/i);

  await act(async () => {
    await userEvent.type(emailInput, "invalid-email");
    await userEvent.type(screen.getByLabelText(/^password$/i), "password123");
    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      "password123"
    );
    await userEvent.type(screen.getByLabelText(/full name/i), "John Doe");
    fireEvent.click(
      screen.getByRole("button", { name: /register|creating account/i })
    );
  });

  expect(emailInput).toBeInvalid();
});

test("validates password match", async () => {
  render(<Register />);

  await act(async () => {
    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "password123");
    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      "password456"
    );
    await userEvent.type(screen.getByLabelText(/full name/i), "John Doe");
    fireEvent.click(
      screen.getByRole("button", { name: /register|creating account/i })
    );
  });

  expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
});

test("shows loading state during submission", async () => {
  mockRegister.mockImplementationOnce(
    () => new Promise((resolve) => setTimeout(resolve, 100))
  );
  render(<Register />);

  await act(async () => {
    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "password123");
    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      "password123"
    );
    await userEvent.type(screen.getByLabelText(/full name/i), "John Doe");
    fireEvent.click(
      screen.getByRole("button", { name: /register|creating account/i })
    );
  });

  expect(
    screen.getByRole("button", { name: /creating account/i })
  ).toBeDisabled();
});

test("handles successful registration", async () => {
  mockRegister.mockResolvedValueOnce(undefined);
  render(<Register />);

  await act(async () => {
    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "password123");
    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      "password123"
    );
    await userEvent.type(screen.getByLabelText(/full name/i), "John Doe");
    fireEvent.click(
      screen.getByRole("button", { name: /register|creating account/i })
    );
  });

  await waitFor(() => {
    expect(mockRegister).toHaveBeenCalledWith(
      "test@example.com",
      "password123",
      "John Doe"
    );
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});

test("handles registration failure", async () => {
  const errorMessage = "Email already exists";
  mockRegister.mockRejectedValueOnce(new Error(errorMessage));
  render(<Register />);

  await act(async () => {
    await userEvent.type(
      screen.getByLabelText(/email/i),
      "existing@example.com"
    );
    await userEvent.type(screen.getByLabelText(/^password$/i), "password123");
    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      "password123"
    );
    await userEvent.type(screen.getByLabelText(/full name/i), "John Doe");
    fireEvent.click(
      screen.getByRole("button", { name: /register|creating account/i })
    );
  });

  await waitFor(() => {
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /register/i })
    ).not.toBeDisabled();
  });
});

test("navigates to login page", async () => {
  render(<Register />);

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /login/i }));
  });

  expect(mockNavigate).toHaveBeenCalledWith("/login");
});
