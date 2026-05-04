import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conciergeApi } from '../lib/api';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../lib/theme';
import type { ConciergeRequest } from '../types';

export default function ConciergeScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [requestDescription, setRequestDescription] = useState('');
  const [requestType, setRequestType] = useState('cancellation');

  const { data: requests = [], isLoading } = useQuery<ConciergeRequest[]>({
    queryKey: ['concierge-requests'],
    queryFn: () => conciergeApi.getRequests().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => conciergeApi.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concierge-requests'] });
      setShowNewRequest(false);
      setRequestDescription('');
    },
  });

  const handleSubmitRequest = () => {
    if (!requestDescription.trim()) return;
    createMutation.mutate({
      requestType,
      description: requestDescription.trim(),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.green[600];
      case 'in_progress': return colors.amber[500];
      case 'cancelled': return colors.red[500];
      default: return colors.gray[500];
    }
  };

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
        <Text style={styles.headerTitle}>Concierge</Text>
        <Text style={styles.headerSubtitle}>We handle the difficult cancellations for you</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity 
          style={styles.newRequestButton}
          onPress={() => setShowNewRequest(true)}
        >
          <Text style={styles.newRequestIcon}>+</Text>
          <View style={styles.newRequestText}>
            <Text style={styles.newRequestTitle}>New Concierge Request</Text>
            <Text style={styles.newRequestSubtitle}>Get help cancelling a subscription</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Your Requests</Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎧</Text>
            <Text style={styles.emptyTitle}>No requests yet</Text>
            <Text style={styles.emptySubtitle}>
              Need help cancelling a subscription? Our concierge team can help!
            </Text>
          </View>
        ) : (
          requests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <Text style={styles.requestType}>{request.requestType.replace('_', ' ')}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                  <Text style={styles.statusText}>{request.status.replace('_', ' ')}</Text>
                </View>
              </View>
              <Text style={styles.requestDescription} numberOfLines={2}>
                {request.description}
              </Text>
              <Text style={styles.requestDate}>
                {new Date(request.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showNewRequest}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewRequest(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Request</Text>
              <TouchableOpacity onPress={() => setShowNewRequest(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Request Type</Text>
            <View style={styles.typeButtons}>
              {['cancellation', 'negotiation', 'other'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeButton, requestType === type && styles.typeButtonActive]}
                  onPress={() => setRequestType(type)}
                >
                  <Text style={[styles.typeButtonText, requestType === type && styles.typeButtonTextActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Describe what you need help with..."
              placeholderTextColor={colors.gray[500]}
              value={requestDescription}
              onChangeText={setRequestDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmitRequest}
              disabled={createMutation.isPending || !requestDescription.trim()}
            >
              <Text style={styles.submitButtonText}>
                {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </Text>
            </TouchableOpacity>
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
  newRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.teal[500],
    borderStyle: 'dashed',
  },
  newRequestIcon: {
    fontSize: 32,
    color: colors.teal[400],
    marginRight: spacing.md,
  },
  newRequestText: {
    flex: 1,
  },
  newRequestTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  newRequestSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
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
    paddingHorizontal: spacing.lg,
  },
  requestCard: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  requestType: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.white,
    textTransform: 'capitalize',
  },
  requestDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    marginBottom: spacing.sm,
  },
  requestDate: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.gray[800],
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  modalClose: {
    fontSize: 20,
    color: colors.gray[400],
    padding: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[400],
    marginBottom: spacing.sm,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[600],
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: colors.teal[500],
    backgroundColor: colors.teal[500] + '20',
  },
  typeButtonText: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    fontWeight: fontWeight.medium,
  },
  typeButtonTextActive: {
    color: colors.teal[400],
  },
  descriptionInput: {
    backgroundColor: colors.gray[700],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.white,
    fontSize: fontSize.base,
    minHeight: 100,
    marginBottom: spacing.lg,
  },
  submitButton: {
    backgroundColor: colors.teal[500],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.base,
  },
});
