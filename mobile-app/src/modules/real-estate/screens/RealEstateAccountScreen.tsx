import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { useAuthStore } from '../../../store/auth-store';
import { useModuleStore } from '../../../store/module-store';

export function RealEstateAccountScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const clearSelectedModule = useModuleStore((state) => state.clearSelectedModule);

  const onSwitchModule = () => {
    clearSelectedModule();
    navigation.replace('ModuleSelector');
  };

  const onSignOut = () => {
    clearSelectedModule();
    clearSession();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account</Text>
      <Text style={styles.subtitle}>{user?.email ?? 'Unknown user'}</Text>

      <Pressable onPress={onSwitchModule} style={styles.buttonOutline}>
        <Text style={styles.buttonOutlineText}>Switch Module</Text>
      </Pressable>

      <Pressable onPress={onSignOut} style={styles.buttonPrimary}>
        <Text style={styles.buttonPrimaryText}>Sign Out</Text>
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
    backgroundColor: '#fff',
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  buttonOutline: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#8b5cf6',
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonOutlineText: {
    color: '#7c3aed',
    fontWeight: '700',
  },
  buttonPrimary: {
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonPrimaryText: {
    color: '#fff',
    fontWeight: '700',
  },
});
