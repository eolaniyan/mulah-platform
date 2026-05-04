import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertSubscriptionSchema, type InsertSubscription, type ServiceDirectory, type ServicePlan } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ArrowLeft, Check, Search, Plus, X, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface ServiceWithPlans extends ServiceDirectory {
  plans: ServicePlan[];
}

export default function AddSubscription() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<ServiceWithPlans | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ServicePlan | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentStep, setCurrentStep] = useState<'category' | 'service' | 'plan' | 'custom'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: services = [], isLoading: isLoadingServices } = useQuery<ServiceDirectory[]>({
    queryKey: ["/api/services"],
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm({
    resolver: zodResolver(insertSubscriptionSchema.extend({
      nextBillingDate: insertSubscriptionSchema.shape.nextBillingDate.transform(val => new Date(val))
    })),
    defaultValues: {
      name: "",
      cost: "",
      billingCycle: "monthly",
      category: "other",
      description: "",
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      currency: "EUR",
      iconColor: "#1B5A52",
      iconName: "fa-star",
      isActive: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertSubscription) => {
      return apiRequest("POST", "/api/subscriptions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/monthly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/annual"] });
      
      toast({
        title: "Success! 🎉",
        description: "Subscription added successfully",
      });
      setLocation("/");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to add subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConfirmSubscription = async () => {
    const formData = form.getValues();
    await mutation.mutateAsync(formData);
    setShowConfirmation(false);
  };

  const handleServiceSelect = async (service: ServiceDirectory) => {
    try {
      const response = await fetch(`/api/services/${service.slug}`);
      if (!response.ok) throw new Error('Failed to fetch service plans');
      const serviceWithPlans: ServiceWithPlans = await response.json();
      
      setSelectedService(serviceWithPlans);
      if (serviceWithPlans.plans.length === 1) {
        handlePlanSelect(serviceWithPlans.plans[0], serviceWithPlans);
      } else if (serviceWithPlans.plans.length > 0) {
        setCurrentStep('plan');
      } else {
        form.setValue("name", service.name);
        form.setValue("category", service.category);
        setCurrentStep('custom');
        setShowCustomForm(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load service plans. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePlanSelect = (plan: ServicePlan, service?: ServiceWithPlans) => {
    const currentService = service || selectedService;
    if (!currentService) return;
    
    setSelectedPlan(plan);
    
    const price = plan.monthlyPrice ? parseFloat(plan.monthlyPrice) : 
                  plan.yearlyPrice ? parseFloat(plan.yearlyPrice) : 0;
    const billingCycle = plan.monthlyPrice ? 'monthly' : plan.yearlyPrice ? 'yearly' : 'monthly';
    
    const categoryInfo = categories.find(c => c.id === currentService.category);
    
    form.setValue("name", currentService.name);
    form.setValue("cost", price.toString());
    form.setValue("billingCycle", billingCycle);
    form.setValue("category", currentService.category);
    form.setValue("description", plan.name);
    form.setValue("iconColor", categoryInfo?.color || "#1B5A52");
    form.setValue("iconName", categoryInfo?.icon || "fa-star");
    
    setShowConfirmation(true);
  };

  const handleBackButton = () => {
    if (currentStep === 'service') {
      setCurrentStep('category');
      setSelectedService(null);
      setSelectedCategory(null);
      setSearchQuery("");
    } else if (currentStep === 'plan') {
      setCurrentStep('service');
      setSelectedPlan(null);
    } else if (currentStep === 'custom') {
      setCurrentStep('category');
      setShowCustomForm(false);
    } else {
      setLocation('/');
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getServicesForCategory = (categoryId: string) => {
    return filteredServices.filter(service => service.category === categoryId);
  };

  const isLoading = isLoadingServices || isLoadingCategories;

  if (isLoading) {
    return (
      <div className="mobile-container">
        <div className="mobile-header">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/')} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Add Subscription</h1>
          <div className="w-9" />
        </div>
        <div className="mobile-content space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      <div className="mobile-header">
        <Button variant="ghost" size="sm" onClick={handleBackButton} className="p-2" data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">
          {currentStep === 'category' && 'Add Subscription'}
          {currentStep === 'service' && 'Choose Service'}
          {currentStep === 'plan' && 'Select Plan'}
          {currentStep === 'custom' && 'Custom Service'}
        </h1>
        <div className="w-9" />
      </div>

      <div className="mobile-content space-y-4">
        {(currentStep === 'category' || currentStep === 'service') && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
              data-testid="input-search-services"
            />
          </div>
        )}

        {currentStep === 'category' && (
          <div className="space-y-4">
            <div className="category-grid">
              {categories.map((category) => {
                const categoryServices = getServicesForCategory(category.id);
                if (categoryServices.length === 0) return null;
                
                return (
                  <div 
                    key={category.id} 
                    className="category-item"
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setCurrentStep('service');
                    }}
                    data-testid={`card-category-${category.id}`}
                  >
                    <div className="p-4 text-center">
                      <div className="text-2xl mb-2">
                        <i className={`fas ${category.icon}`} style={{ color: category.color }}></i>
                      </div>
                      <h3 className="font-medium text-sm">{category.name}</h3>
                      <p className="text-xs text-gray-500">{categoryServices.length} services</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div 
              className="category-item col-span-2"
              onClick={() => {
                setCurrentStep('custom');
                setShowCustomForm(true);
              }}
              data-testid="card-custom-service"
            >
              <div className="p-4 text-center">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Plus className="h-4 w-4" />
                </div>
                <h3 className="font-medium text-sm">Custom Service</h3>
                <p className="text-xs text-gray-500">Add manually</p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'service' && (
          <div className="service-grid">
            {(selectedCategory ? filteredServices.filter(s => s.category === selectedCategory) : filteredServices).map((service) => {
              const categoryInfo = categories.find(c => c.id === service.category);
              return (
                <div 
                  key={service.id} 
                  className="service-item cursor-pointer hover:shadow-md"
                  onClick={() => handleServiceSelect(service)}
                  data-testid={`card-service-${service.slug}`}
                >
                  <div className="p-4 text-center">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 text-white text-sm"
                      style={{ backgroundColor: categoryInfo?.color || "#6B7280" }}
                    >
                      <i className={`fas ${categoryInfo?.icon || 'fa-star'}`}></i>
                    </div>
                    <h3 className="font-medium text-sm">{service.name}</h3>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentStep === 'plan' && selectedService && (
          <div className="space-y-3">
            <div className="text-center mb-4">
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-3 text-white text-xl"
                style={{ backgroundColor: categories.find(c => c.id === selectedService.category)?.color || "#6B7280" }}
              >
                <i className={`fas ${categories.find(c => c.id === selectedService.category)?.icon || 'fa-star'}`}></i>
              </div>
              <h2 className="text-lg font-semibold">{selectedService.name}</h2>
              {selectedService.websiteUrl && (
                <p className="text-sm text-gray-500">{selectedService.websiteUrl}</p>
              )}
            </div>

            {selectedService.plans.map((plan) => {
              const price = plan.monthlyPrice ? parseFloat(plan.monthlyPrice) : 
                            plan.yearlyPrice ? parseFloat(plan.yearlyPrice) : 0;
              const cycle = plan.monthlyPrice ? 'month' : plan.yearlyPrice ? 'year' : 'month';
              
              return (
                <div 
                  key={plan.id} 
                  className="compact-card cursor-pointer hover:shadow-md active:scale-95 transition-transform"
                  onClick={() => handlePlanSelect(plan)}
                  data-testid={`card-plan-${plan.id}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{plan.name}</h3>
                      <p className="text-sm text-gray-500">
                        €{price.toFixed(2)}/{cycle}
                      </p>
                    </div>
                    {plan.isPopular && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Popular
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentStep === 'custom' && showCustomForm && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Netflix, Spotify, etc." data-testid="input-service-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="9.99" data-testid="input-cost" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="billingCycle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-billing-cycle">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <i className={`fas ${category.icon} mr-2`} style={{ color: category.color }}></i>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 bg-green-600 hover:bg-green-700"
                disabled={mutation.isPending}
                data-testid="button-add-subscription"
              >
                {mutation.isPending ? "Adding..." : "Add Subscription"}
              </Button>
            </form>
          </Form>
        )}
      </div>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center">Confirm Subscription</DialogTitle>
          </DialogHeader>
          
          {selectedService && selectedPlan && (
            <div className="space-y-4">
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-3 text-white text-xl"
                  style={{ backgroundColor: categories.find(c => c.id === selectedService.category)?.color || "#6B7280" }}
                >
                  <i className={`fas ${categories.find(c => c.id === selectedService.category)?.icon || 'fa-star'}`}></i>
                </div>
                <h3 className="text-lg font-semibold">{selectedService.name}</h3>
                <p className="text-sm text-gray-500">{selectedPlan.name}</p>
                <p className="text-xl font-bold text-green-600 mt-2">
                  €{selectedPlan.monthlyPrice ? parseFloat(selectedPlan.monthlyPrice).toFixed(2) : selectedPlan.yearlyPrice ? parseFloat(selectedPlan.yearlyPrice).toFixed(2) : '0.00'}/
                  {selectedPlan.monthlyPrice ? 'mo' : 'yr'}
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1"
                  data-testid="button-cancel-confirm"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirmSubscription}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={mutation.isPending}
                  data-testid="button-confirm-subscription"
                >
                  {mutation.isPending ? "Adding..." : "Confirm"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
