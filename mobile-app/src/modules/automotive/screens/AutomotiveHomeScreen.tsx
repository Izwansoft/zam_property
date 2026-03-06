import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { useModuleStore } from '../../../store/module-store';

export function AutomotiveHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const clearSelectedModule = useModuleStore((state) => state.clearSelectedModule);

  const onBackToSelector = () => {
    clearSelectedModule();
    navigation.replace('ModuleSelector');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Automotive Module</Text>
      <Text style={styles.subtitle}>This module shell is ready for automotive UX and flows.</Text>
      <Pressable onPress={onBackToSelector} style={styles.button}>
        <Text style={styles.buttonText}>Back to Module Selector</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#4b5563',
    marginBottom: 10,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#111827',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
