import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import type { RootStackParamList } from '../../../navigation/types';
import { useRegisterMutation } from '../hooks/use-register-mutation';

export function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [email, setEmail] = useState('zulsyazwan@mail.com');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(true);
  const [securePassword, setSecurePassword] = useState(true);
  const registerMutation = useRegisterMutation();

  const onSignUp = async () => {
    if (!agree) {
      Alert.alert('Terms Required', 'Please agree with terms and privacy first.');
      return;
    }

    if (!username.trim()) {
      Alert.alert('Username Required', 'Please enter your username.');
      return;
    }

    try {
      await registerMutation.mutateAsync({
        email,
        password,
        fullName: username,
      });
      Alert.alert('Registration Successful', 'Your account is created. Please sign in.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Login'),
        },
      ]);
    } catch {
      Alert.alert('Registration Failed', 'Please check your details and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <Text style={styles.title}>Register Account</Text>
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
          <Text style={styles.label}>Username</Text>
          <TextInput
            onChangeText={setUsername}
            placeholder="Username"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            value={username}
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={securePassword}
              style={styles.passwordInput}
              value={password}
            />
            <Pressable onPress={() => setSecurePassword((prev) => !prev)} style={styles.eyeButton}>
              <Text style={styles.eyeText}>{securePassword ? '◌' : '●'}</Text>
            </Pressable>
          </View>
        </View>

        <Pressable onPress={() => setAgree((prev) => !prev)} style={styles.rowBetween}>
          <View style={styles.rowLeft}>
            <View style={[styles.checkbox, agree && styles.checkboxActive]}>
              {agree ? <Text style={styles.checkIcon}>✓</Text> : null}
            </View>
            <Text style={styles.rememberText}>
              Agree with <Text style={styles.strong}>terms</Text> and <Text style={styles.strong}>privacy</Text>
            </Text>
          </View>
        </Pressable>

        <Pressable
          disabled={registerMutation.isPending}
          onPress={onSignUp}
          style={styles.primaryButtonWrap}
        >
          <LinearGradient
            colors={['#7c3aed', '#a855f7']}
            end={{ x: 1, y: 0 }}
            start={{ x: 0, y: 0 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              {registerMutation.isPending ? 'Signing up...' : 'Sign Up'}
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
          Already have an account?{' '}
          <Text onPress={() => navigation.navigate('Login')} style={styles.footerLink}>
            Sign in
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
  strong: {
    fontWeight: '700',
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
