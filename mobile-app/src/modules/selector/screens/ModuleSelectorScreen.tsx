import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { moduleRegistry } from '../../registry/module-registry';
import type { ModuleKey } from '../../registry/types';
import { useModuleStore } from '../../../store/module-store';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function ModuleSelectorScreen() {
  const navigation = useNavigation<Navigation>();
  const setSelectedModule = useModuleStore((state) => state.setSelectedModule);

  const modules = Object.values(moduleRegistry).map((entry) => entry.meta);

  const onSelectModule = (moduleKey: ModuleKey) => {
    setSelectedModule(moduleKey);
    navigation.replace('ModuleHost', { moduleKey });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Choose Your Module</Text>
        <Text style={styles.subtitle}>Each module can have its own UX shell and routing.</Text>

        <View style={styles.list}>
          {modules.map((moduleItem) => (
            <Pressable
              key={moduleItem.key}
              onPress={() => onSelectModule(moduleItem.key)}
              style={styles.card}
            >
              <Text style={styles.cardTitle}>{moduleItem.title}</Text>
              <Text style={styles.cardDescription}>{moduleItem.description}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#4b5563',
  },
  list: {
    marginTop: 20,
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  cardDescription: {
    marginTop: 4,
    fontSize: 13,
    color: '#4b5563',
  },
});
