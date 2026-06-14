/**
 * Install Pipeline Error Types
 */

export class InstallLinkingError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "InstallLinkingError";
    this.details = details || {};
  }
}

export class InstallTransitionError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "InstallTransitionError";
    this.details = details || {};
  }
}