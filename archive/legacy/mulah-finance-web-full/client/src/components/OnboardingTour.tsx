import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, Calendar, Brain, BarChart3, ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface OnboardingTourProps {
  onComplete: () => void;
}

const tourSteps = [
  {
    icon: Sparkles,
    iconBg: "bg-amber-400/20",
    iconColor: "text-amber-400",
    title: "Welcome to Mulah!",
    description: "Let's take a quick tour of your new AI finance command center. It'll only take a moment.",
    highlight: "Ready to transform how you manage money?"
  },
  {
    icon: Wallet,
    iconBg: "bg-emerald-400/20",
    iconColor: "text-emerald-400",
    title: "Unified Subscription Wallet",
    description: "USW combines all your subscriptions into one monthly payment. No more surprise charges - just one predictable bill date.",
    highlight: "Tip: Add your subscriptions first, then activate USW"
  },
  {
    icon: Calendar,
    iconBg: "bg-blue-400/20",
    iconColor: "text-blue-400",
    title: "Bill Calendar",
    description: "See exactly when each bill is due. Get reminders before payments hit so you're always prepared.",
    highlight: "Never miss a payment again"
  },
  {
    icon: Brain,
    iconBg: "bg-purple-400/20",
    iconColor: "text-purple-400",
    title: "AI Financial Insights",
    description: "Our CFA (Complex Finance Analyzer) studies your spending patterns and gives you personalized tips to save money.",
    highlight: "Get smarter with your money, effortlessly"
  },
  {
    icon: BarChart3,
    iconBg: "bg-cyan-400/20",
    iconColor: "text-cyan-400",
    title: "Cashflow Dashboard",
    description: "Track where your money goes with beautiful charts and category breakdowns. Knowledge is power!",
    highlight: "Understand your finances at a glance"
  }
];

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const queryClient = useQueryClient();
  
  const completeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/onboarding-complete", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onComplete();
    },
    onError: () => {
      onComplete();
    }
  });

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const Icon = step.icon;

  const handleNext = () => {
    if (isLastStep) {
      completeMutation.mutate();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    completeMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-emerald-800 via-teal-700 to-emerald-900 flex flex-col px-6 py-12 text-white">
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-1">
          {tourSteps.map((_, index) => (
            <div 
              key={index}
              className={`h-1 w-8 rounded-full transition-colors ${
                index <= currentStep ? 'bg-amber-400' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
        <Button 
          variant="ghost" 
          onClick={handleSkip}
          className="text-white/60 hover:text-white hover:bg-white/10"
          data-testid="button-skip-tour"
        >
          Skip
        </Button>
      </div>
      
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className={`w-24 h-24 ${step.iconBg} rounded-3xl flex items-center justify-center mb-8`}>
          <Icon className={`w-12 h-12 ${step.iconColor}`} />
        </div>
        
        <h2 className="text-3xl font-bold text-center mb-4" data-testid="text-tour-title">
          {step.title}
        </h2>
        
        <p className="text-white/80 text-center text-lg mb-6 max-w-sm">
          {step.description}
        </p>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 mb-8">
          <p className="text-amber-400 text-sm font-medium text-center">
            💡 {step.highlight}
          </p>
        </div>
      </div>
      
      <div className="w-full space-y-3">
        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button 
              variant="outline"
              onClick={handleBack}
              className="flex-1 border-white/20 text-white bg-transparent hover:bg-white/10 py-6 rounded-2xl"
              data-testid="button-tour-back"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
          )}
          <Button 
            onClick={handleNext}
            disabled={completeMutation.isPending}
            className={`${currentStep > 0 ? 'flex-1' : 'w-full'} bg-amber-400 hover:bg-amber-500 text-emerald-900 py-6 rounded-2xl font-semibold text-lg transition-all active:scale-95`}
            data-testid="button-tour-next"
          >
            {completeMutation.isPending ? (
              "Loading..."
            ) : isLastStep ? (
              <>
                Let's Go!
                <Check className="w-5 h-5 ml-2" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
        
        <p className="text-center text-white/40 text-sm">
          Step {currentStep + 1} of {tourSteps.length}
        </p>
      </div>
    </div>
  );
}
