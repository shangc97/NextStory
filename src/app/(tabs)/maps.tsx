import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, View } from 'react-native';

import LocationMap from '@/components/maps/location-map';
import { OutlineButton, PrimaryButton, Screen, ScreenTitle } from '@/components/ui';
import { Colors, ScreenPadding, Spacing } from '@/constants/theme';
import { getMapLibraries, NEARBY_RADIUS_KM } from '@/data/libraries';

export default function MapsScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [needsSettings, setNeedsSettings] = useState(false);
  const mounted = useRef(true);
  const inFlight = useRef(false);
  const coordinate = location?.coords ?? null;
  const libraries = useMemo(() => getMapLibraries(coordinate), [coordinate]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const getLocation = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setNeedsSettings(false);
    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!mounted.current) return;
      if (!permission.granted) {
        setNeedsSettings(!permission.canAskAgain);
        setError(permission.canAskAgain
          ? 'Location access was denied. You can try again when you are ready.'
          : Platform.OS === 'web'
            ? 'Allow location access in your browser settings, then try again.'
            : 'Allow location access for NextStory in Settings, then try again.');
        return;
      }

      if (!(await Location.hasServicesEnabledAsync())) {
        if (mounted.current) setError('Location services are turned off. Enable them in your device settings, then try again.');
        return;
      }

      const position = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => reject(new Error('Location timed out')), 20000);
        }),
      ]);
      if (mounted.current) setLocation(position);
    } catch {
      if (mounted.current) setError('Unable to get your location. Check location permissions and your device signal, then try again.');
    } finally {
      if (timeout) clearTimeout(timeout);
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const openSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      if (mounted.current) setError('Unable to open Settings. Open your device settings and allow location access for NextStory.');
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.heading}>
        <ScreenTitle>Maps</ScreenTitle>
      </View>
      <View style={styles.map}>
        <LocationMap coordinate={coordinate} libraries={libraries} />
      </View>
      <View style={styles.controls}>
        <Text style={styles.legend} accessibilityLiveRegion="polite">
          {coordinate
            ? libraries.length > 0
              ? `${libraries.length} sample libraries within ${NEARBY_RADIUS_KM} km`
              : `No sample libraries within ${NEARBY_RADIUS_KM} km. Samples are in Toronto.`
            : `${libraries.length} sample libraries in Toronto`}
        </Text>
        <Text style={styles.body}>Green: fictional sample libraries · Blue: your location. Tap a pin for details.</Text>
        <Text style={styles.body} accessibilityLiveRegion="polite">
          {location
            ? `Location updated at ${new Date(location.timestamp).toLocaleTimeString()}.`
            : 'Explore the map, or use My location to find yourself. Starting view: Toronto.'}
        </Text>
        {busy ? (
          <View style={styles.loading} accessibilityLiveRegion="polite">
            <ActivityIndicator color={Colors.ink} />
            <Text style={styles.body}>Getting your location…</Text>
          </View>
        ) : null}
        {error ? <Text selectable accessibilityRole="alert" style={styles.body}>{error}</Text> : null}
        <PrimaryButton
          label={busy ? 'Getting location…' : error ? 'Try my location again' : 'My location'}
          onPress={getLocation}
          disabled={busy}
        />
        {needsSettings && Platform.OS !== 'web' ? (
          <OutlineButton label="Open settings" onPress={openSettings} />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0, paddingTop: 0 },
  heading: { paddingHorizontal: ScreenPadding, paddingTop: Spacing.lg },
  map: { flex: 1, minHeight: 160, backgroundColor: Colors.fill },
  controls: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  body: { fontSize: 14, lineHeight: 22, color: Colors.muted },
  legend: { fontSize: 14, fontWeight: '700', color: Colors.ink },
  loading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
