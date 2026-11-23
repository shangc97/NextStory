import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { libraryDescription } from '@/data/libraries';

import { DEFAULT_MAP_CENTER, type LocationMapProps } from './location-map.types';

export default function LocationMap({ coordinate, libraries }: LocationMapProps) {
  const map = useRef<MapView>(null);
  const ready = useRef(false);

  const centerOnLocation = useCallback(() => {
    if (!ready.current) return;
    const points = [...libraries.map((library) => library.coordinate), ...(coordinate ? [coordinate] : [])];
    if (points.length > 1) {
      map.current?.fitToCoordinates(points, { edgePadding: { top: 50, right: 40, bottom: 50, left: 40 }, animated: true });
    } else if (coordinate) {
      map.current?.animateToRegion({ ...coordinate, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 500);
    }
  }, [coordinate, libraries]);

  useEffect(() => { centerOnLocation(); }, [centerOnLocation]);

  return (
    <MapView
      ref={map}
      style={styles.map}
      initialRegion={{ ...DEFAULT_MAP_CENTER, latitudeDelta: 0.15, longitudeDelta: 0.15 }}
      onMapReady={() => {
        ready.current = true;
        centerOnLocation();
      }}
      showsMyLocationButton={false}>
      {libraries.map((library) => (
        <Marker key={library.id} coordinate={library.coordinate} title={`${library.name} (Sample)`} description={libraryDescription(library)} pinColor="green" />
      ))}
      {coordinate ? <Marker coordinate={coordinate} title="Your location" description="Your last requested location" pinColor="blue" /> : null}
    </MapView>
  );
}

const styles = StyleSheet.create({ map: { flex: 1 } });
