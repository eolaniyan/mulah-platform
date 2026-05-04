import { Button } from "@/components/ui/button";
import { Wallet, Calendar, Brain, ArrowRight, Sparkles } from "lucide-react";

export default function GetStarted() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-800 via-teal-700 to-emerald-900 flex flex-col px-6 py-12 text-white">
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="w-20 h-20 bg-amber-400 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <span className="text-emerald-900 text-3xl font-bold">M</span>
        </div>
        
        <h1 className="text-4xl font-bold text-center mb-3" data-testid="text-welcome-title">Mulah</h1>
        <p className="text-white/80 text-center text-lg mb-12">Your Finance Command Center</p>
        
        <div className="w-full space-y-4 mb-12">
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4" data-testid="feature-usw">
            <div className="w-12 h-12 bg-amber-400/20 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Unified Subscription Wallet</h3>
              <p className="text-white/60 text-sm">All your subscriptions, one monthly payment.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4" data-testid="feature-calendar">
            <div className="w-12 h-12 bg-blue-400/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Bill Calendar</h3>
              <p className="text-white/60 text-sm">Never miss a payment with smart reminders</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4" data-testid="feature-insights">
            <div className="w-12 h-12 bg-purple-400/20 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">AI Financial Insights</h3>
              <p className="text-white/60 text-sm">Get personalized spending analysis & tips</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="w-full space-y-3">
        <Button 
          onClick={() => window.location.href = '/api/login'}
          className="w-full bg-amber-400 hover:bg-amber-500 text-emerald-900 py-6 rounded-2xl font-semibold text-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          data-testid="button-get-started"
        >
          Get Started
          <ArrowRight className="w-5 h-5" />
        </Button>
        
        <p className="text-center text-white/50 text-sm">
          Free to use • No credit card required
        </p>
      </div>
    </div>
  );
}
