interface FieldError {
  field: string;
  message: string;
}

export class AppError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  readonly fieldErrors: FieldError[];

  constructor(message: string, fieldErrors: FieldError[], options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'AuthenticationError';
  }
}
