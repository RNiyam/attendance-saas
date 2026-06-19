import React, { useEffect, useMemo, useState } from 'react';
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
import Svg, { Path, Circle, Line, Defs, RadialGradient, Stop } from 'react-native-svg';

import { resetPasswordWithToken, validatePasswordResetToken } from '../apis/loginApi';
import { colors, fonts, typography } from '../theme';

interface ResetPasswordScreenProps {
  navigation: any;
  route: { params?: { token?: string } };
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
          <RadialGradient id="resetGlow1" cx="85%" cy="12%" rx="55%" ry="55%">
            <Stop offset="0%" stopColor="#D4E4FF" stopOpacity="0.75" />
            <Stop offset="100%" stopColor={colors.background} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="resetGlow2" cx="10%" cy="88%" rx="60%" ry="60%">
            <Stop offset="0%" stopColor="#EDE9FE" stopOpacity="0.65" />
            <Stop offset="100%" stopColor={colors.background} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="90%" cy="8%" r="220" fill="url(#resetGlow1)" />
        <Circle cx="8%" cy="92%" r="200" fill="url(#resetGlow2)" />
      </Svg>
    </View>
  );
}

function CheckIcon({ met }: { met: boolean }) {
  if (met) {
    return (
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M20 6L9 17l-5-5" />
      </Svg>
    );
  }
  return <View style={styles.checkDot} />;
}

export default function ResetPasswordScreen({ navigation, route }: ResetPasswordScreenProps) {
  const insets = useSafeAreaInsets();
  const token = (route.params?.token ?? '').trim();

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isFocusedNew, setIsFocusedNew] = useState(false);
  const [isFocusedConfirm, setIsFocusedConfirm] = useState(false);

  const passwordChecks = useMemo(() => {
    const lower = /[a-z]/.test(newPassword);
    const upper = /[A-Z]/.test(newPassword);
    const number = /[0-9]/.test(newPassword);
    const special = /[^A-Za-z0-9]/.test(newPassword);
    const variety = [lower, upper, number, special].filter(Boolean).length;
    return {
      min8: newPassword.length >= 8,
      variety: variety >= 3,
      upper,
      number,
      special,
    };
  }, [newPassword]);

  const canSubmit =
    tokenValid &&
    passwordChecks.min8 &&
    passwordChecks.variety &&
    newPassword === confirmPassword &&
    !loading;

  useEffect(() => {
    if (!token) {
      setValidating(false);
      setTokenValid(false);
      setError('This password reset link is invalid or has expired.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const result = await validatePasswordResetToken(token);
        if (cancelled) return;
        setTokenValid(true);
        setAccountEmail(result.email);
      } catch (err: any) {
        if (!cancelled) {
          setTokenValid(false);
          setError(err?.message ?? 'This password reset link is invalid or has expired.');
        }
      } finally {
        if (!cancelled) setValidating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const result = await resetPasswordWithToken(token, newPassword);
      setSuccessMessage(result.message);
      setTimeout(() => navigation.replace('Login'), 2500);
    } catch (err: any) {
      setError(err?.message ?? 'Could not reset password.');
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
                onPress={() => navigation.navigate('Login')}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Go back to sign in"
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
                  <Text style={styles.title}>Reset Password</Text>
                  <Text style={styles.subtitle}>
                    {accountEmail
                      ? `Choose a new password for ${accountEmail}.`
                      : 'Choose a strong new password for your account.'}
                  </Text>
                </View>

                {validating ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : successMessage ? (
                  <View style={styles.successBlock}>
                    <Text style={styles.successText}>{successMessage}</Text>
                  </View>
                ) : !tokenValid ? (
                  <View style={styles.invalidBlock}>
                    {error ? (
                      <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    ) : null}
                    <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={styles.loginButtonPressable}>
                      <LinearGradient
                        colors={[colors.gradientStart, colors.gradientEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.loginButtonGradient}
                      >
                        <Text style={styles.loginButtonText}>Request a New Link</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.formBlock}>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>New Password</Text>
                      <View style={styles.passwordRow}>
                        <TextInput
                          style={[styles.input, styles.passwordInput, isFocusedNew && styles.inputFocused]}
                          placeholder="Create a strong password"
                          placeholderTextColor={colors.placeholder}
                          value={newPassword}
                          onChangeText={setNewPassword}
                          secureTextEntry={!showPassword}
                          autoComplete="new-password"
                          textContentType="newPassword"
                          onFocus={() => setIsFocusedNew(true)}
                          onBlur={() => setIsFocusedNew(false)}
                        />
                        <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton} hitSlop={8}>
                          {showPassword ? (
                            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.5 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <Line x1="1" y1="1" x2="23" y2="23" />
                            </Svg>
                          ) : (
                            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <Circle cx="12" cy="12" r="3" />
                            </Svg>
                          )}
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Confirm Password</Text>
                      <TextInput
                        style={[styles.input, isFocusedConfirm && styles.inputFocused]}
                        placeholder="Re-enter your password"
                        placeholderTextColor={colors.placeholder}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showPassword}
                        autoComplete="new-password"
                        textContentType="newPassword"
                        onFocus={() => setIsFocusedConfirm(true)}
                        onBlur={() => setIsFocusedConfirm(false)}
                      />
                    </View>

                    {newPassword ? (
                      <View style={styles.requirementsBox}>
                        <Text style={styles.requirementsTitle}>Password must contain:</Text>
                        {[
                          { label: 'At least 8 characters', met: passwordChecks.min8 },
                          { label: 'At least one capital letter', met: passwordChecks.upper },
                          { label: 'At least one number', met: passwordChecks.number },
                          { label: 'At least one special character', met: passwordChecks.special },
                        ].map(({ label, met }) => (
                          <View key={label} style={styles.requirementRow}>
                            <View style={[styles.checkCircle, met ? styles.checkCircleMet : styles.checkCircleUnmet]}>
                              <CheckIcon met={met} />
                            </View>
                            <Text style={[styles.requirementText, met ? styles.requirementMet : styles.requirementUnmet]}>
                              {label}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    {confirmPassword && newPassword !== confirmPassword ? (
                      <Text style={styles.mismatchText}>Passwords do not match.</Text>
                    ) : null}

                    {error ? (
                      <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    ) : null}

                    <Pressable onPress={handleSubmit} disabled={!canSubmit} style={styles.loginButtonPressable}>
                      <LinearGradient
                        colors={canSubmit ? [colors.gradientStart, colors.gradientEnd] : [colors.border, colors.border]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.loginButtonGradient}
                      >
                        {loading ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Text style={styles.loginButtonText}>Update Password</Text>
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
    borderWidth: 3,
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
  invalidBlock: {
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
  passwordRow: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  requirementsBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    padding: 14,
    gap: 10,
  },
  requirementsTitle: {
    ...typography.bodySmall,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleMet: {
    backgroundColor: '#DCFCE7',
  },
  checkCircleUnmet: {
    backgroundColor: '#FFEDD5',
  },
  checkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EA580C',
  },
  requirementText: {
    ...typography.bodySmall,
    flex: 1,
  },
  requirementMet: {
    color: '#15803D',
  },
  requirementUnmet: {
    color: '#C2410C',
  },
  mismatchText: {
    ...typography.bodySmall,
    color: '#DC2626',
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
