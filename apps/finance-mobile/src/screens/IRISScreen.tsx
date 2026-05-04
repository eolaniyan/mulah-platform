import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { irisApi } from '@mulah/shared-logic';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../lib/theme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function IRISScreen() {
  const navigation = useNavigation<any>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm IRIS, your AI financial assistant. I can help you manage subscriptions, answer questions about your finances, or guide you through Mulah's features. What can I help you with?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');

  const chatMutation = useMutation({
    mutationFn: (message: string) => irisApi.ask(message),
    onSuccess: (response) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.message || "I'm here to help! Could you please rephrase your question?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: () => {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    },
  });

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    chatMutation.mutate(userMessage.content);
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const quickActions = [
    "How can I save money?",
    "Show my subscriptions",
    "Explain USW",
    "Cancel a subscription",
  ];

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      
      <LinearGradient colors={[colors.teal[600], colors.teal[700]]} style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.irisAvatar}>
            <Text style={styles.irisAvatarText}>✨</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>IRIS</Text>
            <Text style={styles.headerSubtitle}>Your AI Financial Assistant</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View 
            key={message.id}
            style={[
              styles.messageBubble,
              message.role === 'user' ? styles.userBubble : styles.assistantBubble
            ]}
          >
            <Text style={[
              styles.messageText,
              message.role === 'user' ? styles.userText : styles.assistantText
            ]}>
              {message.content}
            </Text>
          </View>
        ))}
        
        {chatMutation.isPending && (
          <View style={[styles.messageBubble, styles.assistantBubble]}>
            <Text style={styles.typingIndicator}>IRIS is typing...</Text>
          </View>
        )}

        {messages.length === 1 && (
          <View style={styles.quickActionsContainer}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              {quickActions.map((action, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.quickAction}
                  onPress={() => {
                    setInputText(action);
                  }}
                >
                  <Text style={styles.quickActionText}>{action}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask IRIS anything..."
          placeholderTextColor={colors.gray[500]}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity 
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || chatMutation.isPending}
        >
          <Text style={styles.sendButtonText}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  irisAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  irisAvatarText: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.teal[500],
    borderBottomRightRadius: borderRadius.sm,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gray[800],
    borderBottomLeftRadius: borderRadius.sm,
  },
  messageText: {
    fontSize: fontSize.base,
    lineHeight: 22,
  },
  userText: {
    color: colors.white,
  },
  assistantText: {
    color: colors.gray[200],
  },
  typingIndicator: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    fontStyle: 'italic',
  },
  quickActionsContainer: {
    marginTop: spacing.lg,
  },
  quickActionsTitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickAction: {
    backgroundColor: colors.gray[800],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.gray[700],
  },
  quickActionText: {
    fontSize: fontSize.sm,
    color: colors.teal[400],
  },
  inputContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.gray[800],
    borderTopWidth: 1,
    borderTopColor: colors.gray[700],
  },
  input: {
    flex: 1,
    backgroundColor: colors.gray[700],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.white,
    fontSize: fontSize.base,
    marginRight: spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.teal[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray[600],
  },
  sendButtonText: {
    fontSize: 20,
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
});
