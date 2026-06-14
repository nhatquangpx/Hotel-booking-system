class ServiceError extends Error {
  constructor(statusCode, message, extra = {}) {
    super(message);
    this.name = "ServiceError";
    this.statusCode = statusCode;
    Object.assign(this, extra);
  }
}

module.exports = { ServiceError };
