import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { useLoginMutation } from '../hooks/use-login-mutation';
import type { RootStackParamList } from '../../../navigation/types';

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [email, setEmail] = useState('zulsyazwan@mail.com');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [securePassword, setSecurePassword] = useState(true);
  const loginMutation = useLoginMutation();

  const onLogin = async () => {
    try {
      await loginMutation.mutateAsync({ email, password });
    } catch {
      Alert.alert('Login failed', 'Please check API URL and credentials.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <Text style={styles.title}>Welcome Back !</Text>
        <Text style={styles.subtitle}>Sign in with your email and password</Text>
        <Text style={styles.subtitle}>or social media to continue</Text>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            style={[styles.input, styles.inputActive]}
            value={email}
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              onChangeText={setPassword}
              secureTextEntry={securePassword}
              style={styles.passwordInput}
              value={password}
            />
            <Pressable onPress={() => setSecurePassword((prev) => !prev)} style={styles.eyeButton}>
              <Text style={styles.eyeText}>{securePassword ? '◌' : '●'}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.rowBetween}>
          <Pressable onPress={() => setRememberMe((prev) => !prev)} style={styles.rowLeft}>
            <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
              {rememberMe ? <Text style={styles.checkIcon}>✓</Text> : null}
            </View>
            <Text style={styles.rememberText}>Remember me</Text>
          </Pressable>

          <Text onPress={() => navigation.navigate('ForgotPassword')} style={styles.linkText}>
            Forgot Password?
          </Text>
        </View>

        <Pressable disabled={loginMutation.isPending} onPress={onLogin} style={styles.primaryButtonWrap}>
          <LinearGradient
            colors={['#7c3aed', '#a855f7']}
            end={{ x: 1, y: 0 }}
            start={{ x: 0, y: 0 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </Text>
          </LinearGradient>
        </Pressable>

        <Text style={styles.orText}>Or</Text>

        <View style={styles.socialRow}>
          <Pressable style={styles.socialButton}>
            <Text style={styles.socialFacebook}>f</Text>
          </Pressable>
          <Pressable style={styles.socialButton}>
            <Text style={styles.socialGoogle}>G</Text>
          </Pressable>
        </View>

        <Text style={styles.footerText}>
          Don’t have account ?{' '}
          <Text onPress={() => navigation.navigate('Register')} style={styles.footerLink}>
            Sign up
          </Text>
        </Text>
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
    fontSize: 50,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 17,
    color: '#9ca3af',
    lineHeight: 26,
  },
  fieldBlock: {
    marginTop: 18,
    gap: 8,
  },
  label: {
    fontSize: 40,
    fontWeight: '700',
    color: '#1f2937',
  },
  input: {
    height: 74,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#d1d5db',
    paddingHorizontal: 18,
    fontSize: 15,
    color: '#1f2937',
    backgroundColor: '#f3f4f6',
  },
  inputActive: {
    borderColor: '#a855f7',
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 74,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#f3f4f6',
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 18,
    fontSize: 15,
    color: '#1f2937',
  },
  eyeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeText: {
    fontSize: 19,
    color: '#9ca3af',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 18,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#c4c4c4',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxActive: {
    backgroundColor: '#8e3fd1',
    borderColor: '#8e3fd1',
  },
  checkIcon: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  rememberText: {
    fontSize: 15,
    color: '#1f2937',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
    color: '#1f2937',
  },
  primaryButtonWrap: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  primaryButton: {
    height: 74,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 23,
    fontWeight: '500',
  },
  orText: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 20,
    color: '#1f2937',
    marginBottom: 16,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 22,
  },
  socialButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialFacebook: {
    color: '#1877f2',
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 54,
  },
  socialGoogle: {
    color: '#ea4335',
    fontSize: 41,
    fontWeight: '700',
    lineHeight: 48,
  },
  footerText: {
    textAlign: 'center',
    color: '#1f2937',
    fontSize: 17,
  },
  footerLink: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
