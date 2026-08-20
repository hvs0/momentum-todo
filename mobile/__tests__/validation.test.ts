import {
  passwordStrength,
  validateEmail,
  validateName,
  validatePassword,
} from '../src/utils/validation';

describe('validateEmail', () => {
  it('accepts an ordinary address', () => {
    expect(validateEmail('harsh@example.com')).toBeNull();
  });

  it('trims surrounding whitespace before judging', () => {
    expect(validateEmail('  harsh@example.com  ')).toBeNull();
  });

  it('rejects an empty value', () => {
    expect(validateEmail('')).toBe('Email is required');
  });

  it.each(['harsh', 'harsh@', '@example.com', 'harsh@example', 'har sh@example.com'])(
    'rejects %s',
    (value) => {
      expect(validateEmail(value)).not.toBeNull();
    },
  );
});

describe('validatePassword', () => {
  it('accepts a password with letters, numbers and enough length', () => {
    expect(validatePassword('Password123')).toBeNull();
  });

  it('rejects anything under eight characters', () => {
    expect(validatePassword('Pass12')).toBe('Use at least 8 characters');
  });

  it('requires a letter', () => {
    expect(validatePassword('12345678')).toBe('Include at least one letter');
  });

  it('requires a number', () => {
    expect(validatePassword('passwordonly')).toBe('Include at least one number');
  });
});

describe('validateName', () => {
  it('accepts a real name', () => {
    expect(validateName('Harsh')).toBeNull();
  });

  it('rejects a blank or one character name', () => {
    expect(validateName('   ')).toBe('Name is required');
    expect(validateName('H')).toBe('Use at least 2 characters');
  });
});

describe('passwordStrength', () => {
  it('scores a short password low and a varied one high', () => {
    const weak = passwordStrength('abc');
    const strong = passwordStrength('Str0ng!Passphrase');

    expect(weak.score).toBeLessThan(strong.score);
    expect(strong.score).toBeLessThanOrEqual(1);
    expect(weak.label).toBe('Too short');
  });
});
