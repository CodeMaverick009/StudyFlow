/**
 * Validation utilities for StudyFlow
 * Provides robust email validation with zero external dependencies,
 * featuring a Zod-compatible schema API (safeParse / parse) and direct helper functions.
 */

// Regex adhering to standard RFC 5322 email formatting:
// - Disallows leading or consecutive dots
// - Disallows spaces and invalid control characters
// - Requires a valid local-part, '@', valid domain labels, and at least a 2-letter TLD
const EMAIL_REGEX = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;

/**
 * Zod-compatible email schema
 * Supports .safeParse() and .parse() without requiring an external bundle.
 */
export const emailSchema = {
    safeParse(value) {
        if (typeof value !== "string") {
            return {
                success: false,
                error: {
                    message: "Email must be a string.",
                    issues: [{ code: "invalid_type", expected: "string", received: typeof value, message: "Email must be a string." }]
                }
            };
        }

        const trimmed = value.trim();

        if (trimmed.length === 0) {
            return {
                success: false,
                error: {
                    message: "Email address cannot be empty.",
                    issues: [{ code: "too_small", minimum: 1, message: "Email address cannot be empty." }]
                }
            };
        }

        if (trimmed.length > 254) {
            return {
                success: false,
                error: {
                    message: "Email address is too long (maximum 254 characters).",
                    issues: [{ code: "too_big", maximum: 254, message: "Email address is too long." }]
                }
            };
        }

        if (!EMAIL_REGEX.test(trimmed)) {
            return {
                success: false,
                error: {
                    message: "Please enter a valid email address (e.g. name@example.com).",
                    issues: [{ code: "invalid_string", validation: "email", message: "Please enter a valid email address." }]
                }
            };
        }

        // Additional domain segment verification
        const parts = trimmed.split("@");
        const domain = parts[1];
        if (domain) {
            const labels = domain.split(".");
            const hasInvalidLabel = labels.some(label => label.length === 0 || label.startsWith("-") || label.endsWith("-"));
            if (hasInvalidLabel) {
                return {
                    success: false,
                    error: {
                        message: "Please enter a valid domain name.",
                        issues: [{ code: "invalid_string", validation: "email", message: "Invalid domain." }]
                    }
                };
            }
        }

        return {
            success: true,
            data: trimmed.toLowerCase()
        };
    },

    parse(value) {
        const result = this.safeParse(value);
        if (!result.success) {
            const err = new Error(result.error.message);
            err.issues = result.error.issues;
            throw err;
        }
        return result.data;
    }
};

/**
 * Validates an email address.
 *
 * @param {string} email
 * @returns {{ isValid: boolean, error: string | null, normalizedEmail: string | null }}
 */
export function validateEmail(email) {
    const result = emailSchema.safeParse(email);
    if (result.success) {
        return {
            isValid: true,
            error: null,
            normalizedEmail: result.data
        };
    }
    return {
        isValid: false,
        error: result.error.message,
        normalizedEmail: null
    };
}

/**
 * Simple boolean helper for email validation.
 *
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
    return emailSchema.safeParse(email).success;
}

/**
 * Attaches real-time validation to an email input textbox.
 * Prevents random text from remaining unnoticed by validating on blur and input.
 *
 * @param {HTMLInputElement} inputElement The email input element
 * @param {Object} [options]
 * @param {HTMLElement} [options.errorElement] Optional element to display the error message in
 * @param {(errorMessage: string | null) => void} [options.onError] Optional callback on error change
 */
export function attachEmailInputValidation(inputElement, options = {}) {
    if (!inputElement) return;

    const { errorElement, onError } = options;

    function applyValidation(showEmptyError = false) {
        const rawValue = inputElement.value;
        const trimmed = rawValue.trim();

        if (!trimmed) {
            if (showEmptyError) {
                inputElement.classList.add("input-invalid");
                inputElement.setAttribute("aria-invalid", "true");
                const msg = "Email address cannot be empty.";
                if (errorElement) {
                    errorElement.textContent = msg;
                    errorElement.hidden = false;
                }
                if (onError) onError(msg);
            } else {
                inputElement.classList.remove("input-invalid");
                inputElement.removeAttribute("aria-invalid");
                if (errorElement) {
                    errorElement.textContent = "";
                    errorElement.hidden = true;
                }
                if (onError) onError(null);
            }
            return;
        }

        const validation = validateEmail(trimmed);
        if (!validation.isValid) {
            inputElement.classList.add("input-invalid");
            inputElement.setAttribute("aria-invalid", "true");
            if (errorElement) {
                errorElement.textContent = validation.error;
                errorElement.hidden = false;
            }
            if (onError) onError(validation.error);
        } else {
            inputElement.classList.remove("input-invalid");
            inputElement.removeAttribute("aria-invalid");
            if (errorElement) {
                errorElement.textContent = "";
                errorElement.hidden = true;
            }
            if (onError) onError(null);
        }
    }

    inputElement.addEventListener("blur", () => {
        if (inputElement.value.trim().length > 0) {
            applyValidation(false);
        }
    });

    inputElement.addEventListener("input", () => {
        // Clear or update validation as the user types if it was previously invalid
        if (inputElement.classList.contains("input-invalid")) {
            applyValidation(false);
        }
    });
}
