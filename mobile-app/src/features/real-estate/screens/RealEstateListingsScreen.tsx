import { ActivityIndicator, Button, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { env } from '../../../config/env';
import type { RootStackParamList } from '../../../navigation/types';
import { useAuthStore } from '../../../store/auth-store';
import { useModuleStore } from '../../../store/module-store';
import { useRealEstateListings } from '../hooks/use-real-estate-listings';

export function RealEstateListingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const clearSelectedModule = useModuleStore((state) => state.clearSelectedModule);

  const onSignOut = () => {
    clearSelectedModule();
    clearSession();
  };

  const onChangeModule = () => {
    clearSelectedModule();
    navigation.replace('ModuleSelector');
  };

  const listingsQuery = useRealEstateListings({
    page: 1,
    pageSize: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const items = listingsQuery.data?.items ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{env.appName}</Text>
        <Text style={styles.subtitle}>Real Estate Listings</Text>
        <Text style={styles.meta}>Signed in as: {user?.email ?? 'Unknown user'}</Text>
        <Button onPress={onChangeModule} title="Switch Module" />
        <Button onPress={onSignOut} title="Sign Out" />
      </View>

      {listingsQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" />
          <Text style={styles.stateText}>Loading properties...</Text>
        </View>
      ) : listingsQuery.isError ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>Unable to load listings. Check API and auth.</Text>
          <Button onPress={() => listingsQuery.refetch()} title="Retry" />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={items}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              onRefresh={() => listingsQuery.refetch()}
              refreshing={listingsQuery.isRefetching}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardPrice}>
                {item.currency} {Number(item.price ?? 0).toLocaleString()}
              </Text>
              <Text style={styles.cardMeta}>
                {item.location?.city ?? '-'}{item.location?.state ? `, ${item.location.state}` : ''}
              </Text>
              <Text style={styles.cardMeta}>Status: {item.status}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.stateText}>No real-estate listings found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 6,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  meta: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 4,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  stateText: {
    textAlign: 'center',
    color: '#374151',
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    gap: 4,
    backgroundColor: '#ffffff',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  cardMeta: {
    fontSize: 12,
    color: '#4b5563',
  },
});
