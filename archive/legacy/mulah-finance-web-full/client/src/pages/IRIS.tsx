import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import IRISLogin from './IRISLogin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  Brain, 
  Eye, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Settings,
  Zap,
  Monitor,
  TrendingUp,
  BarChart3,
  AlertCircle,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

// Type definitions for IRIS API responses
interface SystemHealthComponent {
  status?: string;
  usage?: number;
  percentage?: number;
  connections?: number;
  slowQueries?: number;
  processes?: number;
  responseTime?: number;
  errorRate?: number;
  modelsAvailable?: boolean;
  lastCheck?: string;
}

interface SystemHealth {
  overall?: string;
  components?: {
    api?: SystemHealthComponent;
    database?: SystemHealthComponent;
    ai?: SystemHealthComponent;
    cpu?: SystemHealthComponent;
    memory?: SystemHealthComponent;
  };
}

interface AIInsight {
  id: string;
  title: string;
  description: string;
  priority: string;
  confidence: number;
}

interface TelemetryEvent {
  id: string;
  timestamp: string;
  type: string;
  data?: {
    responseTime?: number;
    statusCode?: number;
    [key: string]: any;
  };
}

interface GovernanceState {
  autonomyLevel?: number;
  isMonitoring?: boolean;
}

interface GovernanceDecision {
  id: string;
  timestamp: string;
  type: string;
  action: string;
  confidence: number;
  status: string;
  rationale: string;
}

interface AIPreview {
  insightsCount?: number;
  lastAnalysis?: string;
  isActive?: boolean;
}

// Neural Network Background Component
const NeuralNetwork = ({ isActive = true }: { isActive?: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const nodes = Array.from({ length: 20 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 3 + 1,
      connections: []
    }));

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw nodes
      nodes.forEach((node, i) => {
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? 'rgba(147, 51, 234, 0.8)' : 'rgba(147, 51, 234, 0.3)';
        ctx.fill();

        // Find nearby nodes and draw connections
        nodes.forEach((otherNode, j) => {
          if (i === j) return;
          const distance = Math.sqrt(
            Math.pow(node.x - otherNode.x, 2) + Math.pow(node.y - otherNode.y, 2)
          );

          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
            ctx.strokeStyle = isActive 
              ? `rgba(147, 51, 234, ${0.3 - distance / 500})` 
              : `rgba(147, 51, 234, ${0.1 - distance / 1500})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 opacity-20"
      style={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a0a2e 50%, #16213e 100%)' }}
    />
  );
};

// System Health Widget
const SystemHealthWidget = () => {
  const { data: health, isLoading } = useQuery<SystemHealth>({
    queryKey: ['/api/iris/system-health'],
    refetchInterval: 5000
  });

  if (isLoading) {
    return (
      <Card className="bg-black/50 border-purple-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-400" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse flex space-x-4">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="bg-black/50 border-purple-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-400" />
          System Health
        </CardTitle>
        <CardDescription className="text-gray-400">
          Real-time system monitoring
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`flex items-center gap-2 ${getStatusColor(health?.overall || 'unknown')}`}>
          {getStatusIcon(health?.overall || 'unknown')}
          <span className="font-medium">Overall: {health?.overall || 'Unknown'}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className={`flex items-center gap-2 ${getStatusColor(health?.components?.api?.status || 'unknown')}`}>
              {getStatusIcon(health?.components?.api?.status || 'unknown')}
              <span>API: {health?.components?.api?.status || 'Unknown'}</span>
            </div>
            <div className={`flex items-center gap-2 ${getStatusColor(health?.components?.database?.status || 'unknown')}`}>
              {getStatusIcon(health?.components?.database?.status || 'unknown')}
              <span>Database: {health?.components?.database?.status || 'Unknown'}</span>
            </div>
            <div className={`flex items-center gap-2 ${getStatusColor(health?.components?.ai?.status || 'unknown')}`}>
              {getStatusIcon(health?.components?.ai?.status || 'unknown')}
              <span>AI: {health?.components?.ai?.status || 'Unknown'}</span>
            </div>
          </div>
          
          <div className="space-y-2 text-gray-300">
            <div>CPU: {health?.components?.cpu?.usage || 0}%</div>
            <div>Memory: {health?.components?.memory?.percentage || 0}%</div>
            <div>Response: {health?.components?.api?.responseTime || 0}ms</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// AI Insights Widget
const AIInsightsWidget = () => {
  const { data: insights, isLoading } = useQuery<AIInsight[]>({
    queryKey: ['/api/iris/diagnostics/insights'],
    refetchInterval: 30000
  });

  const { data: predictions, isLoading: predictionsLoading } = useQuery<AIInsight[]>({
    queryKey: ['/api/ai/predictions'],
    refetchInterval: 60000
  });

  return (
    <Card className="bg-black/50 border-purple-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-400" />
          AI Insights
        </CardTitle>
        <CardDescription className="text-gray-400">
          Intelligent analysis and predictions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {insights && Array.isArray(insights) ? insights.map((insight: any) => (
                <div key={insight.id} className="p-3 bg-gray-900/50 rounded-lg border border-purple-500/20">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-white font-medium text-sm">{insight.title}</span>
                    <Badge 
                      variant={insight.priority === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {insight.priority}
                    </Badge>
                  </div>
                  <p className="text-gray-300 text-xs">{insight.description}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    Confidence: {Math.round(insight.confidence * 100)}%
                  </div>
                </div>
              )) : null}
              
              {predictions?.map((prediction: any) => (
                <div key={prediction.id} className="p-3 bg-blue-900/20 rounded-lg border border-blue-500/20">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-blue-200 font-medium text-sm">{prediction.title}</span>
                    <Badge variant="outline" className="text-xs border-blue-400 text-blue-400">
                      Prediction
                    </Badge>
                  </div>
                  <p className="text-blue-300 text-xs">{prediction.description}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// Live Performance Charts Component
const LivePerformanceCharts = () => {
  const { data: telemetry } = useQuery<TelemetryEvent[]>({
    queryKey: ['/api/iris/diagnostics/telemetry'],
    refetchInterval: 5000
  });

  const [performanceData, setPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    if (telemetry) {
      const newData = telemetry
        .filter((event: any) => event.type === 'api_call' && event.data?.responseTime)
        .slice(-20)
        .map((event: any) => ({
          time: new Date(event.timestamp).toLocaleTimeString(),
          responseTime: event.data.responseTime,
          status: event.data.statusCode
        }));
      setPerformanceData(newData);
    }
  }, [telemetry]);

  return (
    <Card className="bg-black/50 border-purple-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-400" />
          Live Performance
        </CardTitle>
        <CardDescription className="text-gray-400">
          Real-time API performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-32 flex items-end justify-between gap-1">
          {performanceData.map((data, index) => (
            <div key={index} className="flex flex-col items-center">
              <div 
                className={`w-3 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t transition-all duration-300 ${
                  data.responseTime > 1000 ? 'from-red-600 to-red-400' : 
                  data.responseTime > 500 ? 'from-yellow-600 to-yellow-400' : ''
                }`}
                style={{ height: `${Math.min(data.responseTime / 10, 100)}px` }}
              />
              <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top">
                {data.time.split(':').slice(-1)[0]}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-green-400 text-lg font-bold">
              {performanceData.filter(d => d.responseTime < 500).length}
            </div>
            <div className="text-xs text-gray-400">Fast</div>
          </div>
          <div>
            <div className="text-yellow-400 text-lg font-bold">
              {performanceData.filter(d => d.responseTime >= 500 && d.responseTime < 1000).length}
            </div>
            <div className="text-xs text-gray-400">Slow</div>
          </div>
          <div>
            <div className="text-red-400 text-lg font-bold">
              {performanceData.filter(d => d.responseTime >= 1000).length}
            </div>
            <div className="text-xs text-gray-400">Critical</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// System Diagnostics Tab
const DiagnosticsTab = () => {
  const queryClient = useQueryClient();
  const [selectedCheck, setSelectedCheck] = useState('health');

  const runDiagnosticMutation = useMutation({
    mutationFn: (checkType: string) => apiRequest('POST', '/api/iris/diagnostics/run-check', { checkType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/iris/system-health'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/predictions'] });
    }
  });

  const { data: telemetry } = useQuery({
    queryKey: ['/api/iris/diagnostics/telemetry'],
    refetchInterval: 10000
  });

  return (
    <div className="space-y-6">
      <Card className="bg-black/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Monitor className="h-5 w-5 text-purple-400" />
            System Diagnostics
          </CardTitle>
          <CardDescription className="text-gray-400">
            Run automated system checks and view telemetry data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <select 
              value={selectedCheck}
              onChange={(e) => setSelectedCheck(e.target.value)}
              className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
            >
              <option value="health">Health Check</option>
              <option value="predictions">AI Predictions</option>
              <option value="ai-analysis">AI Analysis Test</option>
            </select>
            <Button 
              onClick={() => runDiagnosticMutation.mutate(selectedCheck)}
              disabled={runDiagnosticMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {runDiagnosticMutation.isPending ? (
                <RotateCcw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Run Check
            </Button>
          </div>

          {runDiagnosticMutation.data && (
            <Alert className="bg-green-900/20 border-green-500/30">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300">
                Diagnostic check completed successfully
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="bg-black/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white">Telemetry Events</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {telemetry?.map((event: any) => (
                <div key={event.id} className="p-3 bg-gray-900/50 rounded border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm">{event.category}</span>
                    <Badge 
                      variant={
                        event.severity === 'critical' ? 'destructive' :
                        event.severity === 'high' ? 'destructive' :
                        event.severity === 'medium' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {event.severity}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-400">
                    {event.type} • {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

// Governance Tab
const GovernanceTab = () => {
  const { data: decisions } = useQuery({
    queryKey: ['/api/ai/governance/decisions'],
    refetchInterval: 30000
  });

  const { data: config } = useQuery({
    queryKey: ['/api/ai/governance/config']
  });

  const emergencyStopMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/ai/governance/emergency-stop', {})
  });

  return (
    <div className="space-y-6">
      <Card className="bg-black/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-400" />
            AI Governance Controls
          </CardTitle>
          <CardDescription className="text-gray-400">
            Monitor and control AI decision-making processes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-sm text-gray-400">Autonomy Level</span>
              <div className="text-white font-medium">Level {config?.autonomyLevel}</div>
            </div>
            <div className="space-y-2">
              <span className="text-sm text-gray-400">Monitoring</span>
              <div className={`flex items-center gap-2 ${config?.isMonitoring ? 'text-green-400' : 'text-red-400'}`}>
                {config?.isMonitoring ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {config?.isMonitoring ? 'Active' : 'Stopped'}
              </div>
            </div>
          </div>

          <Button 
            onClick={() => emergencyStopMutation.mutate()}
            variant="destructive"
            className="w-full"
            disabled={emergencyStopMutation.isPending}
          >
            <Zap className="h-4 w-4 mr-2" />
            Emergency Stop
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-black/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white">AI Decisions</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {decisions?.map((decision: any) => (
                <div key={decision.id} className="p-4 bg-gray-900/50 rounded border border-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-white font-medium text-sm">{decision.action}</span>
                    <Badge 
                      variant={
                        decision.status === 'approved' ? 'default' :
                        decision.status === 'rejected' ? 'destructive' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {decision.status}
                    </Badge>
                  </div>
                  <p className="text-gray-300 text-xs mb-2">{decision.rationale}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Confidence: {Math.round(decision.confidence * 100)}%</span>
                    <span>Level {decision.autonomyLevel}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

// Main IRIS Component
export default function IRIS() {
  const [isSystemActive, setIsSystemActive] = useState(true);
  const [isIRISAuthenticated, setIsIRISAuthenticated] = useState(false);
  
  const { data: alerts } = useQuery({
    queryKey: ['/api/iris/alerts'],
    refetchInterval: 15000
  });

  // Show login if not authenticated
  if (!isIRISAuthenticated) {
    return <IRISLogin onAuthenticated={() => setIsIRISAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <NeuralNetwork isActive={isSystemActive} />
      
      <div className="relative z-10 mobile-container mx-auto p-4">
        {/* IRIS Header */}
        <div className="mobile-header">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <Eye className="h-8 w-8 text-purple-400" />
              <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-20"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                IRIS
              </h1>
              <p className="text-sm text-gray-400">Infrastructure Reliability & Intelligence System</p>
            </div>
          </div>

          {/* System Status */}
          <div className="flex items-center gap-4 mb-4">
            <div className={`flex items-center gap-2 ${isSystemActive ? 'text-green-400' : 'text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full ${isSystemActive ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
              <span className="text-sm">IRIS {isSystemActive ? 'ACTIVE' : 'OFFLINE'}</span>
            </div>
            
            {alerts && alerts.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {alerts.length} Alert{alerts.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="mobile-content">
          <Tabs defaultValue="surveillance" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-900/50 border border-purple-500/30">
              <TabsTrigger value="surveillance" className="data-[state=active]:bg-purple-600">
                <Eye className="h-4 w-4 mr-2" />
                Surveillance
              </TabsTrigger>
              <TabsTrigger value="diagnostics" className="data-[state=active]:bg-purple-600">
                <BarChart3 className="h-4 w-4 mr-2" />
                Diagnostics
              </TabsTrigger>
              <TabsTrigger value="governance" className="data-[state=active]:bg-purple-600">
                <Settings className="h-4 w-4 mr-2" />
                Governance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="surveillance" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <SystemHealthWidget />
                <AIInsightsWidget />
                <LivePerformanceCharts />
              </div>
            </TabsContent>

            <TabsContent value="diagnostics" className="mt-4">
              <DiagnosticsTab />
            </TabsContent>

            <TabsContent value="governance" className="mt-4">
              <GovernanceTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}