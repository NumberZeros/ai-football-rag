type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatMessage(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };
  }

  private log(level: LogLevel, message: string, data?: any) {
    const entry = this.formatMessage(level, message, data);

    // Console output with color coding
    const colors = {
      info: '\x1b[36m',    // Cyan
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m',   // Red
      debug: '\x1b[90m',   // Gray
    };
    const reset = '\x1b[0m';

    const prefix = `${colors[level]}[${entry.level.toUpperCase()}]${reset}`;
    const timestamp = `${colors.debug}${entry.timestamp}${reset}`;

    console.log(`${timestamp} ${prefix} ${entry.message}`);
    if (data) {
      console.log(data);
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, error?: any) {
    this.log('error', message, error);
    
    // Log stack trace in development
    if (this.isDevelopment && error?.stack) {
      console.error(error.stack);
    }
  }

  debug(message: string, data?: any) {
    if (this.isDevelopment) {
      this.log('debug', message, data);
    }
  }

  /**
   * Log API request
   */
  apiRequest(method: string, path: string, params?: any) {
    this.info(`API ${method} ${path}`, params);
  }

  /**
   * Log API response
   */
  apiResponse(method: string, path: string, statusCode: number, duration?: number) {
    const message = `API ${method} ${path} - ${statusCode}${duration ? ` (${duration}ms)` : ''}`;
    if (statusCode >= 500) {
      this.error(message);
    } else if (statusCode >= 400) {
      this.warn(message);
    } else {
      this.info(message);
    }
  }

  /**
   * Log LLM call
   */
  llmCall(model: string, promptType: string, tokens?: number) {
    this.info(`LLM Call: ${model} - ${promptType}`, tokens ? { tokens } : undefined);
  }

  /**
   * Log session activity
   */
  sessionActivity(sessionId: string, activity: string) {
    this.debug(`Session ${sessionId}: ${activity}`);
  }
}

// Singleton instance
export const logger = new Logger();
