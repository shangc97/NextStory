import * as Location from 'expo-location';
import { Link } from 'expo-router';
import { type ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import LocationMap from '@/components/maps/location-map';
import { OutlineButton, PrimaryButton, Screen, ScreenTitle } from '@/components/ui';
import { Colors, ScreenPadding, Spacing } from '@/constants/theme';
import { getMapLibraries, LIBRARY_DATASET_URL, LIBRARY_LICENCE_URL, NEARBY_RADIUS_KM } from '@/data/libraries';
import { useLibraryBranches } from '@/hooks/use-library-branches';

export default function MapsScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [needsSettings, setNeedsSettings] = useState(false);
  const mounted = useRef(true);
  const inFlight = useRef(false);
  const { branches, loading: branchesLoading, error: branchesError, refresh } = useLibraryBranches();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const controls = useRef<ComponentRef<typeof ScrollView>>(null);
  const coordinate = location?.coords ?? null;
  const libraries = useMemo(() => getMapLibraries(branches ?? [], coordinate), [branches, coordinate]);
  const selectedLibrary = libraries.find((library) => library.id === selectedId);
  const selectLibrary = useCallback((id: string) => {
    setSelectedId(id);
    controls.current?.scrollTo({ y: 0, animated: true });
  }, []);

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
        <LocationMap coordinate={coordinate} libraries={libraries} onSelectLibrary={selectLibrary} />
      </View>
      <ScrollView ref={controls} style={styles.controlsScroll} contentContainerStyle={styles.controls}>
        {selectedLibrary ? (
          <View style={styles.details}>
            <Text selectable style={styles.legend}>{selectedLibrary.name}</Text>
            <Text selectable style={styles.detailText}>{selectedLibrary.address}</Text>
            <Text style={styles.legend}>Opening hours</Text>
            <Text selectable style={styles.detailText}>{selectedLibrary.hours.split(/;\s*/).join('\n')}</Text>
            {selectedLibrary.distanceKm != null ? <Text style={styles.body}>{selectedLibrary.distanceKm.toFixed(1)} km away (straight-line)</Text> : null}
            <OutlineButton label="Close details" onPress={() => setSelectedId(null)} />
          </View>
        ) : null}
        <Text style={styles.legend} accessibilityLiveRegion="polite">
          {branches === null
            ? branchesLoading ? 'Loading library locations…' : 'Library locations unavailable'
            : branches.length === 0 ? 'No branch locations available'
            : coordinate
            ? libraries.length > 0
              ? `${libraries.length} libraries within ${NEARBY_RADIUS_KM} km`
              : `No TPL branches within ${NEARBY_RADIUS_KM} km. Branches are in Toronto.`
            : `${libraries.length} Toronto Public Library branches`}
        </Text>
        <Text style={styles.body}>Green: libraries · Blue: your location. Tap a pin for address and hours.</Text>
        {branchesError ? <Text selectable accessibilityRole="alert" style={styles.body}>{branchesError}{branches !== null ? ' Showing previously loaded locations.' : ''}</Text> : null}
        <OutlineButton label={branchesLoading ? 'Loading libraries…' : branchesError ? 'Retry loading libraries' : 'Refresh libraries'} disabled={branchesLoading} onPress={refresh} />
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
        <Text style={styles.body}>Standard hours may change for holidays or closures.</Text>
        <Text style={styles.source}>Source: <Link href={LIBRARY_DATASET_URL} style={styles.link}>Toronto Public Library / Toronto Open Data</Link>.</Text>
        <Text style={styles.source}>Contains information licensed under the <Link href={LIBRARY_LICENCE_URL} style={styles.link}>Open Government Licence – Toronto</Link>.</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0, paddingTop: 0 },
  heading: { paddingHorizontal: ScreenPadding, paddingTop: Spacing.lg },
  map: { flex: 1, minHeight: 160, backgroundColor: Colors.fill },
  controlsScroll: { maxHeight: '50%', flexGrow: 0, backgroundColor: Colors.surface },
  controls: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  body: { fontSize: 14, lineHeight: 22, color: Colors.muted },
  detailText: { fontSize: 14, lineHeight: 22, color: Colors.ink },
  details: { gap: Spacing.sm, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  source: { fontSize: 12, lineHeight: 18, color: Colors.muted },
  link: { textDecorationLine: 'underline' },
  legend: { fontSize: 14, fontWeight: '700', color: Colors.ink },
  loading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
