/**
 * Standardized function log formatting.
 *
 * Format: [functionName] message {context}
 */
type LogContext = Record<string, unknown>;
type ConsoleLevel = "log" | "info" | "warn" | "error" | "debug";

function hasContext(ctx: LogContext): boolean {
  return Object.keys(ctx).length > 0;
}

export function formatLogMessage(functionName: string, message: string): string {
  return `[${functionName}] ${message}`;
}

export function writeLog(
  level: ConsoleLevel,
  functionName: string,
  message: string,
  ctx: LogContext = {}
): void {
  const formattedMessage = formatLogMessage(functionName, message);
  if (hasContext(ctx)) {
    console[level](formattedMessage, ctx);
    return;
  }

  console[level](formattedMessage);
}

export function createFunctionLogger(functionName: string) {
  return {
    debug(message: string, ctx: LogContext = {}) {
      writeLog("debug", functionName, message, ctx);
    },
    error(message: string, ctx: LogContext = {}) {
      writeLog("error", functionName, message, ctx);
    },
    info(message: string, ctx: LogContext = {}) {
      writeLog("info", functionName, message, ctx);
    },
    log(message: string, ctx: LogContext = {}) {
      writeLog("log", functionName, message, ctx);
    },
    warn(message: string, ctx: LogContext = {}) {
      writeLog("warn", functionName, message, ctx);
    },
  };
}

export const log = (fn: string, msg: string, ctx: LogContext = {}): void =>
  writeLog("log", fn, msg, ctx);

export const warn = (fn: string, msg: string, ctx: LogContext = {}): void =>
  writeLog("warn", fn, msg, ctx);

export const err = (fn: string, msg: string, ctx: LogContext = {}): void =>
  writeLog("error", fn, msg, ctx);
