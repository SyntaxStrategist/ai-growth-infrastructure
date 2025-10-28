/**
 * Security Monitoring System
 * Logs security events and suspicious activities
 */

import { NextRequest } from 'next/server';

export interface SecurityEvent {
  timestamp: Date;
  eventType: 'auth_failure' | 'csrf_violation' | 'rate_limit_exceeded' | 'suspicious_activity' | 'sql_injection_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent?: string;
  details: Record<string, any>;
  endpoint?: string;
}

class SecurityLogger {
  private events: SecurityEvent[] = [];
  private readonly MAX_EVENTS = 1000; // Keep last 1000 events in memory

  log(event: SecurityEvent): void {
    // Add to in-memory store
    this.events.push(event);
    
    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }
    
    // Log to console with structured format
    console.log(`[SECURITY] ${event.severity.toUpperCase()} - ${event.eventType}`, {
      timestamp: event.timestamp.toISOString(),
      ip: event.ip,
      endpoint: event.endpoint,
      details: event.details
    });
    
    // In production, this would also send to external monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to external monitoring service (e.g., Sentry, DataDog)
      this.sendToExternalMonitoring(event);
    }
  }

  private sendToExternalMonitoring(event: SecurityEvent): void {
    // Placeholder for external monitoring integration
    // In production, integrate with your monitoring service
    console.log('[SECURITY] External monitoring integration needed');
  }

  getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  getEventsByType(eventType: SecurityEvent['eventType'], limit: number = 50): SecurityEvent[] {
    return this.events
      .filter(event => event.eventType === eventType)
      .slice(-limit);
  }

  getEventsBySeverity(severity: SecurityEvent['severity'], limit: number = 50): SecurityEvent[] {
    return this.events
      .filter(event => event.severity === severity)
      .slice(-limit);
  }
}

// Global security logger instance
export const securityLogger = new SecurityLogger();

// Helper functions for common security events
export function logAuthFailure(req: NextRequest, details: Record<string, any>): void {
  securityLogger.log({
    timestamp: new Date(),
    eventType: 'auth_failure',
    severity: 'medium',
    ip: getClientIP(req),
    userAgent: req.headers.get('user-agent') || undefined,
    details,
    endpoint: req.nextUrl.pathname
  });
}

export function logCSRFViolation(req: NextRequest, details: Record<string, any>): void {
  securityLogger.log({
    timestamp: new Date(),
    eventType: 'csrf_violation',
    severity: 'high',
    ip: getClientIP(req),
    userAgent: req.headers.get('user-agent') || undefined,
    details,
    endpoint: req.nextUrl.pathname
  });
}

export function logRateLimitExceeded(req: NextRequest, details: Record<string, any>): void {
  securityLogger.log({
    timestamp: new Date(),
    eventType: 'rate_limit_exceeded',
    severity: 'medium',
    ip: getClientIP(req),
    userAgent: req.headers.get('user-agent') || undefined,
    details,
    endpoint: req.nextUrl.pathname
  });
}

export function logSuspiciousActivity(req: NextRequest, details: Record<string, any>): void {
  securityLogger.log({
    timestamp: new Date(),
    eventType: 'suspicious_activity',
    severity: 'high',
    ip: getClientIP(req),
    userAgent: req.headers.get('user-agent') || undefined,
    details,
    endpoint: req.nextUrl.pathname
  });
}

export function logSQLInjectionAttempt(req: NextRequest, details: Record<string, any>): void {
  securityLogger.log({
    timestamp: new Date(),
    eventType: 'sql_injection_attempt',
    severity: 'critical',
    ip: getClientIP(req),
    userAgent: req.headers.get('user-agent') || undefined,
    details,
    endpoint: req.nextUrl.pathname
  });
}

// Helper function to get client IP
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const remoteAddr = req.headers.get('x-remote-addr');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || remoteAddr || 'unknown';
}

// Security monitoring endpoint
export async function getSecurityEvents(req: NextRequest): Promise<Response> {
  try {
    // Basic authentication check (in production, use proper admin auth)
    const adminToken = req.headers.get('x-admin-token');
    if (!adminToken || adminToken !== process.env.ADMIN_SESSION_TOKEN) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const eventType = url.searchParams.get('eventType') as SecurityEvent['eventType'] | null;
    const severity = url.searchParams.get('severity') as SecurityEvent['severity'] | null;

    let events: SecurityEvent[];

    if (eventType) {
      events = securityLogger.getEventsByType(eventType, limit);
    } else if (severity) {
      events = securityLogger.getEventsBySeverity(severity, limit);
    } else {
      events = securityLogger.getRecentEvents(limit);
    }

    return new Response(JSON.stringify({
      success: true,
      events,
      count: events.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Security Monitoring] Error retrieving events:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
