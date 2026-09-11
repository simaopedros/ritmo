import React from 'react';
import { Tabs } from 'expo-router';
import { Text, StyleSheet, View } from 'react-native';
import { colors, typography } from '@/constants/theme';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const map: Record<string, string> = {
    Hoje: '◉',
    Foco: '◎',
    Progresso: '▦',
    Perfil: '☺',
  };
  return (
    <View style={[styles.iconWrap, focused && styles.iconOn]}>
      <Text style={[styles.icon, focused && styles.iconTextOn]}>
        {map[label] ?? '•'}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.accentSoft,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.label,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoje',
          tabBarIcon: ({ focused }) => <TabIcon label="Hoje" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="foco"
        options={{
          title: 'Foco',
          tabBarIcon: ({ focused }) => <TabIcon label="Foco" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="progresso"
        options={{
          title: 'Progresso',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Progresso" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => <TabIcon label="Perfil" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bgElevated,
    borderTopColor: colors.borderSubtle,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  label: { ...typography.micro, fontSize: 11 },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconOn: { backgroundColor: colors.accentDim },
  icon: { color: colors.textMuted, fontSize: 14 },
  iconTextOn: { color: colors.accentSoft },
});
