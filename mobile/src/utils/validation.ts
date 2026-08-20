const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) return 'Email is required';
  if (!EMAIL_PATTERN.test(trimmed)) return 'That does not look like a valid email';

  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Password is required';
  if (value.length < 8) return 'Use at least 8 characters';
  if (!/[a-zA-Z]/.test(value)) return 'Include at least one letter';
  if (!/[0-9]/.test(value)) return 'Include at least one number';

  return null;
}

export function validateName(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) return 'Name is required';
  if (trimmed.length < 2) return 'Use at least 2 characters';

  return null;
}

export function validateRequired(value: string, field: string): string | null {
  return value.trim() ? null : field + ' is required';
}

export function passwordStrength(value: string): { score: number; label: string } {
  let score = 0;

  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^a-zA-Z0-9]/.test(value)) score += 1;

  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];

  return { score: score / 5, label: labels[score] };
}
