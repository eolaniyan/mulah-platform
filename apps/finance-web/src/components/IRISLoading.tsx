import { useState, useEffect, useRef } from 'react';
import { Eye, Brain, Activity } from 'lucide-react';

interface IRISLoadingProps {
  isLoading: boolean;
  onComplete?: () => void;
  steps?: string[];
}

export default function IRISLoading({ 
  isLoading, 
  onComplete, 
  steps = [
    "Initializing IRIS Brain...",
    "Connecting to neural networks...",
    "Analyzing system patterns...",
    "Establishing monitoring protocols...",
    "Activating AI governance...",
    "IRIS System Online"
  ]
}: IRISLoadingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [scanAngle, setScanAngle] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isLoading) return;

    // Progressive loading simulation
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        const next = prev + 1;
        if (next >= steps.length) {
          clearInterval(stepInterval);
          setTimeout(() => onComplete?.(), 500);
          return prev;
        }
        return next;
      });
    }, 1000);

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 2, 100));
    }, 50);

    // Iris scan animation
    const scanInterval = setInterval(() => {
      setScanAngle(prev => (prev + 3) % 360);
    }, 50);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      clearInterval(scanInterval);
    };
  }, [isLoading, steps, onComplete]);

  // Neural particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isLoading) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 400;

    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 2 + 1,
      life: Math.random() * 100,
      maxLife: 100
    }));

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;

        if (particle.life <= 0) {
          particle.x = Math.random() * canvas.width;
          particle.y = Math.random() * canvas.height;
          particle.life = particle.maxLife;
        }

        // Draw particle
        const alpha = particle.life / particle.maxLife;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 51, 234, ${alpha * 0.8})`;
        ctx.fill();

        // Connect to center
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const distance = Math.sqrt(
          Math.pow(particle.x - centerX, 2) + Math.pow(particle.y - centerY, 2)
        );

        if (distance < 150) {
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(centerX, centerY);
          ctx.strokeStyle = `rgba(147, 51, 234, ${alpha * 0.3})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });

      if (isLoading) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Main IRIS Eye */}
        <div className="relative w-32 h-32 mx-auto">
          {/* Outer ring */}
          <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full animate-spin-slow"></div>
          
          {/* Middle ring */}
          <div className="absolute inset-4 border-2 border-blue-500/50 rounded-full animate-spin" style={{
            animationDirection: 'reverse',
            animationDuration: '3s'
          }}></div>
          
          {/* Inner eye */}
          <div className="absolute inset-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
            <Eye className="w-8 h-8 text-white" />
          </div>
          
          {/* Scan line */}
          <div 
            className="absolute inset-0 border-t-2 border-purple-400 rounded-full origin-center"
            style={{ 
              transform: `rotate(${scanAngle}deg)`,
              transition: 'transform 0.05s linear'
            }}
          ></div>
          
          {/* Pulsing aura */}
          <div className="absolute inset-0 bg-purple-400/20 rounded-full animate-ping"></div>
        </div>

        {/* Neural Network Canvas */}
        <div className="relative">
          <canvas 
            ref={canvasRef}
            className="absolute -top-48 -left-48 opacity-40"
            style={{ width: '400px', height: '400px' }}
          />
        </div>

        {/* Loading Progress */}
        <div className="space-y-4 w-80">
          <div className="flex items-center justify-center gap-3">
            <Brain className="w-6 h-6 text-purple-400 animate-pulse" />
            <h2 className="text-xl font-bold text-white">
              IRIS BRAIN INITIALIZATION
            </h2>
            <Activity className="w-6 h-6 text-blue-400 animate-pulse" />
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Current Step */}
          <div className="text-center space-y-2">
            <div className="text-purple-300 font-medium">
              {steps[currentStep]}
            </div>
            <div className="text-sm text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>

          {/* Loading Animation Icons */}
          <div className="flex justify-center gap-4 mt-6">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i <= Math.floor((currentStep / steps.length) * 5)
                    ? 'bg-purple-400 animate-pulse' 
                    : 'bg-gray-700'
                }`}
                style={{ 
                  animationDelay: `${i * 0.2}s`,
                  transform: `scale(${i <= Math.floor((currentStep / steps.length) * 5) ? 1.2 : 1})`
                }}
              ></div>
            ))}
          </div>

          {/* System Status */}
          <div className="bg-black/50 border border-purple-500/30 rounded-lg p-4 mt-6">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="text-center">
                <div className="text-green-400 font-bold">ONLINE</div>
                <div className="text-gray-400">Neural Core</div>
              </div>
              <div className="text-center">
                <div className="text-yellow-400 font-bold">LOADING</div>
                <div className="text-gray-400">AI Engine</div>
              </div>
              <div className="text-center">
                <div className="text-blue-400 font-bold">READY</div>
                <div className="text-gray-400">Monitoring</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scanning Effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-scan"></div>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes scan {
          0% { transform: translateY(-100vh); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        
        .animate-scan {
          animation: scan 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}