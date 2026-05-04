import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { cardsApi } from '../lib/api';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../lib/theme';
import type { VirtualCard } from '../types';

export default function VirtualCardsScreen() {
  const navigation = useNavigation<any>();

  const { data: cards = [], isLoading } = useQuery<VirtualCard[]>({
    queryKey: ['virtual-cards'],
    queryFn: () => cardsApi.getAll().then(r => r.data),
  });

  const renderCard = ({ item }: { item: VirtualCard }) => (
    <View style={styles.cardItem}>
      <LinearGradient
        colors={item.isFrozen ? [colors.gray[600], colors.gray[700]] : [colors.teal[500], colors.teal[600]]}
        style={styles.virtualCard}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardLogo}>Mulah</Text>
          {item.isFrozen && <Text style={styles.frozenBadge}>FROZEN</Text>}
        </View>
        <Text style={styles.cardNumber}>•••• •••• •••• {item.lastFour}</Text>
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.cardLabel}>Expires</Text>
            <Text style={styles.cardValue}>{item.expiryMonth}/{item.expiryYear}</Text>
          </View>
          {item.spendingLimit && (
            <View>
              <Text style={styles.cardLabel}>Limit</Text>
              <Text style={styles.cardValue}>€{item.spendingLimit}</Text>
            </View>
          )}
        </View>
      </LinearGradient>
      
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.cardAction}>
          <Text style={styles.cardActionText}>{item.isFrozen ? 'Unfreeze' : 'Freeze'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cardAction}>
          <Text style={styles.cardActionText}>Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        <Text style={styles.headerTitle}>Virtual Cards</Text>
        <Text style={styles.headerSubtitle}>Secure payment cards for your subscriptions</Text>
      </LinearGradient>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading cards...</Text>
          </View>
        ) : cards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyTitle}>No virtual cards yet</Text>
            <Text style={styles.emptySubtitle}>
              Virtual cards are created automatically when you add subscriptions to USW
            </Text>
            <TouchableOpacity style={styles.learnMoreButton}>
              <Text style={styles.learnMoreText}>Learn more about virtual cards</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={cards}
            renderItem={renderCard}
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
  listContent: {
    paddingBottom: 100,
  },
  cardItem: {
    marginBottom: spacing.lg,
  },
  virtualCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    aspectRatio: 1.586,
    justifyContent: 'space-between',
    ...shadows.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLogo: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  frozenBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  cardNumber: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
    color: colors.white,
    letterSpacing: 2,
    textAlign: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  cardValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cardAction: {
    backgroundColor: colors.gray[800],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  cardActionText: {
    color: colors.teal[400],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
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
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  learnMoreButton: {
    paddingVertical: spacing.sm,
  },
  learnMoreText: {
    color: colors.teal[400],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
