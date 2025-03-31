import React, { useState } from "react";
import { useBreakpoints } from "../hooks/useMediaQuery";

interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "number" | "date" | "textarea";
  required?: boolean;
  validation?: (value: string) => string | undefined;
}

interface MobileFormProps {
  fields: FormField[];
  onSubmit: (values: Record<string, string>) => void;
  submitLabel?: string;
}

export const MobileForm: React.FC<MobileFormProps> = ({
  fields,
  onSubmit,
  submitLabel = "Submit",
}) => {
  const { isMobile } = useBreakpoints();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateField = (
    field: FormField,
    value: string
  ): string | undefined => {
    if (field.required && !value) {
      return `${field.label} is required`;
    }
    if (field.validation) {
      return field.validation(value);
    }
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate all fields
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach((field) => {
      const error = validateField(field, values[field.name] || "");
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);

    if (isValid) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error("Form submission error:", error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const commonProps = {
      name: field.name,
      value: values[field.name] || "",
      onChange: handleChange,
      className: `input ${errors[field.name] ? "error" : ""}`,
      "aria-invalid": !!errors[field.name],
      "aria-describedby": errors[field.name]
        ? `${field.name}-error`
        : undefined,
    };

    switch (field.type) {
      case "textarea":
        return (
          <textarea
            {...commonProps}
            rows={4}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
      case "date":
        return (
          <input
            {...commonProps}
            type="date"
            min={new Date().toISOString().split("T")[0]}
          />
        );
      default:
        return (
          <input
            {...commonProps}
            type={field.type}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mobile-form">
      {fields.map((field) => (
        <div key={field.name} className="form-field">
          <label htmlFor={field.name} className="form-label">
            {field.label}
            {field.required && <span className="required">*</span>}
          </label>
          {renderField(field)}
          {errors[field.name] && (
            <div
              id={`${field.name}-error`}
              className="error-message"
              role="alert"
            >
              {errors[field.name]}
            </div>
          )}
        </div>
      ))}
      <button
        type="submit"
        className={`btn btn-primary ${isSubmitting ? "loading" : ""}`}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting..." : submitLabel}
      </button>
    </form>
  );
};
