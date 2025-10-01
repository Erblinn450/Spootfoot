import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SlotsList from './app/screens/SlotsList';
import SlotDetail from './app/screens/SlotDetail';
import InviteLanding from './app/screens/InviteLanding';
import type { RootStackParamList } from './app/navigation/types';
import { colors } from './app/theme';
import Reservations from './app/screens/Reservations';
import Ionicons from '@expo/vector-icons/Ionicons';
import Login from './app/screens/Login';
import Profile from './app/screens/Profile';
import { UserProvider } from './app/state/UserContext';

const Stack = createNativeStackNavigator<RootStackParamList>();
const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TerrainsStack() {
  return (
    <Stack.Navigator
      initialRouteName="SlotsList"
      screenOptions={{
        headerStyle: { backgroundColor: colors.primarySoft },
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.text },
      }}
    >
      <Stack.Screen name="SlotsList" component={SlotsList} options={{ title: 'Créneaux' }} />
      <Stack.Screen name="SlotDetail" component={SlotDetail} options={{ title: 'Détail' }} />
      <Stack.Screen name="InviteLanding" component={InviteLanding} options={{ title: 'Invitation' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#C1C7D0',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#E5E7EB' },
        tabBarIcon: ({ color, size, focused }) => {
          const name =
            route.name === 'Terrains'
              ? (focused ? 'football' : 'football-outline')
              : route.name === 'Réservations'
              ? (focused ? 'calendar' : 'calendar-outline')
              : (focused ? 'person' : 'person-outline');
          return <Ionicons name={name as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Terrains" component={TerrainsStack} />
      <Tab.Screen name="Réservations" component={Reservations} />
      <Tab.Screen name="Profil" component={Profile} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <UserProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" />
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Login" component={Login} />
          <RootStack.Screen name="MainTabs" component={MainTabs} />
        </RootStack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}
