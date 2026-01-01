/**
 * Logger utility for conditional logging based on environment
 * 
 * In development (__DEV__ = true): All logs are output to console
 * In production (__DEV__ = false): Logs are suppressed to avoid performance overhead
 * 
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.log('Debug message');
 *   logger.error('Error message');
 *   logger.warn('Warning message');
 */

export const logger = {
  log: (...args: any[]) => {
    if (__DEV__) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    if (__DEV__) {
      console.error(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (__DEV__) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (__DEV__) {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (__DEV__) {
      console.debug(...args);
    }
  },
};

