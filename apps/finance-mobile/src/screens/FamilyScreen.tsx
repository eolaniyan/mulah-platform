import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { familyApi } from '../lib/api';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../lib/theme';
import type { FamilyMember } from '../types';

export default function FamilyScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const { data: family } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getFamily().then(r => r.data),
  });

  const { data: members = [] } = useQuery<FamilyMember[]>({
    queryKey: ['family-members'],
    queryFn: () => familyApi.getMembers().then(r => r.data),
    enabled: !!family,
  });

  const inviteMutation = useMutation({
    mutationFn: (email: string) => familyApi.inviteMember(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      setShowInviteModal(false);
      setInviteEmail('');
    },
  });

  const handleInvite = () => {
    if (inviteEmail.trim()) {
      inviteMutation.mutate(inviteEmail.trim());
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
        <Text style={styles.headerTitle}>Family Sharing</Text>
        <Text style={styles.headerSubtitle}>Share subscriptions and split costs</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!family ? (
          <View style={styles.createFamilyContainer}>
            <Text style={styles.createIcon}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.createTitle}>Create Your Family</Text>
            <Text style={styles.createSubtitle}>
              Share eligible subscriptions with family members and split the costs automatically
            </Text>
            <TouchableOpacity style={styles.createButton}>
              <Text style={styles.createButtonText}>Create Family Group</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.familyCard}>
              <Text style={styles.familyName}>{family.name || 'My Family'}</Text>
              <Text style={styles.memberCount}>{members.length} members</Text>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Members</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(true)}>
                <Text style={styles.inviteButton}>+ Invite</Text>
              </TouchableOpacity>
            </View>

            {members.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{member.displayName[0]}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.displayName}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                </View>
                <View style={[styles.statusBadge, member.status === 'active' ? styles.statusActive : styles.statusPending]}>
                  <Text style={styles.statusText}>{member.status}</Text>
                </View>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Shared Subscriptions</Text>
            <View style={styles.emptyShared}>
              <Text style={styles.emptySharedText}>No shared subscriptions yet</Text>
              <Text style={styles.emptySharedSubtext}>
                Only family-eligible plans can be shared
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={showInviteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Invite Family Member</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter email address"
              placeholderTextColor={colors.gray[500]}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowInviteModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalInviteButton}
                onPress={handleInvite}
                disabled={inviteMutation.isPending}
              >
                <Text style={styles.modalInviteText}>
                  {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
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
  createFamilyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing['2xl'],
  },
  createIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  createTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  createSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: colors.teal[500],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  createButtonText: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.base,
  },
  familyCard: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  familyName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  memberCount: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
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
    marginBottom: spacing.md,
  },
  inviteButton: {
    color: colors.teal[400],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.teal[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  memberAvatarText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  memberRole: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusActive: {
    backgroundColor: colors.green[600],
  },
  statusPending: {
    backgroundColor: colors.amber[500],
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.white,
    textTransform: 'capitalize',
  },
  emptyShared: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptySharedText: {
    fontSize: fontSize.base,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  emptySharedSubtext: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
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
    width: '100%',
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: colors.gray[700],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.white,
    fontSize: fontSize.base,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[600],
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.gray[400],
    fontWeight: fontWeight.semibold,
  },
  modalInviteButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.teal[500],
    alignItems: 'center',
  },
  modalInviteText: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
});
