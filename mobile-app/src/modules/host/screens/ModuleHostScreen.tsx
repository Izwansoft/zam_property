import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { moduleRegistry } from '../../registry/module-registry';
import { useModuleStore } from '../../../store/module-store';

type Props = NativeStackScreenProps<RootStackParamList, 'ModuleHost'>;

export function ModuleHostScreen({ route }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const selectedModule = useModuleStore((state) => state.selectedModule);
  const setSelectedModule = useModuleStore((state) => state.setSelectedModule);

  const moduleFromRoute = route.params?.moduleKey;

  useEffect(() => {
    if (moduleFromRoute && moduleFromRoute !== selectedModule) {
      setSelectedModule(moduleFromRoute);
    }
  }, [moduleFromRoute, selectedModule, setSelectedModule]);

  const moduleKey = moduleFromRoute ?? selectedModule;

  useEffect(() => {
    if (!moduleKey) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'ModuleSelector' }],
      });
    }
  }, [moduleKey, navigation]);

  if (!moduleKey) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>No module selected.</Text>
      </View>
    );
  }

  const moduleEntry = moduleRegistry[moduleKey];

  return <moduleEntry.Shell />;
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  fallbackText: {
    color: '#374151',
    fontSize: 14,
  },
});
