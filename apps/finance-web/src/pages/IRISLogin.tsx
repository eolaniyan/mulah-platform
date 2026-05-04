import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, Brain, Shield, Lock, User, KeyRound, Fingerprint } from 'lucide-react';

// Neural Network Background Component for IRIS Login
const IRISBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const nodes = Array.from({ length: 15 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 2 + 1,
    }));

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      nodes.forEach((node, i) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.6)';
        ctx.fill();

        // Draw connections
        nodes.forEach((otherNode, j) => {
          if (i === j) return;
          const distance = Math.sqrt(
            Math.pow(node.x - otherNode.x, 2) + Math.pow(node.y - otherNode.y, 2)
          );

          if (distance < 120) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.2 - distance / 600})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)' }}
    />
  );
};

interface IRISLoginProps {
  onAuthenticated: () => void;
}

export default function IRISLogin({ onAuthenticated }: IRISLoginProps) {
  const [, setLocation] = useLocation();
  const [stage, setStage] = useState(1);
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    securityCode: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanAnimation, setScanAnimation] = useState(false);

  // Stage 1: Identifier Input
  const handleStage1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.identifier.trim()) {
      setError('Please enter your email or username');
      return;
    }

    setIsLoading(true);
    setError('');
    setScanAnimation(true);

    // Simulate verification delay
    setTimeout(() => {
      setIsLoading(false);
      setScanAnimation(false);
      setStage(2);
    }, 2000);
  };

  // Stage 2: Password Input
  const handleStage2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError('');
    setScanAnimation(true);

    // Simulate password verification
    setTimeout(() => {
      setIsLoading(false);
      setScanAnimation(false);
      setStage(3);
    }, 1500);
  };

  // Stage 3: Security Code Input
  const handleStage3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.securityCode.trim()) {
      setError('Please enter your security code');
      return;
    }

    setIsLoading(true);
    setError('');
    setScanAnimation(true);

    // Simulate final verification
    setTimeout(() => {
      setIsLoading(false);
      setScanAnimation(false);
      
      // For demo purposes, accept any 6-digit code
      if (formData.securityCode.length === 6) {
        onAuthenticated();
      } else {
        setError('Invalid security code. Please try again.');
        setFormData(prev => ({ ...prev, securityCode: '' }));
      }
    }, 2000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const getStageIcon = () => {
    switch (stage) {
      case 1: return <User className="h-8 w-8 text-blue-400" />;
      case 2: return <Lock className="h-8 w-8 text-purple-400" />;
      case 3: return <Fingerprint className="h-8 w-8 text-green-400" />;
      default: return <User className="h-8 w-8 text-blue-400" />;
    }
  };

  const getStageTitle = () => {
    switch (stage) {
      case 1: return "Identity Verification";
      case 2: return "Credential Validation";
      case 3: return "Security Authentication";
      default: return "Identity Verification";
    }
  };

  const getStageDescription = () => {
    switch (stage) {
      case 1: return "Enter your administrator credentials to access IRIS";
      case 2: return "Provide your secure password for verification";
      case 3: return "Complete authentication with your security code";
      default: return "Enter your administrator credentials to access IRIS";
    }
  };

  // Hide on mobile - web only
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <CardTitle className="text-white">Access Restricted</CardTitle>
            <CardDescription className="text-gray-400">
              IRIS is only accessible from desktop devices for security reasons.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation('/')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Return to Mulah
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <IRISBackground />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* IRIS Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="relative">
                  <Eye className="h-12 w-12 text-blue-400" />
                  {scanAnimation && (
                    <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-30"></div>
                  )}
                </div>
                <Brain className="h-10 w-10 text-purple-400" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
                IRIS
              </h1>
              <p className="text-sm text-gray-400 mt-2">
                Infrastructure Reliability & Intelligence System
              </p>
            </div>
          </div>

          {/* Authentication Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    stepNumber <= stage 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-400'
                  } ${stepNumber === stage ? 'ring-2 ring-blue-400 animate-pulse' : ''}`}>
                    {stepNumber < stage ? '✓' : stepNumber}
                  </div>
                  {stepNumber < 3 && (
                    <div className={`w-16 h-0.5 transition-colors ${
                      stepNumber < stage ? 'bg-blue-600' : 'bg-gray-700'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">
                Step {stage} of 3
              </div>
            </div>
          </div>

          {/* Authentication Card */}
          <Card className="bg-black/60 border-gray-700 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-3">
                {getStageIcon()}
              </div>
              <CardTitle className="text-white text-xl">
                {getStageTitle()}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {getStageDescription()}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {error && (
                <Alert className="bg-red-900/20 border-red-500/30">
                  <AlertDescription className="text-red-300">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {stage === 1 && (
                <form onSubmit={handleStage1Submit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="identifier" className="text-gray-300">
                      Email or Username
                    </Label>
                    <Input
                      id="identifier"
                      type="text"
                      value={formData.identifier}
                      onChange={(e) => handleInputChange('identifier', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="admin@mulah.com"
                      autoFocus
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 animate-spin" />
                        Verifying Identity...
                      </div>
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </form>
              )}

              {stage === 2 && (
                <form onSubmit={handleStage2Submit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-300">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="Enter your secure password"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setStage(1)}
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 animate-spin" />
                          Validating...
                        </div>
                      ) : (
                        'Continue'
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {stage === 3 && (
                <form onSubmit={handleStage3Submit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="securityCode" className="text-gray-300">
                      Security Code
                    </Label>
                    <Input
                      id="securityCode"
                      type="text"
                      value={formData.securityCode}
                      onChange={(e) => handleInputChange('securityCode', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white text-center text-lg tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 text-center">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setStage(2)}
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <Fingerprint className="h-4 w-4 animate-spin" />
                          Authenticating...
                        </div>
                      ) : (
                        'Access IRIS'
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {/* Security Notice */}
              <div className="mt-6 p-3 bg-gray-900/50 rounded-lg border border-gray-600">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Shield className="h-3 w-3" />
                  <span>Secure connection • All activities are logged</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Return to Mulah */}
          <div className="text-center mt-6">
            <Button 
              variant="ghost"
              onClick={() => setLocation('/')}
              className="text-gray-400 hover:text-white"
            >
              ← Return to Mulah Platform
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}