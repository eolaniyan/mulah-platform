import Anthropic from '@anthropic-ai/sdk';

export interface TelemetryEvent {
  id: string;
  timestamp: Date;
  type: 'api_call' | 'db_query' | 'error' | 'performance' | 'user_action' | 'system_event';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  data: any;
  userId?: string;
  sessionId?: string;
  context?: Record<string, any>;
}

export interface AIInsight {
  id: string;
  timestamp: Date;
  type: 'anomaly' | 'prediction' | 'recommendation' | 'pattern';
  confidence: number; // 0-1
  title: string;
  description: string;
  data: any;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  components: {
    api: { status: string; responseTime: number; errorRate: number };
    database: { status: string; connections: number; slowQueries: number };
    memory: { usage: number; available: number; percentage: number };
    cpu: { usage: number; processes: number };
    ai: { status: string; lastCheck: Date; modelsAvailable: boolean };
  };
  lastCheck: Date;
}

export interface GovernanceDecision {
  id: string;
  timestamp: Date;
  type: 'automated' | 'human_required' | 'emergency';
  action: string;
  confidence: number;
  autonomyLevel: 1 | 2 | 3 | 4;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  rationale: string;
  humanApprovalRequired: boolean;
}

export class IRISBrain {
  private static instance: IRISBrain;
  private anthropic: Anthropic;
  private telemetryEvents: TelemetryEvent[] = [];
  private insights: AIInsight[] = [];
  private decisions: GovernanceDecision[] = [];
  private maxTelemetryEvents = 1000;
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private apiDisabled = false;
  private apiDisabledUntil: Date | null = null;
  private lastApiCall: Date | null = null;
  private apiCallCount = 0;
  private readonly API_RATE_LIMIT = 10; // max calls per minute
  private readonly API_COOLDOWN = 60000; // 1 minute cooldown after rate limit

  private constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('ANTHROPIC_API_KEY not set - IRIS AI features disabled');
      this.apiDisabled = true;
      this.anthropic = null as any;
    } else {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }

  private isApiAvailable(): boolean {
    // Check if API is disabled due to credits or errors
    if (this.apiDisabled) return false;
    
    // Check cooldown period
    if (this.apiDisabledUntil && new Date() < this.apiDisabledUntil) {
      return false;
    } else if (this.apiDisabledUntil) {
      this.apiDisabledUntil = null;
      this.apiCallCount = 0;
    }
    
    // Rate limiting
    const now = new Date();
    if (this.lastApiCall && now.getTime() - this.lastApiCall.getTime() < 60000) {
      if (this.apiCallCount >= this.API_RATE_LIMIT) {
        console.log('IRIS: Rate limit reached, cooling down...');
        this.apiDisabledUntil = new Date(now.getTime() + this.API_COOLDOWN);
        return false;
      }
    } else {
      this.apiCallCount = 0;
    }
    
    return true;
  }

  private recordApiCall(): void {
    this.lastApiCall = new Date();
    this.apiCallCount++;
  }

  private handleApiError(error: any): void {
    // Check for credit/billing errors - disable API for extended period
    if (error?.status === 400 && error?.error?.error?.message?.includes('credit balance')) {
      console.log('IRIS: API credits exhausted - disabling AI features for 1 hour');
      this.apiDisabledUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    }
  }

  public static getInstance(): IRISBrain {
    if (!IRISBrain.instance) {
      IRISBrain.instance = new IRISBrain();
    }
    return IRISBrain.instance;
  }

  // Telemetry Collection
  public captureEvent(event: Omit<TelemetryEvent, 'id' | 'timestamp'>): void {
    const telemetryEvent: TelemetryEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...event
    };

    this.telemetryEvents.push(telemetryEvent);

    // Cleanup old events if we exceed the limit
    if (this.telemetryEvents.length > this.maxTelemetryEvents) {
      this.telemetryEvents = this.telemetryEvents.slice(-this.maxTelemetryEvents);
    }

    // Trigger real-time analysis for critical events
    if (event.severity === 'critical') {
      this.analyzeEventImmediate(telemetryEvent);
    }
  }

  // AI-Powered Error Analysis
  public async analyzeError(error: any, context?: Record<string, any>): Promise<AIInsight> {
    // Check if API is available before making call
    if (!this.isApiAvailable()) {
      const fallbackInsight: AIInsight = {
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        type: 'anomaly',
        confidence: 0.3,
        title: 'Error Analysis Unavailable',
        description: 'AI analysis service is currently rate-limited or unavailable',
        data: { error: error?.message || 'Unknown error' },
        actionable: false,
        priority: 'low'
      };
      return fallbackInsight;
    }

    this.recordApiCall();

    try {
      const prompt = `
Analyze this error in the context of a financial middleware platform called Mulah:

Error: ${JSON.stringify(error, null, 2)}
Context: ${context ? JSON.stringify(context, null, 2) : 'None'}

Recent telemetry patterns: ${JSON.stringify(this.getRecentPatterns(), null, 2)}

Please provide:
1. Root cause analysis
2. Potential impact on the financial platform
3. Recommended immediate actions
4. Prevention strategies
5. Confidence level (0-1)

Format as JSON with keys: rootCause, impact, immediateActions, prevention, confidence
`;

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const analysisText = response.content[0].type === 'text' ? response.content[0].text : '';
      let analysis;
      
      try {
        analysis = JSON.parse(analysisText);
      } catch {
        analysis = {
          rootCause: 'AI analysis failed to parse',
          impact: 'Unknown impact',
          immediateActions: ['Check system logs', 'Monitor for related errors'],
          prevention: ['Improve error handling', 'Add more monitoring'],
          confidence: 0.3
        };
      }

      const insight: AIInsight = {
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        type: 'anomaly',
        confidence: analysis.confidence || 0.5,
        title: `Error Analysis: ${error.message || 'System Error'}`,
        description: analysis.rootCause,
        data: analysis,
        actionable: true,
        priority: analysis.confidence > 0.8 ? 'high' : 'medium'
      };

      this.insights.push(insight);
      return insight;
    } catch (err: any) {
      // Handle API errors and apply cooldown if needed
      this.handleApiError(err);
      
      const fallbackInsight: AIInsight = {
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        type: 'anomaly',
        confidence: 0.3,
        title: 'Error Analysis Unavailable',
        description: 'AI analysis service is currently unavailable',
        data: { error: error?.message || 'Unknown error' },
        actionable: false,
        priority: 'low'
      };

      this.insights.push(fallbackInsight);
      return fallbackInsight;
    }
  }

  // User Behavior Analysis
  public async analyzeBehavior(behaviorData: any): Promise<any> {
    try {
      const { userId, actions, page, sessionDuration, patterns } = behaviorData;
      
      // Analyze user behavior patterns for potential issues
      const alerts = [];
      const insights = [];
      let riskScore = 0;

      // Pattern Analysis
      if (patterns.errors.length >= 3) {
        alerts.push({
          type: 'error_pattern',
          title: 'Multiple errors detected',
          description: 'You\'ve encountered several errors. Let me help troubleshoot this.',
          suggestedAction: 'Create support case with error details',
          confidence: 0.9,
          page,
          context: { errorCount: patterns.errors.length }
        });
        riskScore += 30;
      }

      if (patterns.clicks.length >= 10) {
        const clickFrequency = patterns.clicks.length / (sessionDuration / 1000 / 60); // clicks per minute
        if (clickFrequency > 5) {
          alerts.push({
            type: 'confusion',
            title: 'Having trouble finding something?',
            description: 'I noticed you\'re clicking around quite a bit. Can I help you navigate?',
            suggestedAction: 'Show contextual help or navigation guide',
            confidence: 0.7,
            page,
            context: { clickFrequency: clickFrequency.toFixed(1) }
          });
          riskScore += 20;
        }
      }

      if (sessionDuration > 10 * 60 * 1000) { // More than 10 minutes on one page
        const recentActions = actions.filter((a: any) => 
          Date.now() - a.timestamp < 5 * 60 * 1000 // Last 5 minutes
        );
        if (recentActions.length < 3) {
          alerts.push({
            type: 'stuck',
            title: 'Stuck on this page?',
            description: 'You\'ve been here a while with minimal activity. Need assistance?',
            suggestedAction: 'Offer guided tour or help',
            confidence: 0.6,
            page,
            context: { sessionDuration: Math.round(sessionDuration / 1000 / 60) }
          });
          riskScore += 15;
        }
      }

      // Check for abandoned flows
      const formErrors = actions.filter((a: any) => a.type === 'form_error');
      if (formErrors.length >= 2) {
        alerts.push({
          type: 'abandoned_flow',
          title: 'Form giving you trouble?',
          description: 'I see you\'re having issues with this form. Let me help you complete it.',
          suggestedAction: 'Provide form assistance or validation help',
          confidence: 0.8,
          page,
          context: { formErrors: formErrors.length }
        });
        riskScore += 25;
      }

      // Generate insights
      if (riskScore > 40) {
        insights.push({
          type: 'high_risk',
          message: 'User appears to be struggling significantly',
          recommendation: 'Immediate intervention recommended'
        });
      } else if (riskScore > 20) {
        insights.push({
          type: 'medium_risk',
          message: 'User showing signs of confusion or difficulty',
          recommendation: 'Proactive help should be offered'
        });
      }

      return {
        alerts: alerts.slice(0, 2), // Limit to 2 alerts to avoid overwhelming
        insights,
        riskScore: Math.min(riskScore, 100),
        analyzed: true
      };
    } catch (error: any) {
      console.error('IRIS Behavior Analysis Error:', error);
      return {
        alerts: [],
        insights: [],
        riskScore: 0,
        analyzed: false,
        error: error?.message || 'Unknown error'
      };
    }
  }

  // Support Case Issue Analysis
  public async analyzeIssue(issueData: {
    userId: string;
    caseId: number;
    title: string;
    description: string;
    category: string;
    systemState?: any;
    userHistory?: any;
    isProactive?: boolean;
    force?: boolean;
  }): Promise<{ 
    analysis: string; 
    suggestedSolution: string; 
    autoResolved: boolean; 
    confidence: number;
    escalationNeeded: boolean;
    category: string;
  }> {
    try {
      // Check if API is available
      if (!this.isApiAvailable()) {
        return {
          analysis: 'AI analysis temporarily unavailable',
          suggestedSolution: 'Please wait for a support agent to review your case.',
          autoResolved: false,
          confidence: 0,
          escalationNeeded: true,
          category: issueData.category
        };
      }

      this.recordApiCall();

      const prompt = `
You are IRIS, an AI support assistant for the Mulah financial platform.

Analyze this support case and provide guidance:

Case Details:
- Title: ${issueData.title}
- Description: ${issueData.description}
- Category: ${issueData.category}
- User History: ${JSON.stringify(issueData.userHistory || {}, null, 2)}
- System State: ${JSON.stringify(issueData.systemState || {}, null, 2)}

Provide your analysis in JSON format:
{
  "analysis": "Brief analysis of the issue",
  "suggestedSolution": "Step-by-step solution or guidance for the user",
  "autoResolved": true/false (can this be automatically resolved with guidance?),
  "confidence": 0.0-1.0 (how confident are you in the solution?),
  "escalationNeeded": true/false (does this need human attention?),
  "category": "subscription|payment|account|technical|other"
}
`;

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const textContent = response.content.find((c: any) => c.type === 'text');
      const text = (textContent as any)?.text || '{}';
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0]);
          return {
            analysis: result.analysis || 'Analysis completed',
            suggestedSolution: result.suggestedSolution || 'Please contact support for assistance.',
            autoResolved: result.autoResolved || false,
            confidence: result.confidence || 0.5,
            escalationNeeded: result.escalationNeeded || false,
            category: result.category || issueData.category
          };
        } catch {
          // JSON parse failed
        }
      }

      return {
        analysis: 'Issue received and logged',
        suggestedSolution: 'A support agent will review your case shortly.',
        autoResolved: false,
        confidence: 0.3,
        escalationNeeded: true,
        category: issueData.category
      };
    } catch (error: any) {
      console.error('IRIS Issue Analysis Error:', error);
      this.handleApiError(error);
      
      return {
        analysis: 'Unable to analyze issue at this time',
        suggestedSolution: 'Please wait for a support agent to review your case.',
        autoResolved: false,
        confidence: 0,
        escalationNeeded: true,
        category: issueData.category
      };
    }
  }

  // Predictive Issue Detection
  public async predictIssues(): Promise<AIInsight[]> {
    // Check if API is available before making call
    if (!this.isApiAvailable()) {
      return [];
    }

    this.recordApiCall();

    const recentEvents = this.telemetryEvents.slice(-100);
    const patterns = this.detectPatterns();

    try {
      const prompt = `
Analyze these system patterns for the Mulah financial platform to predict potential issues:

Recent Events: ${JSON.stringify(recentEvents.slice(-20), null, 2)}
Detected Patterns: ${JSON.stringify(patterns, null, 2)}

Predict potential issues in the next 24-48 hours, considering:
1. Financial transaction processing risks
2. Database performance degradation
3. API reliability concerns
4. Security vulnerabilities
5. User experience impacts

Format as JSON array with objects containing: type, confidence, title, description, priority, timeframe, preventiveActions
`;

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const predictionsText = response.content[0].type === 'text' ? response.content[0].text : '';
      let predictions;
      
      try {
        predictions = JSON.parse(predictionsText);
      } catch {
        predictions = [{
          type: 'prediction',
          confidence: 0.3,
          title: 'Prediction Analysis Unavailable',
          description: 'AI prediction service is currently unavailable',
          priority: 'low',
          timeframe: 'unknown',
          preventiveActions: ['Check system manually']
        }];
      }

      const predictiveInsights: AIInsight[] = predictions.map((pred: any) => ({
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        type: 'prediction',
        confidence: pred.confidence || 0.5,
        title: pred.title,
        description: pred.description,
        data: pred,
        actionable: true,
        priority: pred.priority || 'medium'
      }));

      this.insights.push(...predictiveInsights);
      return predictiveInsights;
    } catch (err: any) {
      this.handleApiError(err);
      return [];
    }
  }

  // System Health Monitoring
  public async getSystemHealth(): Promise<SystemHealth> {
    const now = new Date();
    const recentErrors = this.telemetryEvents.filter(
      e => e.type === 'error' && e.timestamp > new Date(now.getTime() - 5 * 60 * 1000)
    );

    const recentApiCalls = this.telemetryEvents.filter(
      e => e.type === 'api_call' && e.timestamp > new Date(now.getTime() - 5 * 60 * 1000)
    );

    const avgResponseTime = recentApiCalls.length > 0 
      ? recentApiCalls.reduce((sum, e) => sum + (e.data?.responseTime || 0), 0) / recentApiCalls.length
      : 0;

    const errorRate = recentApiCalls.length > 0 
      ? (recentErrors.length / recentApiCalls.length) * 100
      : 0;

    // Mock system metrics (in a real system, these would come from actual monitoring)
    const memoryUsage = Math.random() * 80 + 10; // 10-90%
    const cpuUsage = Math.random() * 60 + 10; // 10-70%

    const health: SystemHealth = {
      overall: errorRate > 10 || memoryUsage > 90 || cpuUsage > 80 ? 'critical' :
               errorRate > 5 || memoryUsage > 75 || cpuUsage > 60 ? 'warning' : 'healthy',
      components: {
        api: {
          status: errorRate > 10 ? 'critical' : errorRate > 5 ? 'warning' : 'healthy',
          responseTime: Math.round(avgResponseTime),
          errorRate: Math.round(errorRate * 100) / 100
        },
        database: {
          status: 'healthy',
          connections: Math.floor(Math.random() * 10) + 5,
          slowQueries: Math.floor(Math.random() * 3)
        },
        memory: {
          usage: Math.round(memoryUsage * 100) / 100,
          available: Math.round((100 - memoryUsage) * 100) / 100,
          percentage: Math.round(memoryUsage)
        },
        cpu: {
          usage: Math.round(cpuUsage * 100) / 100,
          processes: Math.floor(Math.random() * 20) + 10
        },
        ai: {
          status: 'healthy',
          lastCheck: now,
          modelsAvailable: true
        }
      },
      lastCheck: now
    };

    this.captureEvent({
      type: 'system_event',
      severity: health.overall === 'critical' ? 'critical' : 
                health.overall === 'warning' ? 'medium' : 'low',
      category: 'health_check',
      data: health
    });

    return health;
  }

  // Governance and Decision Making
  public async makeDecision(
    action: string, 
    context: any, 
    autonomyLevel: 1 | 2 | 3 | 4 = 2
  ): Promise<GovernanceDecision> {
    try {
      const prompt = `
As IRIS Brain for the Mulah financial platform, evaluate this proposed action:

Action: ${action}
Context: ${JSON.stringify(context, null, 2)}
Autonomy Level: ${autonomyLevel} (1=observe, 2=recommend, 3=act with approval, 4=full autonomy)

Consider:
1. Financial system safety and integrity
2. User data protection and privacy
3. Regulatory compliance requirements
4. Business continuity impact
5. Risk assessment

Provide decision analysis with confidence score (0-1) and whether human approval is required.
Format as JSON: { shouldExecute: boolean, confidence: number, rationale: string, humanApprovalRequired: boolean, riskLevel: string }
`;

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const decisionText = response.content[0].type === 'text' ? response.content[0].text : '';
      let analysis;
      
      try {
        analysis = JSON.parse(decisionText);
      } catch {
        analysis = {
          shouldExecute: false,
          confidence: 0.3,
          rationale: 'AI analysis failed - defaulting to human approval required',
          humanApprovalRequired: true,
          riskLevel: 'high'
        };
      }

      const decision: GovernanceDecision = {
        id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        type: analysis.riskLevel === 'high' ? 'human_required' : 'automated',
        action,
        confidence: analysis.confidence || 0.5,
        autonomyLevel,
        status: 'pending',
        rationale: analysis.rationale,
        humanApprovalRequired: analysis.humanApprovalRequired || autonomyLevel < 4
      };

      this.decisions.push(decision);
      return decision;
    } catch (err) {
      console.error('IRIS Brain decision making failed:', err);
      
      const fallbackDecision: GovernanceDecision = {
        id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        type: 'human_required',
        action,
        confidence: 0.1,
        autonomyLevel,
        status: 'pending',
        rationale: 'AI decision service unavailable - human approval required',
        humanApprovalRequired: true
      };

      this.decisions.push(fallbackDecision);
      return fallbackDecision;
    }
  }

  // Pattern Detection
  private detectPatterns(): any {
    const recentEvents = this.telemetryEvents.slice(-100);
    const patterns = {
      errorFrequency: {} as Record<string, number>,
      apiCallPatterns: {} as Record<string, number>,
      userActionPatterns: {} as Record<string, number>,
      performancePatterns: [] as Array<{ timestamp: Date; responseTime: number; endpoint: string }>
    };

    recentEvents.forEach(event => {
      // Error frequency patterns
      if (event.type === 'error') {
        const errorType = event.data?.type || 'unknown';
        patterns.errorFrequency[errorType] = (patterns.errorFrequency[errorType] || 0) + 1;
      }

      // API call patterns
      if (event.type === 'api_call') {
        const endpoint = event.data?.endpoint || 'unknown';
        patterns.apiCallPatterns[endpoint] = (patterns.apiCallPatterns[endpoint] || 0) + 1;
      }

      // Performance patterns
      if (event.type === 'performance' && event.data?.responseTime) {
        patterns.performancePatterns.push({
          timestamp: event.timestamp,
          responseTime: event.data.responseTime,
          endpoint: event.data.endpoint
        });
      }
    });

    return patterns;
  }

  private getRecentPatterns(): any {
    return this.detectPatterns();
  }

  private async analyzeEventImmediate(event: TelemetryEvent): Promise<void> {
    if (event.severity === 'critical') {
      await this.analyzeError(event.data, event.context);
    }
  }

  // Autonomous Monitoring
  public startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.getSystemHealth();
        
        // Trigger predictions every 5 minutes
        if (Date.now() % (5 * 60 * 1000) < intervalMs) {
          await this.predictIssues();
        }
      } catch (err) {
        console.error('IRIS monitoring cycle failed:', err);
      }
    }, intervalMs);

    console.log('IRIS Brain monitoring started');
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('IRIS Brain monitoring stopped');
  }

  // Emergency Stop
  public emergencyStop(): void {
    this.stopMonitoring();
    console.log('IRIS Brain emergency stop activated');
    
    this.captureEvent({
      type: 'system_event',
      severity: 'critical',
      category: 'emergency_stop',
      data: { timestamp: new Date(), trigger: 'manual' }
    });
  }

  // Data Access Methods
  public getTelemetryEvents(limit: number = 100): TelemetryEvent[] {
    return this.telemetryEvents.slice(-limit);
  }

  public getInsights(limit: number = 50): AIInsight[] {
    return this.insights.slice(-limit);
  }

  public getDecisions(limit: number = 25): GovernanceDecision[] {
    return this.decisions.slice(-limit);
  }

  public approveDecision(decisionId: string): boolean {
    const decision = this.decisions.find(d => d.id === decisionId);
    if (decision) {
      decision.status = 'approved';
      return true;
    }
    return false;
  }

  public rejectDecision(decisionId: string): boolean {
    const decision = this.decisions.find(d => d.id === decisionId);
    if (decision) {
      decision.status = 'rejected';
      return true;
    }
    return false;
  }

  // ===== NAVIGATION MAP =====
  // Complete catalog of all pages/features for user guidance
  
  public readonly navigationMap: NavigationItem[] = [
    // Home
    {
      path: '/',
      name: 'Home',
      hub: 'global',
      description: 'Your Mulah home - quick access to Subscription Hub and Finance Hub',
      features: ['Monthly spend overview', 'Hub entry cards', 'Quick actions', 'Upcoming bills preview'],
      helpTips: ['Tap a hub card to explore', 'Check your upcoming bills at a glance']
    },
    // Subscription Hub
    {
      path: '/subscriptions',
      name: 'Dashboard',
      hub: 'subscriptions',
      description: 'Overview of your subscriptions, monthly spending, and quick actions',
      features: ['Monthly total', 'Upcoming renewals', 'Quick add subscription', 'Category breakdown'],
      helpTips: ['Tap any card to see details', 'Swipe left on a subscription to see quick actions']
    },
    {
      path: '/add',
      name: 'Add Subscription',
      hub: 'subscriptions',
      description: 'Add a new subscription to track',
      features: ['Service catalog', 'Plan selection', 'Custom entry', 'Automatic pricing'],
      helpTips: ['Search for your service or browse by category', 'Select a plan to auto-fill pricing details']
    },
    {
      path: '/usw',
      name: 'Unified Subscription Wallet',
      hub: 'subscriptions',
      description: 'See your total monthly subscription costs and Mulah fees',
      features: ['Total monthly cost', 'Fee breakdown', 'Premium savings', 'Payment schedule'],
      helpTips: ['This shows what you pay to Mulah each month', 'Premium users get discounted fees']
    },
    {
      path: '/cards',
      name: 'Virtual Cards',
      hub: 'subscriptions',
      description: 'Manage virtual payment cards for subscriptions',
      features: ['View cards', 'Spending limits', 'Freeze cards', 'Transaction history'],
      helpTips: ['Each subscription can have its own virtual card', 'Freeze a card to instantly stop payments']
    },
    {
      path: '/family',
      name: 'Family Sharing',
      hub: 'subscriptions',
      description: 'Share subscriptions with family members and split costs',
      features: ['Create family group', 'Add members', 'Share subscriptions', 'Cost splitting'],
      helpTips: ['Only family-eligible plans can be cost-split', 'The owner manages who gets access']
    },
    {
      path: '/calendar',
      name: 'Bill Calendar',
      hub: 'subscriptions',
      description: 'See when your subscriptions renew',
      features: ['Monthly view', 'Upcoming bills', 'Payment reminders', 'Renewal dates'],
      helpTips: ['Tap a date to see what bills are due', 'Set reminders before renewal dates']
    },
    {
      path: '/concierge',
      name: 'Concierge',
      hub: 'subscriptions',
      description: 'Get help cancelling difficult subscriptions',
      features: ['Request assistance', 'Track requests', 'Status updates', 'Support chat'],
      helpTips: ['Some services require our team to help cancel', 'We handle the back-and-forth for you']
    },
    // Finance Hub
    {
      path: '/cashflow',
      name: 'Cashflow',
      hub: 'finance',
      description: 'Analyze your income vs expenses',
      features: ['Income tracking', 'Expense breakdown', 'Category analysis', 'Trends'],
      helpTips: ['See where your money goes', 'Identify spending patterns']
    },
    {
      path: '/insights',
      name: 'Financial Insights',
      hub: 'finance',
      description: 'AI-powered analysis of your finances',
      features: ['Health score', 'Spending patterns', 'Recommendations', 'Anomaly detection'],
      helpTips: ['Get personalized tips to save money', 'See how your spending compares to your budget']
    },
    {
      path: '/analytics',
      name: 'Analytics',
      hub: 'finance',
      description: 'Detailed analytics and charts for your subscriptions',
      features: ['Category breakdown', 'Spending trends', 'Savings opportunities', 'Transaction history'],
      helpTips: ['Find subscriptions you might want to cancel', 'See yearly vs monthly savings potential']
    },
    // Support & Settings
    {
      path: '/support',
      name: 'Support',
      hub: 'global',
      description: 'Get help with Mulah',
      features: ['Contact support', 'View tickets', 'FAQ', 'Chat with IRIS'],
      helpTips: ['IRIS can answer most questions instantly', 'Create a ticket for complex issues']
    },
    {
      path: '/profile',
      name: 'Profile',
      hub: 'global',
      description: 'Manage your account settings',
      features: ['Account info', 'Preferences', 'Notifications', 'Security'],
      helpTips: ['Keep your email up to date', 'Enable notifications for bill reminders']
    }
  ];

  // Get navigation help based on user's current context
  public getNavigationHelp(currentPath: string, userIntent?: string): NavigationHelp {
    const currentPage = this.navigationMap.find(n => n.path === currentPath);
    
    // Find related pages based on current hub
    const relatedPages = this.navigationMap.filter(n => 
      n.hub === currentPage?.hub && n.path !== currentPath
    ).slice(0, 3);
    
    // Match user intent to suggested pages
    let suggestedPages: NavigationItem[] = [];
    if (userIntent) {
      const intentLower = userIntent.toLowerCase();
      suggestedPages = this.navigationMap.filter(n =>
        n.description.toLowerCase().includes(intentLower) ||
        n.features.some(f => f.toLowerCase().includes(intentLower)) ||
        n.name.toLowerCase().includes(intentLower)
      ).slice(0, 3);
    }
    
    return {
      currentPage,
      relatedPages,
      suggestedPages,
      quickActions: this.getQuickActionsForPage(currentPath)
    };
  }

  // Get quick actions for a specific page
  private getQuickActionsForPage(path: string): QuickAction[] {
    const actions: Record<string, QuickAction[]> = {
      '/': [
        { label: 'Subscription Hub', action: 'navigate', target: '/subscriptions' },
        { label: 'Finance Hub', action: 'navigate', target: '/cashflow' },
        { label: 'Add Subscription', action: 'navigate', target: '/add' }
      ],
      '/subscriptions': [
        { label: 'Add New', action: 'navigate', target: '/add' },
        { label: 'View USW Total', action: 'navigate', target: '/usw' }
      ],
      '/family': [
        { label: 'Add Member', action: 'modal', target: 'add-member' },
        { label: 'Share Subscription', action: 'modal', target: 'share-subscription' }
      ],
      '/usw': [
        { label: 'View Breakdown', action: 'scroll', target: 'fee-breakdown' },
        { label: 'Go Premium', action: 'modal', target: 'premium-upgrade' }
      ]
    };
    
    return actions[path] || [];
  }

  // Answer user questions using page context
  public async answerUserQuestion(
    question: string,
    context: { currentPath: string; scrollPosition?: number; recentActions?: string[] }
  ): Promise<IRISResponse> {
    const navHelp = this.getNavigationHelp(context.currentPath, question);
    
    // Check if this is a navigation question
    if (this.isNavigationQuestion(question)) {
      const destination = this.findDestinationForQuestion(question);
      if (destination) {
        return {
          type: 'navigation',
          message: `I can take you to ${destination.name}. ${destination.description}`,
          action: { type: 'navigate', target: destination.path },
          suggestions: destination.helpTips
        };
      }
    }
    
    // Check if this is a "how do I" question
    if (this.isHowToQuestion(question)) {
      const howToAnswer = this.getHowToAnswer(question, navHelp.currentPage);
      if (howToAnswer) {
        return {
          type: 'guidance',
          message: howToAnswer.message,
          steps: howToAnswer.steps,
          suggestions: howToAnswer.relatedTips
        };
      }
    }
    
    // Use AI for complex questions (if API available)
    if (this.isApiAvailable()) {
      return await this.getAIResponse(question, context, navHelp);
    }
    
    // Fallback response
    return {
      type: 'info',
      message: `I'm here to help! You're currently on the ${navHelp.currentPage?.name || 'page'}. What would you like to do?`,
      suggestions: navHelp.currentPage?.helpTips || ['Try asking "How do I add a subscription?"']
    };
  }

  private isNavigationQuestion(question: string): boolean {
    const navPatterns = ['where', 'take me', 'go to', 'find', 'show me', 'open', 'navigate'];
    return navPatterns.some(p => question.toLowerCase().includes(p));
  }

  private isHowToQuestion(question: string): boolean {
    const howToPatterns = ['how do i', 'how can i', 'how to', 'can i', 'help me'];
    return howToPatterns.some(p => question.toLowerCase().includes(p));
  }

  private findDestinationForQuestion(question: string): NavigationItem | undefined {
    const q = question.toLowerCase();
    return this.navigationMap.find(n =>
      q.includes(n.name.toLowerCase()) ||
      n.features.some(f => q.includes(f.toLowerCase()))
    );
  }

  private getHowToAnswer(question: string, currentPage?: NavigationItem): { message: string; steps: string[]; relatedTips: string[] } | null {
    const q = question.toLowerCase();
    
    // Common how-to answers
    const howToAnswers: Record<string, { message: string; steps: string[]; relatedTips: string[] }> = {
      'add subscription': {
        message: 'Here\'s how to add a subscription:',
        steps: ['Go to the Dashboard and tap the + button, or navigate to /add', 'Search for your service or browse categories', 'Select the plan you have', 'Confirm the details'],
        relatedTips: ['You can also add custom subscriptions', 'The cost will be auto-filled from our catalog']
      },
      'cancel': {
        message: 'To cancel a subscription:',
        steps: ['Go to your Subscriptions list', 'Find the subscription you want to cancel', 'Tap on it to open details', 'Select "Cancel" or "Delete"'],
        relatedTips: ['Some subscriptions need Concierge help to cancel', 'Cancelling removes it from Mulah - you may still need to cancel with the service']
      },
      'share': {
        message: 'To share a subscription with family:',
        steps: ['Go to Family Sharing', 'Create or select your family group', 'Tap "Share Subscription"', 'Choose the subscription and set cost splits'],
        relatedTips: ['Only family-eligible plans can be shared', 'The owner pays the full amount, members pay their split to you']
      },
      'family': {
        message: 'Here\'s how Family Sharing works:',
        steps: ['Create a Family group from the Family page', 'Add members by email or manually', 'Share subscriptions that have family plans', 'Set how costs are split between members'],
        relatedTips: ['Members receive an invite to join', 'You can have one family group with up to 6 members']
      }
    };
    
    for (const [key, answer] of Object.entries(howToAnswers)) {
      if (q.includes(key)) {
        return answer;
      }
    }
    
    return null;
  }

  private async getAIResponse(
    question: string,
    context: { currentPath: string; scrollPosition?: number; recentActions?: string[] },
    navHelp: NavigationHelp
  ): Promise<IRISResponse> {
    try {
      this.recordApiCall();
      
      const prompt = `You are IRIS, the AI assistant for Mulah - a subscription management platform.

User's current page: ${navHelp.currentPage?.name || 'Unknown'}
Page description: ${navHelp.currentPage?.description || 'Unknown'}
Available features: ${navHelp.currentPage?.features?.join(', ') || 'Unknown'}

User's question: "${question}"

Provide a helpful, concise response. If the user needs to go somewhere else, suggest navigation.
Format as JSON: { "message": "...", "type": "info|navigation|guidance", "action": null or { "type": "navigate", "target": "/path" }, "suggestions": ["tip1", "tip2"] }`;

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = response.content.find((c: any) => c.type === 'text');
      const text = (textContent as any)?.text || '{}';
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as IRISResponse;
        } catch {
          // Parse failed
        }
      }
      
      return {
        type: 'info',
        message: text.replace(/```json|```/g, '').trim(),
        suggestions: navHelp.currentPage?.helpTips || []
      };
    } catch (error: any) {
      this.handleApiError(error);
      return {
        type: 'info',
        message: 'I\'m having trouble right now. Please try again or contact support.',
        suggestions: ['Refresh the page', 'Contact support']
      };
    }
  }
}

// Navigation types
export interface NavigationItem {
  path: string;
  name: string;
  hub: 'subscriptions' | 'finance' | 'global';
  description: string;
  features: string[];
  helpTips: string[];
}

export interface QuickAction {
  label: string;
  action: 'navigate' | 'modal' | 'scroll';
  target: string;
}

export interface NavigationHelp {
  currentPage?: NavigationItem;
  relatedPages: NavigationItem[];
  suggestedPages: NavigationItem[];
  quickActions: QuickAction[];
}

export interface IRISResponse {
  type: 'info' | 'navigation' | 'guidance' | 'error';
  message: string;
  action?: { type: string; target: string };
  steps?: string[];
  suggestions?: string[];
}