import { IRISBrain } from './IRISBrain';

export class MonitoringService {
  private irisBrain: IRISBrain;

  constructor() {
    this.irisBrain = IRISBrain.getInstance();
  }

  // Middleware for API monitoring
  public apiMonitoringMiddleware() {
    return (req: any, res: any, next: any) => {
      const start = Date.now();
      const originalSend = res.send;

      // Capture request details
      this.irisBrain.captureEvent({
        type: 'api_call',
        severity: 'low',
        category: 'http_request',
        data: {
          method: req.method,
          url: req.url,
          userAgent: req.get('user-agent'),
          ip: req.ip,
          timestamp: new Date()
        },
        userId: req.user?.id,
        sessionId: req.sessionID
      });

      // Override res.send to capture response details
      res.send = function(body: any) {
        const responseTime = Date.now() - start;
        const statusCode = res.statusCode;

        // Determine severity based on status code and response time
        let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (statusCode >= 500) severity = 'critical';
        else if (statusCode >= 400) severity = 'high';
        else if (responseTime > 2000) severity = 'medium';

        MonitoringService.getInstance().irisBrain.captureEvent({
          type: 'api_call',
          severity,
          category: 'http_response',
          data: {
            method: req.method,
            url: req.url,
            statusCode,
            responseTime,
            responseSize: body ? JSON.stringify(body).length : 0
          },
          userId: req.user?.id,
          sessionId: req.sessionID
        });

        // Analyze errors immediately
        if (statusCode >= 400) {
          MonitoringService.getInstance().irisBrain.analyzeError({
            type: 'http_error',
            statusCode,
            url: req.url,
            method: req.method,
            message: body?.message || 'HTTP Error'
          }, {
            userId: req.user?.id,
            sessionId: req.sessionID,
            userAgent: req.get('user-agent')
          });
        }

        return originalSend.call(this, body);
      };

      next();
    };
  }

  // Database query monitoring
  public logDatabaseQuery(query: string, duration: number, error?: any) {
    this.irisBrain.captureEvent({
      type: 'db_query',
      severity: error ? 'high' : duration > 1000 ? 'medium' : 'low',
      category: 'database',
      data: {
        query: query.substring(0, 200), // Truncate for privacy
        duration,
        error: error?.message,
        timestamp: new Date()
      }
    });

    if (error) {
      this.irisBrain.analyzeError(error, { query, duration });
    }
  }

  // User action tracking
  public logUserAction(userId: string, action: string, data?: any) {
    this.irisBrain.captureEvent({
      type: 'user_action',
      severity: 'low',
      category: 'user_behavior',
      data: {
        action,
        ...data,
        timestamp: new Date()
      },
      userId
    });
  }

  // Performance monitoring
  public logPerformanceMetric(metric: string, value: number, context?: any) {
    const severity = value > 2000 ? 'high' : value > 1000 ? 'medium' : 'low';
    
    this.irisBrain.captureEvent({
      type: 'performance',
      severity,
      category: 'metrics',
      data: {
        metric,
        value,
        context,
        timestamp: new Date()
      }
    });
  }

  // Error tracking
  public logError(error: Error, context?: any, userId?: string) {
    this.irisBrain.captureEvent({
      type: 'error',
      severity: 'high',
      category: 'application_error',
      data: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        context,
        timestamp: new Date()
      },
      userId
    });

    // Trigger immediate AI analysis for errors
    this.irisBrain.analyzeError(error, context);
  }

  // System event logging
  public logSystemEvent(event: string, data?: any, severity: 'low' | 'medium' | 'high' | 'critical' = 'low') {
    this.irisBrain.captureEvent({
      type: 'system_event',
      severity,
      category: 'system',
      data: {
        event,
        ...data,
        timestamp: new Date()
      }
    });
  }

  // Financial transaction monitoring (specific to Mulah)
  public logFinancialEvent(
    type: 'payment' | 'subscription' | 'virtual_card' | 'buffer',
    data: any,
    userId?: string
  ) {
    const severity = data.amount > 1000 ? 'medium' : 'low';
    
    this.irisBrain.captureEvent({
      type: 'system_event',
      severity,
      category: 'financial',
      data: {
        transactionType: type,
        ...data,
        timestamp: new Date()
      },
      userId
    });
  }

  // Start monitoring services
  public startMonitoring() {
    this.irisBrain.startMonitoring(30000); // 30 second intervals
    console.log('IRIS Monitoring Service started');
  }

  // Stop monitoring
  public stopMonitoring() {
    this.irisBrain.stopMonitoring();
    console.log('IRIS Monitoring Service stopped');
  }

  // Singleton pattern
  private static instance: MonitoringService;

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }
}