import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { subscriptionsApi } from '../lib/api';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../lib/theme';
import type { Subscription } from '../types';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarScreen() {
  const navigation = useNavigation<any>();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { data: subscriptions = [] } = useQuery<Subscription[]>({
    queryKey: ['subscriptions'],
    queryFn: () => subscriptionsApi.getAll().then(r => r.data),
  });

  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const getSubscriptionsForDate = (day: number) => {
    return subscriptions.filter(sub => {
      const billingDate = new Date(sub.nextBillingDate);
      return billingDate.getDate() === day && 
             billingDate.getMonth() === currentMonth && 
             billingDate.getFullYear() === currentYear;
    });
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentYear, currentMonth + direction, 1);
    setSelectedDate(newDate);
  };

  const renderCalendarDays = () => {
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const subsForDay = getSubscriptionsForDate(day);
      const isToday = new Date().getDate() === day && 
                      new Date().getMonth() === currentMonth && 
                      new Date().getFullYear() === currentYear;
      
      days.push(
        <TouchableOpacity 
          key={day} 
          style={[styles.dayCell, isToday && styles.todayCell]}
          onPress={() => {}}
        >
          <Text style={[styles.dayText, isToday && styles.todayText]}>{day}</Text>
          {subsForDay.length > 0 && (
            <View style={styles.billIndicator}>
              <Text style={styles.billCount}>{subsForDay.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }
    
    return days;
  };

  const upcomingBills = subscriptions
    .filter(sub => {
      const billingDate = new Date(sub.nextBillingDate);
      return billingDate >= new Date();
    })
    .sort((a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime())
    .slice(0, 5);

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
        <Text style={styles.headerTitle}>Bill Calendar</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.calendarCard}>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => navigateMonth(-1)}>
              <Text style={styles.navArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{MONTHS[currentMonth]} {currentYear}</Text>
            <TouchableOpacity onPress={() => navigateMonth(1)}>
              <Text style={styles.navArrow}>›</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.weekDays}>
            {DAYS.map(day => (
              <Text key={day} style={styles.weekDay}>{day}</Text>
            ))}
          </View>
          
          <View style={styles.daysGrid}>
            {renderCalendarDays()}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Upcoming Bills</Text>
        
        {upcomingBills.length === 0 ? (
          <View style={styles.emptyBills}>
            <Text style={styles.emptyBillsText}>No upcoming bills</Text>
          </View>
        ) : (
          upcomingBills.map((sub) => {
            const billingDate = new Date(sub.nextBillingDate);
            const daysUntil = Math.ceil((billingDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            
            return (
              <View key={sub.id} style={styles.billCard}>
                <View style={[styles.billIcon, { backgroundColor: sub.iconColor || colors.teal[500] }]}>
                  <Text style={styles.billIconText}>{sub.name[0]}</Text>
                </View>
                <View style={styles.billInfo}>
                  <Text style={styles.billName}>{sub.name}</Text>
                  <Text style={styles.billDate}>
                    {billingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <View style={styles.billRight}>
                  <Text style={styles.billAmount}>€{parseFloat(sub.cost).toFixed(2)}</Text>
                  <Text style={[styles.billDays, daysUntil <= 3 && styles.billDaysUrgent]}>
                    {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                  </Text>
                </View>
              </View>
            );
          })
        )}
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
  calendarCard: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  navArrow: {
    fontSize: 28,
    color: colors.teal[400],
    paddingHorizontal: spacing.md,
  },
  monthTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: colors.gray[500],
    fontWeight: fontWeight.medium,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  todayCell: {
    backgroundColor: colors.teal[600],
    borderRadius: borderRadius.md,
  },
  dayText: {
    fontSize: fontSize.sm,
    color: colors.white,
  },
  todayText: {
    fontWeight: fontWeight.bold,
  },
  billIndicator: {
    position: 'absolute',
    bottom: 2,
    backgroundColor: colors.amber[500],
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  billCount: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  emptyBills: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyBillsText: {
    color: colors.gray[500],
    fontSize: fontSize.sm,
  },
  billCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  billIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  billIconText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  billInfo: {
    flex: 1,
  },
  billName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  billDate: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
  },
  billRight: {
    alignItems: 'flex-end',
  },
  billAmount: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  billDays: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  billDaysUrgent: {
    color: colors.amber[500],
  },
});
