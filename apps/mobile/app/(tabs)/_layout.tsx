import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Image } from 'react-native';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    index: '🏠',
    checklists: '✅',
    reportar: '⚠️',
    consumiveis: '📦',
    registos: '📋',
  };
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapFocused]}>
      <Text style={tabStyles.emoji}>{icons[name] ?? '•'}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 4,
  },
  iconWrapFocused: {
    backgroundColor: '#dbeafe',
  },
  emoji: {
    fontSize: 20,
  },
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          backgroundColor: '#ffffff',
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#2563eb',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon name="index" focused={focused} />,
          headerTitle: () => (
            <Image
              source={require('../../assets/logo-patakus.png')}
              style={{ width: 130, height: 45 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="checklists"
        options={{
          title: 'Checklists',
          tabBarLabel: 'Checklists',
          tabBarIcon: ({ focused }) => <TabIcon name="checklists" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="reportar"
        options={{
          title: 'Reportar',
          tabBarLabel: 'Reportar',
          tabBarIcon: ({ focused }) => <TabIcon name="reportar" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="consumiveis"
        options={{
          title: 'Consumíveis',
          tabBarLabel: 'Consumíveis',
          tabBarIcon: ({ focused }) => <TabIcon name="consumiveis" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="registos"
        options={{
          title: 'Registos',
          tabBarLabel: 'Registos',
          tabBarIcon: ({ focused }) => <TabIcon name="registos" focused={focused} />,
        }}
      />
      {/* Manter temperaturas acessível mas fora da tab bar */}
      <Tabs.Screen
        name="temperaturas"
        options={{ href: null }}
      />
    </Tabs>
  );
}
