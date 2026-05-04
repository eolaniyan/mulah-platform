import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../lib/theme';

import HomeScreen from '../screens/HomeScreen';
import GetStartedScreen from '../screens/GetStartedScreen';
import SubscriptionDashboard from '../screens/SubscriptionDashboard';
import AddSubscriptionScreen from '../screens/AddSubscriptionScreen';
import USWScreen from '../screens/USWScreen';
import VirtualCardsScreen from '../screens/VirtualCardsScreen';
import FamilyScreen from '../screens/FamilyScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ConciergeScreen from '../screens/ConciergeScreen';
import CashflowScreen from '../screens/CashflowScreen';
import InsightsScreen from '../screens/InsightsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import IRISScreen from '../screens/IRISScreen';

export type RootStackParamList = {
  GetStarted: undefined;
  Main: undefined;
  Home: undefined;
  SubscriptionHub: undefined;
  FinanceHub: undefined;
  SubscriptionDashboard: undefined;
  AddSubscription: undefined;
  USW: undefined;
  VirtualCards: undefined;
  Family: undefined;
  Calendar: undefined;
  Concierge: undefined;
  Cashflow: undefined;
  Insights: undefined;
  Analytics: undefined;
  Profile: undefined;
  IRIS: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const SubscriptionTab = createBottomTabNavigator();
const FinanceTab = createBottomTabNavigator();

function SubscriptionTabNavigator() {
  return (
    <SubscriptionTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.teal[600],
        tabBarInactiveTintColor: colors.gray[500],
      }}
    >
      <SubscriptionTab.Screen 
        name="Subs" 
        component={SubscriptionDashboard}
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="list" color={color} />,
        }}
      />
      <SubscriptionTab.Screen 
        name="Cards" 
        component={VirtualCardsScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="card" color={color} />,
        }}
      />
      <SubscriptionTab.Screen 
        name="USW" 
        component={USWScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="wallet" color={color} isCenter />,
        }}
      />
      <SubscriptionTab.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="calendar" color={color} />,
        }}
      />
      <SubscriptionTab.Screen 
        name="More" 
        component={MorePlaceholder}
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="more" color={color} />,
        }}
      />
    </SubscriptionTab.Navigator>
  );
}

function FinanceTabNavigator() {
  return (
    <FinanceTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.amber[500],
        tabBarInactiveTintColor: colors.gray[500],
      }}
    >
      <FinanceTab.Screen 
        name="Cashflow" 
        component={CashflowScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="trending" color={color} />,
        }}
      />
      <FinanceTab.Screen 
        name="Insights" 
        component={InsightsScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="bulb" color={color} />,
        }}
      />
      <FinanceTab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="chart" color={color} />,
        }}
      />
    </FinanceTab.Navigator>
  );
}

function MorePlaceholder() {
  return (
    <View style={styles.placeholder}>
      <Text>More Options</Text>
    </View>
  );
}

function TabIcon({ name, color, isCenter }: { name: string; color: string; isCenter?: boolean }) {
  const icons: { [key: string]: string } = {
    list: '☰',
    card: '💳',
    wallet: '👛',
    calendar: '📅',
    more: '•••',
    trending: '📈',
    bulb: '💡',
    chart: '📊',
  };
  
  if (isCenter) {
    return (
      <View style={styles.centerIcon}>
        <Text style={styles.centerIconText}>{icons[name]}</Text>
      </View>
    );
  }
  
  return <Text style={[styles.iconText, { color }]}>{icons[name]}</Text>;
}

function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="SubscriptionHub" component={SubscriptionTabNavigator} />
      <Stack.Screen name="FinanceHub" component={FinanceTabNavigator} />
      <Stack.Screen name="AddSubscription" component={AddSubscriptionScreen} />
      <Stack.Screen name="Family" component={FamilyScreen} />
      <Stack.Screen name="Concierge" component={ConciergeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="IRIS" component={IRISScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>M</Text>
        </View>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="GetStarted" component={GetStartedScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  iconText: {
    fontSize: 20,
  },
  centerIcon: {
    backgroundColor: colors.teal[500],
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  centerIconText: {
    fontSize: 20,
    color: colors.white,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.teal[700],
  },
  loadingLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.amber[400],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingLogoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.teal[900],
  },
  loadingText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
});
