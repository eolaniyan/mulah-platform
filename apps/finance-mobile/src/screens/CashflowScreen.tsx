import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../lib/api';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../lib/theme';
import type { CashflowData } from '../types';

export default function CashflowScreen() {
  const navigation = useNavigation<any>();

  const { data: cashflow, isLoading } = useQuery<CashflowData>({
    queryKey: ['cashflow'],
    queryFn: () => analyticsApi.getCashflow().then(r => r.data),
  });

  const { data: categoryTotals = [] } = useQuery({
    queryKey: ['category-totals'],
    queryFn: () => analyticsApi.getCategoryTotals().then(r => r.data),
  });

  const totalIncome = cashflow?.totalIncome || 0;
  const totalExpenses = cashflow?.totalExpenses || 0;
  const netCashflow = cashflow?.netCashflow || 0;
  const subExpenses = cashflow?.subscriptionExpenses || 0;

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
        <Text style={styles.headerTitle}>Cashflow</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={styles.incomeIndicator}>
                <Text style={styles.indicatorArrow}>↗</Text>
              </View>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={styles.summaryValue}>€{totalIncome.toFixed(0)}</Text>
            </View>
            
            <View style={styles.summaryDivider} />
            
            <View style={styles.summaryItem}>
              <View style={styles.expenseIndicator}>
                <Text style={styles.indicatorArrow}>↘</Text>
              </View>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={styles.summaryValue}>€{totalExpenses.toFixed(0)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.netCard}>
          <Text style={styles.netLabel}>Net Cashflow</Text>
          <Text style={[styles.netValue, { color: netCashflow >= 0 ? colors.green[500] : colors.red[500] }]}>
            {netCashflow >= 0 ? '+' : ''}€{netCashflow.toFixed(0)}
          </Text>
          <Text style={styles.netSubtext}>This month</Text>
        </View>

        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Expense Breakdown</Text>
          
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownDot, { backgroundColor: colors.teal[500] }]} />
              <Text style={styles.breakdownLabel}>Subscriptions</Text>
            </View>
            <Text style={styles.breakdownValue}>€{subExpenses.toFixed(0)}</Text>
          </View>
          
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownDot, { backgroundColor: colors.amber[500] }]} />
              <Text style={styles.breakdownLabel}>Other Expenses</Text>
            </View>
            <Text style={styles.breakdownValue}>€{(totalExpenses - subExpenses).toFixed(0)}</Text>
          </View>
        </View>

        {categoryTotals.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>By Category</Text>
            {categoryTotals.map((category: any, index: number) => (
              <View key={index} style={styles.categoryCard}>
                <View style={styles.categoryLeft}>
                  <View style={[styles.categoryDot, { backgroundColor: category.color || colors.teal[500] }]} />
                  <Text style={styles.categoryName}>{category.category}</Text>
                </View>
                <Text style={styles.categoryValue}>€{parseFloat(category.total).toFixed(0)}</Text>
              </View>
            ))}
          </>
        )}

        <View style={styles.insightCard}>
          <Text style={styles.insightIcon}>💡</Text>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Tip</Text>
            <Text style={styles.insightText}>
              Your subscription spending is {((subExpenses / totalExpenses) * 100).toFixed(0)}% of total expenses
            </Text>
          </View>
        </View>
      </ScrollView>
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
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.gray[700],
  },
  incomeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.green[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  expenseIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.red[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  indicatorArrow: {
    fontSize: fontSize.md,
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  netCard: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  netLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    marginBottom: spacing.xs,
  },
  netValue: {
    fontSize: 36,
    fontWeight: fontWeight.bold,
  },
  netSubtext: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  breakdownCard: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  breakdownTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  breakdownLabel: {
    fontSize: fontSize.base,
    color: colors.gray[300],
  },
  breakdownValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  categoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  categoryName: {
    fontSize: fontSize.base,
    color: colors.white,
    textTransform: 'capitalize',
  },
  categoryValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: colors.amber[500] + '20',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.amber[400],
    marginBottom: spacing.xs,
  },
  insightText: {
    fontSize: fontSize.sm,
    color: colors.gray[300],
    lineHeight: 18,
  },
});
