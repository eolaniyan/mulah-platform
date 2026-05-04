import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import {
  useSubscriptions,
  useCashflow,
  useUpcomingBills,
  getTotalMonthlySpend,
} from '@mulah/shared-logic';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../lib/theme';

function getDisplayName(user: any): string {
  if (!user) return 'User';
  if (user.firstName) return user.firstName;
  if (user.email) {
    const emailName = user.email.split('@')[0];
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }
  return 'User';
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const { data: subscriptions = [] } = useSubscriptions();
  const { data: cashflowSummary } = useCashflow();
  const { data: upcoming = [] } = useUpcomingBills();

  const monthlyTotal = getTotalMonthlySpend(subscriptions);
  const activeCount = subscriptions.filter((s) => s.isActive && s.status !== 'cancelled').length;
  const upcomingCount = upcoming.length;
  const netCashflow = cashflowSummary?.netCashflow ?? 0;
  const subscriptionExpenses =
    cashflowSummary?.subscriptionExpenses ??
    cashflowSummary?.expensesByCategory?.find((e) =>
      String(e.category).toLowerCase().includes('subscription')
    )?.amount ??
    monthlyTotal;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient colors={[colors.gray[800], colors.gray[900]]} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{getDisplayName(user)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.avatar}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.avatarText}>
              {user?.firstName?.[0] || user?.email?.[0] || 'U'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtext}>Choose a module to get started</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity 
          activeOpacity={0.95}
          onPress={() => navigation.navigate('SubscriptionHub')}
        >
          <View style={styles.hubCard}>
            <LinearGradient
              colors={[colors.teal[500], colors.teal[600]]}
              style={styles.hubCardHeader}
            >
              <View style={styles.hubCardHeaderContent}>
                <View style={styles.hubIcon}>
                  <Text style={styles.hubIconText}>💳</Text>
                </View>
                <View style={styles.hubInfo}>
                  <Text style={styles.hubTitle}>Subscription Hub</Text>
                  <Text style={styles.hubSubtitle}>Manage & control subscriptions</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </LinearGradient>
            
            <View style={styles.hubCardBody}>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>€{monthlyTotal.toFixed(0)}</Text>
                  <Text style={styles.statLabel}>Monthly</Text>
                </View>
                <View style={[styles.stat, styles.statBorder]}>
                  <Text style={styles.statValue}>{activeCount}</Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: colors.amber[600] }]}>{upcomingCount}</Text>
                  <Text style={styles.statLabel}>Upcoming</Text>
                </View>
              </View>
              
              <View style={styles.tagsRow}>
                {['Subscriptions', 'USW', 'Cards', 'Family', 'Calendar', 'Concierge'].map(tag => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.95}
          onPress={() => navigation.navigate('FinanceHub')}
        >
          <View style={styles.hubCard}>
            <LinearGradient
              colors={[colors.amber[500], colors.amber[600]]}
              style={styles.hubCardHeader}
            >
              <View style={styles.hubCardHeaderContent}>
                <View style={styles.hubIcon}>
                  <Text style={styles.hubIconText}>📈</Text>
                </View>
                <View style={styles.hubInfo}>
                  <Text style={styles.hubTitle}>Finance Hub</Text>
                  <Text style={styles.hubSubtitle}>Insights & money analytics</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </LinearGradient>
            
            <View style={styles.hubCardBody}>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: netCashflow >= 0 ? colors.green[600] : colors.red[600] }]}>
                    {netCashflow >= 0 ? '↗' : '↘'} €{Math.abs(netCashflow).toFixed(0)}
                  </Text>
                  <Text style={styles.statLabel}>Net Cashflow</Text>
                </View>
                <View style={[styles.stat, styles.statBorder]}>
                  <Text style={styles.statValue}>€{subscriptionExpenses.toFixed(0)}</Text>
                  <Text style={styles.statLabel}>Sub Expenses</Text>
                </View>
              </View>
              
              <View style={styles.tagsRow}>
                {['Cashflow', 'Insights', 'Analytics'].map(tag => (
                  <View key={tag} style={styles.tagAmber}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('AddSubscription')}
          >
            <View style={styles.quickActionIcon}>
              <Text style={styles.quickActionIconText}>€</Text>
            </View>
            <Text style={styles.quickActionText}>Add Subscription</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('IRIS')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.amber[500] }]}>
              <Text style={styles.quickActionIconText}>✨</Text>
            </View>
            <Text style={styles.quickActionText}>Get Help</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('IRIS')}
      >
        <Text style={styles.fabIcon}>✨</Text>
      </TouchableOpacity>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  welcomeText: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  headerSubtext: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.5)',
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  hubCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  hubCardHeader: {
    padding: spacing.lg,
  },
  hubCardHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hubIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  hubIconText: {
    fontSize: 28,
  },
  hubInfo: {
    flex: 1,
  },
  hubTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  hubSubtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  chevron: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.7)',
  },
  hubCardBody: {
    backgroundColor: colors.gray[800],
    padding: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.gray[700],
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: colors.gray[700],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  tagAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.teal[600],
    borderStyle: 'dashed',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.teal[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionIconText: {
    fontSize: 20,
    color: colors.white,
  },
  quickActionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.white,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.teal[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  fabIcon: {
    fontSize: 24,
  },
});
