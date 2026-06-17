import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { requestPasswordReset } from '../apis/loginApi';
import { colors, fonts, typography } from '../theme';

interface ForgotPasswordScreenProps {
  navigation: any;
}

function BackIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={3.25} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 18l-6-6 6-6" />
    </Svg>
  );
}

function PremiumBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <RadialGradient id="forgotGlow1" cx="85%" cy="12%" rx="55%" ry="55%">
            <Stop offset="0%" stopColor="#D4E4FF" stopOpacity="0.75" />
            <Stop offset="100%" stopColor={colors.background} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="forgotGlow2" cx="10%" cy="88%" rx="60%" ry="60%">
            <Stop offset="0%" stopColor="#EDE9FE" stopOpacity="0.65" />
            <Stop offset="100%" stopColor={colors.background} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="90%" cy="8%" r="220" fill="url(#forgotGlow1)" />
        <Circle cx="8%" cy="92%" r="200" fill="url(#forgotGlow2)" />
      </Svg>
    </View>
  );
}

export default function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [organizationSlug, setOrganizationSlug] = useState('');
  const [showOrgCode, setShowOrgCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedOrg, setIsFocusedOrg] = useState(false);

  const handleSubmit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await requestPasswordReset(
        normalizedEmail,
        showOrgCode && organizationSlug.trim() ? organizationSlug.trim() : undefined,
      );
      setSuccessMessage(result.message);
    } catch (err: any) {
      const message = err?.message ?? 'Could not send reset link.';
      if (message.includes('more than one workspace')) {
        setShowOrgCode(true);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <PremiumBackground />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.container}>
            <View style={styles.topBar}>
              <Pressable
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <BackIcon />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.content}>
                <View style={styles.headerBlock}>
                  <Text style={styles.title}>Forgot Password</Text>
                  <Text style={styles.subtitle}>
                    Enter your work email and we&apos;ll send you a link to reset your password.
                  </Text>
                </View>

                {successMessage ? (
                  <View style={styles.successBlock}>
                    <Text style={styles.successText}>{successMessage}</Text>
                    <Pressable onPress={() => navigation.navigate('Login')} style={styles.loginButtonPressable}>
                      <LinearGradient
                        colors={[colors.gradientStart, colors.gradientEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.loginButtonGradient}
                      >
                        <Text style={styles.loginButtonText}>Back to Sign In</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.formBlock}>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Email Address</Text>
                      <TextInput
                        style={[styles.input, isFocusedEmail && styles.inputFocused]}
                        placeholder="you@company.com"
                        placeholderTextColor={colors.placeholder}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        autoComplete="email"
                        keyboardType="email-address"
                        textContentType="emailAddress"
                        onFocus={() => setIsFocusedEmail(true)}
                        onBlur={() => setIsFocusedEmail(false)}
                      />
                    </View>

                    {showOrgCode ? (
                      <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Organization Code</Text>
                        <TextInput
                          style={[styles.input, isFocusedOrg && styles.inputFocused]}
                          placeholder="ABCD1234"
                          placeholderTextColor={colors.placeholder}
                          value={organizationSlug}
                          onChangeText={(value) => setOrganizationSlug(value.toUpperCase())}
                          autoCapitalize="characters"
                          onFocus={() => setIsFocusedOrg(true)}
                          onBlur={() => setIsFocusedOrg(false)}
                        />
                      </View>
                    ) : null}

                    {error ? (
                      <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    ) : null}

                    <Pressable onPress={handleSubmit} disabled={loading} style={styles.loginButtonPressable}>
                      <LinearGradient
                        colors={[colors.gradientStart, colors.gradientEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.loginButtonGradient}
                      >
                        {loading ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Text style={styles.loginButtonText}>Send Reset Link</Text>
                        )}
                      </LinearGradient>
                    </Pressable>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 28,
  },
  topBar: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 32,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  headerBlock: {
    marginBottom: 36,
  },
  title: {
    ...typography.screenTitle,
    fontSize: 30,
    lineHeight: 36,
    color: colors.text,
    letterSpacing: -0.8,
    marginBottom: 12,
  },
  subtitle: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSecondary,
  },
  formBlock: {
    gap: 24,
  },
  fieldGroup: {
    gap: 10,
  },
  fieldLabel: {
    ...typography.label,
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    width: '100%',
    height: 54,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    paddingHorizontal: 16,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  inputFocused: {
    borderColor: `${colors.accent}80`,
    backgroundColor: colors.surface,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
  },
  errorText: {
    ...typography.bodySmall,
    color: '#B91C1C',
    lineHeight: 20,
  },
  successBlock: {
    gap: 24,
  },
  successText: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 23,
    color: '#15803D',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 16,
  },
  loginButtonPressable: {
    width: '100%',
    marginTop: 8,
  },
  loginButtonGradient: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  loginButtonText: {
    ...typography.button,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
