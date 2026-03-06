import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import type { RootStackParamList } from '../../../navigation/types';

export function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ImageBackground
      resizeMode="cover"
      source={{ uri: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80' }}
      style={styles.background}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.overlay} />
        <View style={styles.content}>
          <Text style={styles.kicker}>Find Your Space</Text>
          <Text style={styles.headline}>
            Start your journey{`\n`}with <Text style={styles.bold}>Laman Niaga</Text>
          </Text>

          <Pressable onPress={() => navigation.navigate('Login')} style={styles.primaryButtonWrap}>
            <LinearGradient
              colors={['#7c3aed', '#a855f7']}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 0 }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Sign In</Text>
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  safeArea: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 22,
    paddingBottom: 34,
  },
  kicker: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  headline: {
    color: '#ffffff',
    fontSize: 56,
    lineHeight: 64,
    marginBottom: 26,
    fontWeight: '300',
  },
  bold: {
    fontWeight: '700',
  },
  primaryButtonWrap: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  primaryButton: {
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '500',
  },
  orText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 20,
    marginBottom: 16,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 26,
  },
  socialButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialFacebook: {
    color: '#1877f2',
    fontSize: 52,
    fontWeight: '700',
    lineHeight: 56,
  },
  socialGoogle: {
    color: '#ea4335',
    fontSize: 44,
    fontWeight: '700',
    lineHeight: 50,
  },
  footerText: {
    color: '#f3f4f6',
    textAlign: 'center',
    fontSize: 17,
  },
  footerLink: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
