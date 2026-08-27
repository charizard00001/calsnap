import Icon, { type IconName } from '@/components/ui/Icon';
import { Colors, Fonts } from '@/constants/theme';
import { sfx } from '@/lib/sfx';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Height of the row the icons and labels actually live in. Sized so the
 * focused pill (34pt with its border) has real clearance from the bar's top
 * edge rather than grazing it.
 */
const TAB_BODY = 64;

/**
 * Clearance between the bar's top border and the focused pill. The items are
 * top-aligned in the bar, so this — not the bar's height — is what keeps the
 * pill off the 4pt ink border it was colliding with.
 */
const TAB_PADDING_TOP = 12;

/**
 * How much of the bottom safe-area inset the bar reserves as empty space.
 * The home indicator is a ~5pt pill sitting ~8pt off the bottom edge, so it
 * needs far less clearance than the full 34pt inset iOS reports — reserving
 * all of it left a slab of dead cream under the labels.
 */
const MAX_BOTTOM_RESERVE = 20;

/**
 * Each tab plays the same selector blip a step higher than the one to its
 * left, so moving across the bar sounds like running up a short scale.
 * Roughly a major-ish four-note run (1, 9/8, 5/4, 3/2).
 */
const NAV_PITCH = [1, 1.12, 1.26, 1.5];

function navSound(index: number) {
  return {
    tabPress: () => sfx('nav', { pitch: NAV_PITCH[index] }),
  };
}

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
            borderColor: Colors.ink,
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
          paddingTop: TAB_PADDING_TOP,
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
        listeners={navSound(0)}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => (
            <TabItem icon="calendar" label="HISTORY" focused={focused} />
          ),
        }}
        listeners={navSound(1)}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ focused }) => (
            <TabItem icon="chart" label="STATS" focused={focused} />
          ),
        }}
        listeners={navSound(2)}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabItem icon="user" label="YOU" focused={focused} />
          ),
        }}
        listeners={navSound(3)}
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
    // The border is always here, transparent when idle. Adding it only on
    // focus made the active tab 6pt taller than the row was sized for, so
    // its pill punched up through the bar's top edge — and every switch
    // nudged the icons by 3pt.
    borderWidth: 3,
    borderColor: 'transparent',
    borderRadius: 13,
  },
  label: {
    fontFamily: Fonts.display,
    fontSize: 8,
    // Pinned so the row's height doesn't depend on Bungee's tall metrics.
    lineHeight: 11,
    color: Colors.ink,
    letterSpacing: 0.4,
  },
  labelIdle: {
    opacity: 0.45,
  },
});
