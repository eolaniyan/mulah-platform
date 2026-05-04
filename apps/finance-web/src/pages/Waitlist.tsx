import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertWaitlistSchema, type InsertWaitlist } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

export default function Waitlist() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: waitlistData } = useQuery({
    queryKey: ["/api/waitlist/count"],
  });

  const form = useForm<InsertWaitlist>({
    resolver: zodResolver(insertWaitlistSchema),
    defaultValues: {
      email: user?.email || "",
    },
  });

  const joinWaitlistMutation = useMutation({
    mutationFn: async (data: InsertWaitlist) => {
      await apiRequest("POST", "/api/waitlist", data);
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Success!",
        description: "You've been added to the waitlist. We'll notify you when the Unified Subscription Wallet is ready!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to join waitlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertWaitlist) => {
    joinWaitlistMutation.mutate(data);
  };

  const waitlistCount = waitlistData?.count || 2847;

  if (isSubmitted) {
    return (
      <div className="gradient-header min-h-screen flex flex-col justify-center items-center px-6 text-white">
        <Link href="/">
          <button className="absolute top-12 left-6 text-white">
            <i className="fas fa-times text-xl"></i>
          </button>
        </Link>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-mulah-gold rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-check text-mulah-teal text-2xl"></i>
          </div>
          <h2 className="text-3xl font-bold mb-4">You're In!</h2>
          <p className="text-white/90 text-lg mb-2">Welcome to the Mulah waitlist</p>
          <p className="text-white/80 text-sm">You'll be among the first to know when the Unified Subscription Wallet launches.</p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <div className="bg-white/10 rounded-2xl p-6 glass-effect text-center">
            <h3 className="font-semibold mb-2">Early Bird Benefits</h3>
            <div className="space-y-2 text-sm text-white/90">
              <div className="flex items-center space-x-2">
                <i className="fas fa-star text-mulah-gold"></i>
                <span>50% off for life</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-bolt text-mulah-gold"></i>
                <span>Priority beta access</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-gift text-mulah-gold"></i>
                <span>Exclusive features</span>
              </div>
            </div>
          </div>

          <Link href="/">
            <Button className="w-full bg-white text-mulah-teal hover:bg-white/90">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-header min-h-screen flex flex-col justify-center items-center px-6 text-white">
      <Link href="/">
        <button className="absolute top-12 left-6 text-white">
          <i className="fas fa-times text-xl"></i>
        </button>
      </Link>

      {/* Unified payments and financial management dashboard on mobile */}
      <div className="w-full max-w-sm mb-8">
        <div className="bg-white/10 rounded-3xl p-6 glass-effect">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-mulah-gold rounded-full flex items-center justify-center">
                <i className="fas fa-magic text-mulah-teal text-sm"></i>
              </div>
              <div className="flex-1 h-4 bg-white/20 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-8 bg-white/30 rounded-lg"></div>
              <div className="h-8 bg-white/30 rounded-lg"></div>
              <div className="h-8 bg-white/30 rounded-lg"></div>
            </div>
            <div className="flex space-x-2">
              <div className="flex-1 h-10 bg-mulah-gold/50 rounded-lg"></div>
              <div className="w-10 h-10 bg-white/20 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Unified Subscription Wallet</h2>
        <p className="text-white/90 text-lg mb-4">One payment. One day. Total control.</p>
        <p className="text-white/80 text-sm">
          Join {waitlistCount.toLocaleString()} people waiting for the revolutionary way to manage subscriptions.
        </p>
      </div>

      {/* Waitlist Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/70 focus:bg-white/20 focus:border-white/40"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-300" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={joinWaitlistMutation.isPending}
            className="w-full bg-mulah-gold text-mulah-teal py-4 rounded-2xl font-semibold text-lg transition-transform active:scale-95 hover:bg-mulah-gold/90"
          >
            {joinWaitlistMutation.isPending ? "Joining..." : "Join Waitlist"}
          </Button>

          <div className="text-center">
            <p className="text-white/70 text-sm">Early access members get 50% off for life</p>
          </div>
        </form>
      </Form>

      {/* Features Preview */}
      <div className="mt-8 space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 bg-mulah-gold rounded-full flex items-center justify-center flex-shrink-0">
            <i className="fas fa-check text-mulah-teal text-xs"></i>
          </div>
          <span className="text-white/90 text-sm">Consolidate all subscription payments</span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 bg-mulah-gold rounded-full flex items-center justify-center flex-shrink-0">
            <i className="fas fa-check text-mulah-teal text-xs"></i>
          </div>
          <span className="text-white/90 text-sm">Smart budgeting with predictable payments</span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 bg-mulah-gold rounded-full flex items-center justify-center flex-shrink-0">
            <i className="fas fa-check text-mulah-teal text-xs"></i>
          </div>
          <span className="text-white/90 text-sm">Never miss a payment or get surprised again</span>
        </div>
      </div>
    </div>
  );
}
