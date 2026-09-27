export interface PasswordValidationRules {
  minLength: boolean;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  matchesConfirm: boolean;
}

export const SPECIAL_CHARACTERS_REGEX = /[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?~`]/;

export const checkPasswordRules = (
  password: string,
  confirmPassword?: string
): PasswordValidationRules => {
  return {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: SPECIAL_CHARACTERS_REGEX.test(password),
    matchesConfirm:
      confirmPassword !== undefined && confirmPassword.length > 0 && password === confirmPassword,
  };
};

export const isPasswordStrong = (password: string): boolean => {
  const rules = checkPasswordRules(password);
  return (
    rules.minLength &&
    rules.hasLowercase &&
    rules.hasUppercase &&
    rules.hasNumber &&
    rules.hasSpecialChar
  );
};

export const getPasswordValidationError = (
  password: string,
  confirmPassword?: string
): string | null => {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }

  const missingCriteria: string[] = [];
  if (!/[a-z]/.test(password)) missingCriteria.push('one lowercase letter');
  if (!/[A-Z]/.test(password)) missingCriteria.push('one uppercase letter');
  if (!/[0-9]/.test(password)) missingCriteria.push('one number');
  if (!SPECIAL_CHARACTERS_REGEX.test(password)) missingCriteria.push('one special character');

  if (missingCriteria.length > 0) {
    return 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character.';
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    return 'Passwords do not match.';
  }

  return null;
};
