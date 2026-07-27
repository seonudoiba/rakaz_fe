export const validators = {
  isEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isPhoneNumber: (phone: string): boolean => {
    const phoneRegex = /^(\+234|0)[0-9]{10}$/;
    return phoneRegex.test(phone);
  },

  isNigerianPhone: (phone: string): boolean => {
    const phoneRegex = /^(\+234|0)[789][01][0-9]{8}$/;
    return phoneRegex.test(phone);
  },

  isPasswordStrong: (password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  },

  isNumeric: (value: any): boolean => {
    return !isNaN(parseFloat(value)) && isFinite(value);
  },

  isPositiveNumber: (value: any): boolean => {
    return validators.isNumeric(value) && parseFloat(value) > 0;
  },

  isInteger: (value: any): boolean => {
    return Number.isInteger(Number(value));
  },

  isUUID: (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },

  isDate: (value: string): boolean => {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
  },

  isFutureDate: (value: string): boolean => {
    const date = new Date(value);
    return validators.isDate(value) && date > new Date();
  },

  isPastDate: (value: string): boolean => {
    const date = new Date(value);
    return validators.isDate(value) && date < new Date();
  },

  isRequired: (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },

  minLength: (value: string, min: number): boolean => {
    return value.length >= min;
  },

  maxLength: (value: string, max: number): boolean => {
    return value.length <= max;
  },

  isInRange: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  },

  matches: (value: string, pattern: RegExp): boolean => {
    return pattern.test(value);
  },

  validatePassword: (password: string): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  validateEmail: (email: string): {
    isValid: boolean;
    message?: string;
  } => {
    if (!validators.isRequired(email)) {
      return { isValid: false, message: 'Email is required' };
    }
    if (!validators.isEmail(email)) {
      return { isValid: false, message: 'Invalid email format' };
    }
    return { isValid: true };
  },

  validatePhone: (phone: string): {
    isValid: boolean;
    message?: string;
  } => {
    if (!validators.isRequired(phone)) {
      return { isValid: false, message: 'Phone number is required' };
    }
    if (!validators.isNigerianPhone(phone)) {
      return { isValid: false, message: 'Invalid Nigerian phone number' };
    }
    return { isValid: true };
  },
};