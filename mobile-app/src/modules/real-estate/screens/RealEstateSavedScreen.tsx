import { StyleSheet, Text, View } from 'react-native';

export function RealEstateSavedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Properties</Text>
      <Text style={styles.subtitle}>Your shortlisted real-estate properties will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    color: '#4b5563',
  },
});
