import Icon, { type IconName } from '@/components/ui/Icon';
import { Colors, Fonts } from '@/constants/theme';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Height of the row the icons and labels actually live in. */
const TAB_BODY = 58;

/**
 * How much of the bottom safe-area inset the bar reserves as empty space.
 * The home indicator is a ~5pt pill sitting ~8pt off the bottom edge, so it
 * needs far less clearance than the full 34pt inset iOS reports — reserving
 * all of it left a slab of dead cream under the labels.
 */
const MAX_BOTTOM_RESERVE = 20;

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

  // The bar is a solid cream slab against the dark app, so it absorbs the
  // bottom inset itself — otherwise iOS leaves a dark strip beneath it. But
  // it only reserves as much as the home indicator needs, not the whole inset.
  const reserve = Math.min(insets.bottom, MAX_BOTTOM_RESERVE);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Colors.paper,
          borderTopColor: Colors.ink,
          borderTopWidth: 4,
          height: TAB_BODY + reserve,
          paddingBottom: reserve,
          paddingTop: 4,
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
    gap: 3,
    width: 76,
  },
  iconPad: {
    paddingHorizontal: 12,
    paddingVertical: 4,
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
