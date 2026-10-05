import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppTabBar, isTabName } from '@/components/app-tab-bar';
import { Colors, MaxContentWidth } from '@/constants/theme';

/** Bottom tabs: Discover, Search, Saved, Profile — drawn with the wireframe tab bar. */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: Colors.background } }}
      tabBar={({ state, navigation }) => {
        const current = state.routes[state.index]?.name;
        return (
          <View style={styles.barOuter}>
            <View style={styles.barInner}>
              <AppTabBar
                active={isTabName(current) ? current : 'discover'}
                onSelect={(tab) => navigation.navigate(tab)}
              />
            </View>
          </View>
        );
      }}>
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="saved" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barOuter: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  barInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
  },
});
