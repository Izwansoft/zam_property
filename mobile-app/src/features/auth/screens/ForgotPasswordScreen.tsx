import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import type { RootStackParamList } from '../../../navigation/types';

export function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');

  const onSubmit = () => {
    Alert.alert('Forgot Password', 'Password reset endpoint is not exposed in backend API yet.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>Enter your email to continue.</Text>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#9ca3af"
            style={[styles.input, styles.inputActive]}
            value={email}
          />
        </View>

        <Pressable onPress={onSubmit} style={styles.primaryButtonWrap}>
          <LinearGradient colors={['#7c3aed', '#a855f7']} end={{ x: 1, y: 0 }} start={{ x: 0, y: 0 }} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Send Reset Link</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 28,
    color: '#1f2937',
  },
  title: {
    marginTop: 14,
    fontSize: 40,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#6b7280',
  },
  fieldBlock: {
    marginTop: 24,
    gap: 8,
  },
  label: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  input: {
    height: 62,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#d1d5db',
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f3f4f6',
  },
  inputActive: {
    borderColor: '#a855f7',
  },
  primaryButtonWrap: {
    marginTop: 24,
    borderRadius: 8,
    overflow: 'hidden',
  },
  primaryButton: {
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '500',
  },
});
