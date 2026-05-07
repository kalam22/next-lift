/**
 * Logger utility untuk development dan production
 * Di production, console.log akan di-disable untuk mengurangi overhead
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  /**
   * Log informasi (hanya di development)
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  /**
   * Log warning (hanya di development)
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },

  /**
   * Log error (selalu log, termasuk di production)
   */
  error: (...args: any[]) => {
    console.error(...args)
    // Di production, bisa dikirim ke error tracking service
    // Contoh: Sentry.captureException(error)
  },

  /**
   * Log info (hanya di development)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },

  /**
   * Log debug (hanya di development)
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  },
}
















