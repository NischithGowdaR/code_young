export class AppError extends Error {
  statusCode: number;
  errorName?: string;

  constructor(message: string, statusCode = 500, errorName?: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorName = errorName;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
