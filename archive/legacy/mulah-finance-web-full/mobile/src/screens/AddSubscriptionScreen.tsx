import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi, subscriptionsApi } from '../lib/api';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../lib/theme';
import type { Category, ServiceDirectory, ServicePlan } from '../types';

type Step = 'category' | 'service' | 'plan' | 'custom';

export default function AddSubscriptionScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceDirectory | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ServicePlan | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => servicesApi.getCategories().then(r => r.data),
  });

  const { data: services = [] } = useQuery<ServiceDirectory[]>({
    queryKey: ['services'],
    queryFn: () => servicesApi.getAll().then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => subscriptionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      navigation.goBack();
    },
  });

  const filteredServices = services.filter(s => {
    const matchesCategory = !selectedCategory || s.category === selectedCategory;
    const matchesSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentStep('service');
  };

  const handleSelectService = (service: ServiceDirectory) => {
    setSelectedService(service);
    setCurrentStep('plan');
  };

  const handleSelectPlan = (plan: ServicePlan) => {
    setSelectedPlan(plan);
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    if (!selectedService || !selectedPlan) return;
    
    mutation.mutate({
      name: selectedService.name,
      cost: selectedPlan.price,
      billingCycle: selectedPlan.billingCycle,
      category: selectedService.category,
      description: selectedService.description,
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      currency: selectedPlan.currency || 'EUR',
      iconColor: selectedService.defaultColor || colors.teal[500],
      iconName: selectedService.defaultIcon || 'fa-star',
      isActive: true,
    });
  };

  const handleBack = () => {
    if (currentStep === 'service') {
      setCurrentStep('category');
      setSelectedCategory(null);
    } else if (currentStep === 'plan') {
      setCurrentStep('service');
      setSelectedService(null);
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient colors={[colors.gray[800], colors.gray[900]]} style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Subscription</Text>
        <Text style={styles.stepIndicator}>
          Step {currentStep === 'category' ? 1 : currentStep === 'service' ? 2 : currentStep === 'plan' ? 3 : 4} of 4
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 'category' && (
          <>
            <Text style={styles.sectionTitle}>Select a Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => handleSelectCategory(category.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                    <Text style={styles.categoryIconText}>{category.name[0]}</Text>
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {currentStep === 'service' && (
          <>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search services..."
                placeholderTextColor={colors.gray[500]}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <Text style={styles.sectionTitle}>Select a Service</Text>
            <View style={styles.serviceList}>
              {filteredServices.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() => handleSelectService(service)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.serviceIcon, { backgroundColor: service.defaultColor || colors.teal[500] }]}>
                    <Text style={styles.serviceIconText}>{service.name[0]}</Text>
                  </View>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceDescription} numberOfLines={1}>
                      {service.description || service.category}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {currentStep === 'plan' && selectedService && (
          <>
            <View style={styles.selectedServiceHeader}>
              <View style={[styles.selectedServiceIcon, { backgroundColor: selectedService.defaultColor || colors.teal[500] }]}>
                <Text style={styles.selectedServiceIconText}>{selectedService.name[0]}</Text>
              </View>
              <Text style={styles.selectedServiceName}>{selectedService.name}</Text>
            </View>
            <Text style={styles.sectionTitle}>Choose a Plan</Text>
            <View style={styles.planList}>
              {[
                { id: 1, name: 'Monthly', price: '9.99', billingCycle: 'monthly', currency: 'EUR' },
                { id: 2, name: 'Annual', price: '99.99', billingCycle: 'yearly', currency: 'EUR' },
              ].map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={styles.planCard}
                  onPress={() => handleSelectPlan(plan as ServicePlan)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPrice}>€{plan.price}</Text>
                  <Text style={styles.planCycle}>/{plan.billingCycle}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              style={styles.customButton}
              onPress={() => setCurrentStep('custom')}
            >
              <Text style={styles.customButtonText}>Enter custom amount</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <Modal
        visible={showConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>✓</Text>
            <Text style={styles.modalTitle}>Confirm Subscription</Text>
            <Text style={styles.modalServiceName}>{selectedService?.name}</Text>
            <Text style={styles.modalPlan}>
              €{selectedPlan?.price}/{selectedPlan?.billingCycle}
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowConfirmation(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={handleConfirm}
                disabled={mutation.isPending}
              >
                <Text style={styles.modalConfirmButtonText}>
                  {mutation.isPending ? 'Adding...' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[900],
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  backText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  stepIndicator: {
    fontSize: fontSize.sm,
    color: colors.teal[400],
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryIconText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  categoryName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.white,
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.white,
    fontSize: fontSize.base,
  },
  serviceList: {
    gap: spacing.sm,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  serviceIconText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  serviceDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
  },
  chevron: {
    fontSize: 20,
    color: colors.gray[500],
  },
  selectedServiceHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  selectedServiceIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  selectedServiceIconText: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  selectedServiceName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  planList: {
    gap: spacing.sm,
  },
  planCard: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[700],
  },
  planName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  planPrice: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.teal[400],
  },
  planCycle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  customButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.teal[500],
    borderRadius: borderRadius.lg,
    borderStyle: 'dashed',
  },
  customButtonText: {
    color: colors.teal[400],
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  modalIcon: {
    fontSize: 48,
    color: colors.teal[400],
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  modalServiceName: {
    fontSize: fontSize.lg,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  modalPlan: {
    fontSize: fontSize.base,
    color: colors.gray[400],
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[600],
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: colors.gray[400],
    fontWeight: fontWeight.semibold,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.teal[500],
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
});
