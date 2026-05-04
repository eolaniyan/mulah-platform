import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useAnalyticsSummary, configApi } from '@mulah/shared-logic';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../lib/theme';
import type { USWConfig } from '../types';

export default function USWScreen() {
  const navigation = useNavigation<any>();

  const { data: analytics } = useAnalyticsSummary();

  const { data: config } = useQuery({
    queryKey: ['/api/config'],
    queryFn: () => configApi.get(),
  });

  const defaultUsw: USWConfig = {
    baseFee: 3.99,
    premiumFee: 1.99,
    percentageFee: 0.02,
    premiumPercentageFee: 0.01,
    currency: 'EUR',
    maxNonPremiumCharge: 200,
  };
  const fees = config?.usw_fees;
  const uswConfig: USWConfig =
    fees && typeof fees === 'object' && 'baseFee' in fees
      ? { ...defaultUsw, ...(fees as Partial<USWConfig>) }
      : defaultUsw;

  const monthlyTotal = analytics?.monthlyTotal ?? 0;
  const baseFee = uswConfig.baseFee;
  const percentageFee = monthlyTotal * uswConfig.percentageFee;
  const totalFee = baseFee + percentageFee;
  const grandTotal = monthlyTotal + totalFee;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient colors={[colors.teal[600], colors.teal[700]]} style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Unified Subscription Wallet</Text>
        <Text style={styles.headerSubtitle}>One payment, all your subscriptions</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.totalCard}>
          <LinearGradient
            colors={[colors.teal[500], colors.teal[600]]}
            style={styles.totalCardGradient}
          >
            <Text style={styles.totalLabel}>Monthly Total</Text>
            <Text style={styles.totalValue}>€{grandTotal.toFixed(2)}</Text>
            <Text style={styles.totalSubtext}>Due on the 1st of each month</Text>
          </LinearGradient>
        </View>

        <Text style={styles.sectionTitle}>Breakdown</Text>
        
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Subscriptions Total</Text>
            <Text style={styles.breakdownValue}>€{monthlyTotal.toFixed(2)}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Mulah Base Fee</Text>
            <Text style={styles.breakdownValue}>€{baseFee.toFixed(2)}</Text>
          </View>
          
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Processing Fee ({(uswConfig.percentageFee * 100).toFixed(0)}%)</Text>
            <Text style={styles.breakdownValue}>€{percentageFee.toFixed(2)}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownTotalLabel}>Grand Total</Text>
            <Text style={styles.breakdownTotalValue}>€{grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.premiumCard}>
          <View style={styles.premiumHeader}>
            <Text style={styles.premiumTitle}>✨ Go Premium</Text>
            <Text style={styles.premiumBadge}>SAVE {((uswConfig.percentageFee - uswConfig.premiumPercentageFee) * 100).toFixed(0)}%</Text>
          </View>
          <Text style={styles.premiumDescription}>
            Lower fees, priority support, and exclusive features
          </Text>
          <View style={styles.premiumBenefits}>
            <Text style={styles.premiumBenefit}>✓ Base fee: €{uswConfig.premiumFee}/mo</Text>
            <Text style={styles.premiumBenefit}>✓ Processing: {(uswConfig.premiumPercentageFee * 100).toFixed(0)}%</Text>
            <Text style={styles.premiumBenefit}>✓ Priority concierge support</Text>
          </View>
          <TouchableOpacity style={styles.premiumButton}>
            <Text style={styles.premiumButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How USW Works</Text>
          <Text style={styles.infoText}>
            Mulah pays all your subscriptions on your behalf using virtual cards. 
            You pay us once per month, simplifying your finances and giving you 
            complete control over your subscriptions.
          </Text>
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
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  totalCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  totalCardGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.xs,
  },
  totalValue: {
    fontSize: 48,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  totalSubtext: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.6)',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  breakdownCard: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  breakdownLabel: {
    fontSize: fontSize.base,
    color: colors.gray[400],
  },
  breakdownValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.white,
  },
  breakdownTotalLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  breakdownTotalValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.teal[400],
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[700],
    marginVertical: spacing.sm,
  },
  premiumCard: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.amber[500],
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  premiumTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.amber[400],
  },
  premiumBadge: {
    backgroundColor: colors.amber[500],
    color: colors.gray[900],
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  premiumDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    marginBottom: spacing.md,
  },
  premiumBenefits: {
    marginBottom: spacing.md,
  },
  premiumBenefit: {
    fontSize: fontSize.sm,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  premiumButton: {
    backgroundColor: colors.amber[500],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  premiumButtonText: {
    color: colors.gray[900],
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.base,
  },
  infoCard: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  infoTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    lineHeight: 20,
  },
});
