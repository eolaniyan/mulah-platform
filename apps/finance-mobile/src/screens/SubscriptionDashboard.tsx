import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSubscriptions, useAnalyticsSummary } from '@mulah/shared-logic';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../lib/theme';
import type { Subscription } from '../types';

export default function SubscriptionDashboard() {
  const navigation = useNavigation<any>();

  const { data: subscriptions = [], isLoading } = useSubscriptions();
  const { data: analytics } = useAnalyticsSummary();

  const activeSubscriptions = subscriptions.filter((s) => s.isActive && s.status !== 'cancelled');
  const monthlyTotal = analytics?.monthlyTotal ?? 0;

  const renderSubscription = ({ item }: { item: Subscription }) => (
    <TouchableOpacity 
      style={styles.subscriptionCard}
      onPress={() => {}}
      activeOpacity={0.7}
    >
      <View style={[styles.subscriptionIcon, { backgroundColor: item.iconColor || colors.teal[500] }]}>
        <Text style={styles.subscriptionIconText}>{item.name[0]}</Text>
      </View>
      <View style={styles.subscriptionInfo}>
        <Text style={styles.subscriptionName}>{item.name}</Text>
        <Text style={styles.subscriptionCategory}>{item.category}</Text>
      </View>
      <View style={styles.subscriptionCost}>
        <Text style={styles.costValue}>€{parseFloat(item.cost).toFixed(2)}</Text>
        <Text style={styles.costCycle}>/{item.billingCycle.slice(0, 2)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient colors={[colors.teal[600], colors.teal[700]]} style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscriptions</Text>
        
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Monthly Spending</Text>
          <Text style={styles.totalValue}>€{monthlyTotal.toFixed(2)}</Text>
          <Text style={styles.totalSubs}>{activeSubscriptions.length} active subscriptions</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Subscriptions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddSubscription')}>
            <Text style={styles.addButton}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : activeSubscriptions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No subscriptions yet</Text>
            <Text style={styles.emptySubtitle}>Add your first subscription to start tracking</Text>
            <TouchableOpacity 
              style={styles.addFirstButton}
              onPress={() => navigation.navigate('AddSubscription')}
            >
              <Text style={styles.addFirstButtonText}>Add Subscription</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={activeSubscriptions}
            renderItem={renderSubscription}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
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
    paddingBottom: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.sm,
  },
  backText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.sm,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  totalCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.xs,
  },
  totalValue: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  totalSubs: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.6)',
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  addButton: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.teal[400],
  },
  listContent: {
    paddingBottom: 100,
  },
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  subscriptionIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  subscriptionIconText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  subscriptionCategory: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    textTransform: 'capitalize',
  },
  subscriptionCost: {
    alignItems: 'flex-end',
  },
  costValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  costCycle: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.gray[400],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  addFirstButton: {
    backgroundColor: colors.teal[500],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  addFirstButtonText: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.base,
  },
});
