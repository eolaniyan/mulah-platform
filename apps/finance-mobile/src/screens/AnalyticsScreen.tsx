import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, subscriptionsApi } from '../lib/api';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../lib/theme';
import type { Analytics, Subscription } from '../types';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const navigation = useNavigation<any>();

  const { data: analytics } = useQuery<Analytics>({
    queryKey: ['analytics'],
    queryFn: () => analyticsApi.getSummary().then(r => r.data),
  });

  const { data: subscriptions = [] } = useQuery<Subscription[]>({
    queryKey: ['subscriptions'],
    queryFn: () => subscriptionsApi.getAll().then(r => r.data),
  });

  const categoryBreakdown = analytics?.categoryBreakdown || [];
  const monthlyTotal = analytics?.monthlyTotal || 0;
  const annualTotal = analytics?.annualTotal || 0;

  const maxCategoryValue = Math.max(...categoryBreakdown.map(c => c.total), 1);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient colors={[colors.amber[500], colors.amber[600]]} style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Monthly</Text>
            <Text style={styles.summaryValue}>€{monthlyTotal.toFixed(0)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Annual</Text>
            <Text style={styles.summaryValue}>€{annualTotal.toFixed(0)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Category Breakdown</Text>
        
        <View style={styles.chartCard}>
          {categoryBreakdown.length === 0 ? (
            <Text style={styles.emptyText}>No data yet</Text>
          ) : (
            categoryBreakdown.map((category, index) => (
              <View key={index} style={styles.barRow}>
                <Text style={styles.barLabel}>{category.category}</Text>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        width: `${(category.total / maxCategoryValue) * 100}%`,
                        backgroundColor: getCategoryColor(index)
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.barValue}>€{category.total.toFixed(0)}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Subscription Count</Text>
        
        <View style={styles.countCard}>
          <View style={styles.countItem}>
            <Text style={styles.countValue}>{subscriptions.filter(s => s.isActive).length}</Text>
            <Text style={styles.countLabel}>Active</Text>
          </View>
          <View style={styles.countDivider} />
          <View style={styles.countItem}>
            <Text style={styles.countValue}>{subscriptions.filter(s => s.status === 'paused').length}</Text>
            <Text style={styles.countLabel}>Paused</Text>
          </View>
          <View style={styles.countDivider} />
          <View style={styles.countItem}>
            <Text style={styles.countValue}>{subscriptions.filter(s => s.status === 'cancelled').length}</Text>
            <Text style={styles.countLabel}>Cancelled</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Billing Cycle Distribution</Text>
        
        <View style={styles.cycleCard}>
          {['monthly', 'yearly', 'quarterly', 'weekly'].map(cycle => {
            const count = subscriptions.filter(s => s.billingCycle === cycle).length;
            const percentage = subscriptions.length > 0 ? (count / subscriptions.length) * 100 : 0;
            
            return (
              <View key={cycle} style={styles.cycleRow}>
                <Text style={styles.cycleLabel}>{cycle.charAt(0).toUpperCase() + cycle.slice(1)}</Text>
                <View style={styles.cycleBarContainer}>
                  <View 
                    style={[styles.cycleBar, { width: `${percentage}%` }]} 
                  />
                </View>
                <Text style={styles.cycleValue}>{count}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.savingsCard}>
          <Text style={styles.savingsTitle}>💰 Potential Savings</Text>
          <Text style={styles.savingsValue}>€{(monthlyTotal * 0.15).toFixed(0)}/month</Text>
          <Text style={styles.savingsDescription}>
            By switching to annual billing for eligible subscriptions
          </Text>
          <TouchableOpacity style={styles.savingsButton}>
            <Text style={styles.savingsButtonText}>See Recommendations</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function getCategoryColor(index: number) {
  const categoryColors = [
    colors.teal[500],
    colors.amber[500],
    colors.red[500],
    colors.green[500],
    colors.primary[500],
    colors.gray[500],
  ];
  return categoryColors[index % categoryColors.length];
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
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  chartCard: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  emptyText: {
    color: colors.gray[500],
    textAlign: 'center',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  barLabel: {
    width: 80,
    fontSize: fontSize.sm,
    color: colors.gray[400],
    textTransform: 'capitalize',
  },
  barContainer: {
    flex: 1,
    height: 20,
    backgroundColor: colors.gray[700],
    borderRadius: borderRadius.sm,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  barValue: {
    width: 50,
    fontSize: fontSize.sm,
    color: colors.white,
    fontWeight: fontWeight.medium,
    textAlign: 'right',
  },
  countCard: {
    flexDirection: 'row',
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  countItem: {
    flex: 1,
    alignItems: 'center',
  },
  countDivider: {
    width: 1,
    backgroundColor: colors.gray[700],
  },
  countValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  countLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    marginTop: spacing.xs,
  },
  cycleCard: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cycleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cycleLabel: {
    width: 80,
    fontSize: fontSize.sm,
    color: colors.gray[400],
  },
  cycleBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: colors.gray[700],
    borderRadius: borderRadius.sm,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  cycleBar: {
    height: '100%',
    backgroundColor: colors.teal[500],
    borderRadius: borderRadius.sm,
  },
  cycleValue: {
    width: 30,
    fontSize: fontSize.sm,
    color: colors.white,
    textAlign: 'right',
  },
  savingsCard: {
    backgroundColor: colors.teal[600] + '20',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.teal[500] + '30',
    alignItems: 'center',
  },
  savingsTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.teal[400],
    marginBottom: spacing.sm,
  },
  savingsValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  savingsDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  savingsButton: {
    backgroundColor: colors.teal[500],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  savingsButtonText: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.sm,
  },
});
