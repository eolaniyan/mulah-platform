import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { cfaApi } from '../lib/api';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../lib/theme';

export default function InsightsScreen() {
  const navigation = useNavigation<any>();

  const { data: cfaSummary, isLoading } = useQuery({
    queryKey: ['cfa-summary'],
    queryFn: () => cfaApi.getSummary().then(r => r.data),
  });

  const healthScore = cfaSummary?.healthScore || 75;
  const insights = cfaSummary?.insights || [];
  const patterns = cfaSummary?.patterns || [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.green[500];
    if (score >= 60) return colors.amber[500];
    return colors.red[500];
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

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
        <Text style={styles.headerTitle}>Financial Insights</Text>
        <Text style={styles.headerSubtitle}>AI-powered analysis of your finances</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Financial Health Score</Text>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreValue, { color: getScoreColor(healthScore) }]}>
              {healthScore}
            </Text>
          </View>
          <Text style={[styles.scoreStatus, { color: getScoreColor(healthScore) }]}>
            {getScoreLabel(healthScore)}
          </Text>
          <View style={styles.scoreBar}>
            <View 
              style={[styles.scoreProgress, { 
                width: `${healthScore}%`,
                backgroundColor: getScoreColor(healthScore) 
              }]} 
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Key Insights</Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Analyzing your finances...</Text>
          </View>
        ) : insights.length === 0 ? (
          <View style={styles.insightCard}>
            <Text style={styles.insightIcon}>📊</Text>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Getting Started</Text>
              <Text style={styles.insightText}>
                Add more subscriptions to get personalized financial insights and recommendations.
              </Text>
            </View>
          </View>
        ) : (
          insights.map((insight: any, index: number) => (
            <View key={index} style={styles.insightCard}>
              <Text style={styles.insightIcon}>
                {insight.type === 'warning' ? '⚠️' : insight.type === 'success' ? '✅' : '💡'}
              </Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightText}>{insight.description}</Text>
              </View>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Spending Patterns</Text>
        
        <View style={styles.patternCard}>
          <View style={styles.patternHeader}>
            <Text style={styles.patternIcon}>📈</Text>
            <Text style={styles.patternTitle}>Monthly Trend</Text>
          </View>
          <Text style={styles.patternDescription}>
            Your subscription spending has been stable over the last 3 months.
          </Text>
        </View>

        <View style={styles.patternCard}>
          <View style={styles.patternHeader}>
            <Text style={styles.patternIcon}>🔄</Text>
            <Text style={styles.patternTitle}>Renewal Clustering</Text>
          </View>
          <Text style={styles.patternDescription}>
            Most of your subscriptions renew in the first week of the month.
          </Text>
        </View>

        <View style={styles.recommendationCard}>
          <Text style={styles.recommendationTitle}>💎 Recommendations</Text>
          <View style={styles.recommendationItem}>
            <Text style={styles.recommendationBullet}>•</Text>
            <Text style={styles.recommendationText}>
              Consider annual billing for Netflix to save €24/year
            </Text>
          </View>
          <View style={styles.recommendationItem}>
            <Text style={styles.recommendationBullet}>•</Text>
            <Text style={styles.recommendationText}>
              You have 2 overlapping streaming services
            </Text>
          </View>
          <View style={styles.recommendationItem}>
            <Text style={styles.recommendationBullet}>•</Text>
            <Text style={styles.recommendationText}>
              Spotify Family could save you €5/month if shared
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
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  scoreCard: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  scoreLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    marginBottom: spacing.md,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: colors.gray[700],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: fontWeight.bold,
  },
  scoreStatus: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  scoreBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.gray[700],
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreProgress: {
    height: '100%',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.gray[400],
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  insightText: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    lineHeight: 18,
  },
  patternCard: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  patternIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  patternTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  patternDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    lineHeight: 18,
  },
  recommendationCard: {
    backgroundColor: colors.amber[500] + '15',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.amber[500] + '30',
  },
  recommendationTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.amber[400],
    marginBottom: spacing.md,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  recommendationBullet: {
    color: colors.amber[400],
    marginRight: spacing.sm,
    fontSize: fontSize.base,
  },
  recommendationText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.gray[300],
    lineHeight: 18,
  },
});
