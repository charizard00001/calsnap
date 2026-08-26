import Icon, { type IconName } from '@/components/ui/Icon';
import { Colors, Fonts } from '@/constants/theme';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_BODY = 68;

function TabItem({
  icon,
  label,
  focused,
}: {
  icon: IconName;
  label: string;
  focused: boolean;
}) {
  return (
    <View style={styles.item}>
      <View
        style={[
          styles.iconPad,
          focused && {
            backgroundColor: Colors.accentPrimary,
            borderWidth: 3,
            borderColor: Colors.ink,
            borderRadius: 13,
          },
        ]}
      >
        <Icon name={icon} size={21} color={Colors.ink} />
      </View>
      <Text style={[styles.label, !focused && styles.labelIdle]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        // The bar is a solid cream slab against the dark app, so it has to
        // absorb the home-indicator inset itself — otherwise iOS leaves a
        // dark strip below it.
        tabBarStyle: {
          backgroundColor: Colors.paper,
          borderTopColor: Colors.ink,
          borderTopWidth: 4,
          height: TAB_BODY + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
          elevation: 0,
        },
        tabBarItemStyle: {
          paddingTop: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => (
            <TabItem icon="plate" label="TODAY" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => (
            <TabItem icon="calendar" label="HISTORY" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ focused }) => (
            <TabItem icon="chart" label="STATS" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabItem icon="user" label="YOU" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: 76,
  },
  iconPad: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  label: {
    fontFamily: Fonts.display,
    fontSize: 8,
    color: Colors.ink,
    letterSpacing: 0.4,
  },
  labelIdle: {
    opacity: 0.45,
  },
});
