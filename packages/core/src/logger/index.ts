/* eslint-disable no-unused-vars */

import 'colors';

export enum COMPILER_LOG_LEVEL_TYPE {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

if (process.argv.includes('--compiler-debug')) {
  (global as any).COMPILER_LOG_LEVEL = 'debug';
}

function getLogLevel(logLevel: string): COMPILER_LOG_LEVEL_TYPE | undefined {
  if (!logLevel) return COMPILER_LOG_LEVEL_TYPE.INFO;
  switch (logLevel.toUpperCase()) {
    case 'ERROR':
      return COMPILER_LOG_LEVEL_TYPE.ERROR;
    case 'WARN':
      return COMPILER_LOG_LEVEL_TYPE.WARN;
    case 'INFO':
      return COMPILER_LOG_LEVEL_TYPE.INFO;
    case 'DEBUG':
      return COMPILER_LOG_LEVEL_TYPE.DEBUG;
    default:
      return COMPILER_LOG_LEVEL_TYPE.INFO;
  }
}

const currentLogLevel: COMPILER_LOG_LEVEL_TYPE = getLogLevel(
  (global as any).COMPILER_LOG_LEVEL
);

function error(message: string): void {
  if (currentLogLevel >= COMPILER_LOG_LEVEL_TYPE.ERROR) {
    console.error(`[ERROR]: ${message}`.red);
  }
}

function warn(message: string): void {
  if (currentLogLevel >= COMPILER_LOG_LEVEL_TYPE.WARN) {
    console.warn(`[WARN]: ${message}`.yellow);
  }
}

function info(message: string): void {
  if (currentLogLevel >= COMPILER_LOG_LEVEL_TYPE.INFO) {
    console.info(`[INFO]: ${message}`.blue);
  }
}

function debug(message: string): void {
  if (currentLogLevel >= COMPILER_LOG_LEVEL_TYPE.DEBUG) {
    console.debug(`[DEBUG]: ${message}`.cyan);
  }
}

export { error, warn, info, debug };
