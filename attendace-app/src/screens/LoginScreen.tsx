import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Easing,
  ActivityIndicator,
  Switch,
  useWindowDimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { loginUser, getUserSession, verifyFace } from '../apis/loginApi';
import { colors, fonts, typography } from '../theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle, Line, Polyline, Defs, RadialGradient, Stop } from 'react-native-svg';

interface LoginScreenProps {
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
          <RadialGradient id="loginGlow1" cx="85%" cy="12%" rx="55%" ry="55%">
            <Stop offset="0%" stopColor="#D4E4FF" stopOpacity="0.75" />
            <Stop offset="100%" stopColor={colors.background} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="loginGlow2" cx="10%" cy="88%" rx="60%" ry="60%">
            <Stop offset="0%" stopColor="#EDE9FE" stopOpacity="0.65" />
            <Stop offset="100%" stopColor={colors.background} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="90%" cy="8%" r="220" fill="url(#loginGlow1)" />
        <Circle cx="8%" cy="92%" r="200" fill="url(#loginGlow2)" />
      </Svg>
    </View>
  );
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);

  const [showFaceScan, setShowFaceScan] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [faceStatus, setFaceStatus] = useState('ALIGN YOUR FACE...');
  const [faceScanning, setFaceScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  const cameraRef = useRef<any>(null);
  const laserAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const captureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (showFaceScan) {
      (async () => {
        const status = await requestPermission();
        if (!status.granted) {
          setFaceStatus('CAMERA ACCESS REQUIRED');
        }
      })();
    }
  }, [showFaceScan]);

  useEffect(() => {
    if (showFaceScan) {
      laserAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 260,
            duration: 1600,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 1600,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
        ])
      ).start();

      pulseAnim.setValue(1);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.96,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
        ])
      ).start();

      rotationAnim.setValue(0);
      Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 15000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      setFaceStatus('ALIGN YOUR FACE...');
      setFaceScanning(false);
      setScanSuccess(false);

      if (permission?.granted) {
        if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current);
        captureTimeoutRef.current = setTimeout(() => {
          handleAutoCapture();
        }, 2500);
      }
    } else {
      if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current);
      laserAnim.setValue(0);
      pulseAnim.setValue(1);
      rotationAnim.setValue(0);
    }

    return () => {
      if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current);
    };
  }, [showFaceScan, permission?.granted]);

  const handleAutoCapture = async () => {
    if (!cameraRef.current) return;
    setFaceScanning(true);
    setFaceStatus('CAPTURING BIOMETRICS...');

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (!photo || !photo.uri) {
        throw new Error('Failed to capture frame from front camera.');
      }

      setFaceStatus('ANALYZING BIOMETRICS...');

      const formData = new FormData();
      formData.append('file', {
        uri: photo.uri,
        name: 'scan.jpg',
        type: 'image/jpeg',
      } as any);

      const pythonUrl = (process.env.EXPO_PUBLIC_PYTHON_API_URL || 'http://192.168.29.167:8000') + '/extract-face';
      const extractResponse = await fetch(pythonUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!extractResponse.ok) {
        throw new Error('Face recognition engine is busy or offline.');
      }

      const extractData = await extractResponse.json();
      if (!extractData.success || !extractData.embedding) {
        throw new Error(extractData.error || 'No face detected in scanner alignment box. Please center your face.');
      }

      setFaceStatus('MATCHING BIOMETRIC HASH...');

      const matchSuccess = await verifyFace(sessionData.accessToken, extractData.embedding);

      if (matchSuccess) {
        setFaceStatus('IDENTITY VERIFIED!');
        setScanSuccess(true);

        setTimeout(() => {
          setShowFaceScan(false);
          navigation.replace('Home', {
            accessToken: sessionData.accessToken,
            user: sessionData.user,
            organization: sessionData.organization,
            role: sessionData.role,
            permissions: sessionData.permissions,
            displayName: sessionData.displayName,
            employeeId: sessionData.employeeId,
          });
        }, 1500);
      } else {
        setFaceStatus('FACE MISMATCH!');
        setTimeout(() => {
          setShowFaceScan(false);
        }, 1500);
      }
    } catch {
      setFaceStatus('FACE MISMATCH!');
      setTimeout(() => {
        setShowFaceScan(false);
      }, 1500);
    }
  };

  const handleSimulatorBypass = () => {
    setFaceStatus('SIMULATOR BYPASS ACTIVE');
    setScanSuccess(true);
    setTimeout(() => {
      setShowFaceScan(false);
      navigation.replace('Home', {
        accessToken: sessionData.accessToken,
        user: sessionData.user,
        organization: sessionData.organization,
        role: sessionData.role,
        permissions: sessionData.permissions,
        displayName: sessionData.displayName,
        employeeId: sessionData.employeeId,
      });
    }, 1000);
  };

  const handlePressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true, speed: 20, bounciness: 0 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, friction: 4, tension: 140 }).start();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const loginData = await loginUser(normalizedEmail, password);

      if (loginData.accessToken) {
        const session = await getUserSession(loginData.accessToken);

        if (session.faceRegistered) {
          setSessionData({
            accessToken: loginData.accessToken,
            user: session.user,
            organization: session.organization,
            role: session.role,
            permissions: session.permissions,
            displayName: session.displayName,
            employeeId: session.employeeId,
          });
          setShowFaceScan(true);
        } else {
          navigation.replace('Home', {
            accessToken: loginData.accessToken,
            user: session.user,
            organization: session.organization,
            role: session.role,
            permissions: session.permissions,
            displayName: session.displayName,
            employeeId: session.employeeId,
          });
        }
      } else if (loginData.requiresPasswordChange) {
        setError('Password change required. Please log in via web first.');
      } else {
        setError('Unexpected server response format.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (showFaceScan) {
    if (!permission) {
      return (
        <SafeAreaView style={styles.scannerWrapper}>
          <View style={styles.scannerDarkBackdrop} />
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>Biometric Terminal</Text>
            <Text style={styles.scannerSubtitle}>Initializing secure face scanner...</Text>
          </View>
          <ActivityIndicator color="#7C3AED" size="large" style={{ marginTop: 100 }} />
        </SafeAreaView>
      );
    }

    if (!permission.granted) {
      return (
        <SafeAreaView style={styles.scannerWrapper}>
          <View style={styles.scannerDarkBackdrop} />
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>Biometric Security</Text>
            <Text style={styles.scannerSubtitle}>Camera access is required to authenticate your identity via Face Scanner.</Text>
          </View>
          <View style={styles.permissionCard}>
            <Svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5">
              <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <Circle cx="12" cy="13" r="4" />
            </Svg>
            <Text style={styles.permissionCardTitle}>Grant Camera Permission</Text>
            <Text style={styles.permissionCardDesc}>
              We use the front camera to scan your face and match it securely with the encrypted biometric template in our database.
            </Text>
            <Pressable onPress={requestPermission} style={styles.permissionButton}>
              <Text style={styles.permissionButtonText}>Enable Camera</Text>
            </Pressable>
            <Pressable onPress={handleSimulatorBypass} style={[styles.permissionButton, { backgroundColor: '#10B981', marginTop: 12 }]}>
              <Text style={styles.permissionButtonText}>Bypass Camera (Simulator)</Text>
            </Pressable>
            <Pressable onPress={() => setShowFaceScan(false)} style={styles.permissionCancelButton}>
              <Text style={styles.permissionCancelButtonText}>Cancel & Go Back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      );
    }

    const rotateInterp = rotationAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={styles.scannerOverlayContainer}>
        <View style={styles.scannerDarkBackdrop} />

        <SafeAreaView style={styles.scannerWrapper}>
          <View style={styles.scannerHeader}>
            <View style={styles.scannerOrgBadge}>
              <Text style={styles.scannerOrgText}>{sessionData?.organization?.name || 'WORKFORCEOS'}</Text>
            </View>
            <Text style={styles.scannerTitle}>Face Verification</Text>
            <Text style={styles.scannerSubtitle}>Secured Biometric Terminal Access</Text>
          </View>

          <View style={styles.cameraBoxContainer}>
            <Animated.View
              style={[
                styles.hudCircleContainer,
                {
                  transform: [{ scale: pulseAnim }, { rotate: rotateInterp }],
                },
              ]}
              pointerEvents="none"
            >
              <Svg width="330" height="330" viewBox="0 0 330 330">
                <Circle cx="165" cy="165" r="145" stroke="#7C3AED" strokeWidth="1.5" strokeDasharray="8, 6" fill="none" opacity="0.35" />
                <Circle cx="165" cy="165" r="130" stroke="#22D3EE" strokeWidth="1" strokeDasharray="3, 4" fill="none" opacity="0.45" />
                <Circle cx="165" cy="165" r="115" stroke="#7C3AED" strokeWidth="2" strokeDasharray="40, 60" fill="none" opacity="0.5" />
                <Line x1="165" y1="5" x2="165" y2="15" stroke="#22D3EE" strokeWidth="2" opacity="0.8" />
                <Line x1="165" y1="315" x2="165" y2="325" stroke="#22D3EE" strokeWidth="2" opacity="0.8" />
                <Line x1="5" y1="165" x2="15" y2="165" stroke="#22D3EE" strokeWidth="2" opacity="0.8" />
                <Line x1="315" y1="165" x2="325" y2="165" stroke="#22D3EE" strokeWidth="2" opacity="0.8" />
              </Svg>
            </Animated.View>

            <View style={[styles.cameraBoxOutline, scanSuccess && styles.cameraBoxOutlineSuccess]}>
              <CameraView style={styles.cameraFrame} facing="front" ref={cameraRef} />

              {!scanSuccess && (
                <Animated.View
                  style={[
                    styles.laserBeam,
                    {
                      transform: [{ translateY: laserAnim }],
                    },
                  ]}
                />
              )}

              {scanSuccess && (
                <View style={styles.successFlashOverlay}>
                  <Svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3">
                    <Polyline points="20 6 9 17 4 12" />
                  </Svg>
                </View>
              )}

              <View style={[styles.reticle, styles.reticleTopLeft]} />
              <View style={[styles.reticle, styles.reticleTopRight]} />
              <View style={[styles.reticle, styles.reticleBottomLeft]} />
              <View style={[styles.reticle, styles.reticleBottomRight]} />
            </View>
          </View>

          <View style={styles.scannerStatusCard}>
            <View style={styles.statusIndicatorWrapper}>
              {faceScanning ? (
                <ActivityIndicator size="small" color="#7C3AED" />
              ) : scanSuccess ? (
                <View style={styles.successDot} />
              ) : (
                <View style={styles.idleDot} />
              )}
              <Text style={[styles.statusCardTitle, scanSuccess && styles.statusCardTitleSuccess]}>{faceStatus}</Text>
            </View>

            <Text style={styles.statusCardDesc}>
              {scanSuccess
                ? 'Identity matched. Setting up your secure attendance workspace...'
                : faceScanning
                  ? 'Keep still while we compare facial structures with database records...'
                  : 'Position your face fully within the guide circle to authorize transaction.'}
            </Text>

            <View style={styles.scannerActions}>
              {!faceScanning && !scanSuccess && (
                <Pressable
                  onPress={() => {
                    setFaceStatus('ALIGN YOUR FACE...');
                    setFaceScanning(false);
                    if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current);
                    captureTimeoutRef.current = setTimeout(() => handleAutoCapture(), 2000);
                  }}
                  style={styles.scannerRetryButton}
                >
                  <Text style={styles.scannerRetryText}>Retry Scan</Text>
                </Pressable>
              )}
              {!scanSuccess && (
                <Pressable
                  onPress={handleSimulatorBypass}
                  style={[styles.scannerRetryButton, { backgroundColor: '#10B981', marginTop: 12 }]}
                >
                  <Text style={styles.scannerRetryText}>Bypass (Simulator)</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => {
                  setShowFaceScan(false);
                  if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current);
                }}
                disabled={scanSuccess}
                style={[styles.scannerCancelButton, scanSuccess && { opacity: 0.5 }]}
              >
                <Text style={styles.scannerCancelText}>Cancel Sign In</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <PremiumBackground />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <View style={styles.topBar}>
              <Pressable
                onPress={() => navigation.replace('Splash')}
                style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
                hitSlop={12}
              >
                <BackIcon />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[
                styles.scrollContent,
                { minHeight: windowHeight - insets.top - insets.bottom - 72 },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              bounces={false}
            >
              <View style={styles.content}>
                <View style={styles.headerBlock}>
                  <Text style={styles.title}>Welcome Back</Text>
                  <Text style={styles.subtitle}>
                    Stay connected by signing in with your email and password to access your account.
                  </Text>
                </View>

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

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Password</Text>
                    <View style={styles.passwordRow}>
                      <TextInput
                        style={[styles.input, styles.passwordInput, isFocusedPassword && styles.inputFocused]}
                        placeholder="Enter your password"
                        placeholderTextColor={colors.placeholder}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoComplete="password"
                        textContentType="password"
                        onFocus={() => setIsFocusedPassword(true)}
                        onBlur={() => setIsFocusedPassword(false)}
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

                  <View style={styles.optionsRow}>
                    <View style={styles.rememberRow}>
                      <Switch
                        value={rememberMe}
                        onValueChange={setRememberMe}
                        trackColor={{ false: colors.border, true: colors.accent }}
                        thumbColor={colors.surface}
                        ios_backgroundColor={colors.border}
                      />
                      <Text style={styles.rememberText}>Remember me</Text>
                    </View>
                    <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8}>
                      <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </Pressable>
                  </View>

                  {error ? (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  <Pressable
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handleLogin}
                    disabled={loading}
                    style={styles.loginButtonPressable}
                  >
                    <Animated.View style={[styles.loginButton, { transform: [{ scale: buttonScale }] }]}>
                      <LinearGradient
                        colors={[colors.gradientStart, colors.gradientEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.loginButtonGradient}
                      >
                        {loading ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Text style={styles.loginButtonText}>Sign In</Text>
                        )}
                      </LinearGradient>
                    </Animated.View>
                  </Pressable>
                </View>
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
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
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
    width: '100%',
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
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  rememberRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  rememberText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  forgotPasswordText: {
    ...typography.button,
    fontSize: 13,
    color: colors.primary,
    flexShrink: 0,
  },
  loginButtonPressable: {
    width: '100%',
    marginTop: 8,
  },
  loginButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  loginButtonGradient: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    ...typography.button,
    fontSize: 16,
    color: '#FFFFFF',
  },
  errorContainer: {
    backgroundColor: colors.errorBg,
    borderColor: colors.errorBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  errorText: {
    fontFamily: fonts.semiBold,
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },

  scannerOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  scannerDarkBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#070612F2',
  },
  scannerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 32,
    zIndex: 1001,
  },
  scannerOrgBadge: {
    backgroundColor: '#1E1A3A',
    borderColor: '#7C3AED80',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    alignSelf: 'center',
    marginBottom: 12,
  },
  scannerOrgText: {
    fontFamily: fonts.bold,
    color: '#22D3EE',
    fontSize: 10,
    letterSpacing: 1.5,
  },
  scannerHeader: {
    width: '85%',
    alignItems: 'center',
    marginTop: 20,
  },
  scannerTitle: {
    ...typography.screenTitle,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scannerSubtitle: {
    ...typography.secondary,
    color: '#8C8AA2',
    marginTop: 6,
    textAlign: 'center',
  },
  cameraBoxContainer: {
    position: 'relative',
    width: 330,
    height: 330,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudCircleContainer: {
    position: 'absolute',
    width: 330,
    height: 330,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cameraBoxOutline: {
    width: 270,
    height: 270,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#7C3AED80',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F0E24',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 5,
  },
  cameraBoxOutlineSuccess: {
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOpacity: 0.7,
  },
  cameraFrame: {
    width: '100%',
    height: '100%',
  },
  laserBeam: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#22D3EE',
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 3,
  },
  successFlashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#10B981D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticle: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#22D3EE',
    zIndex: 12,
  },
  reticleTopLeft: {
    top: 12,
    left: 12,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 10,
  },
  reticleTopRight: {
    top: 12,
    right: 12,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 10,
  },
  reticleBottomLeft: {
    bottom: 12,
    left: 12,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 10,
  },
  reticleBottomRight: {
    bottom: 12,
    right: 12,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 10,
  },
  scannerStatusCard: {
    width: '85%',
    backgroundColor: '#13112EBF',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 22,
    borderWidth: 1.5,
    borderColor: '#2D2852BF',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
  },
  statusIndicatorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  idleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  successDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusCardTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#E4E2F0',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statusCardTitleSuccess: {
    color: '#10B981',
  },
  statusCardDesc: {
    ...typography.caption,
    fontSize: 11.5,
    color: '#8C8AA2',
    textAlign: 'center',
    lineHeight: 16,
  },
  scannerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    width: '100%',
  },
  scannerRetryButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  scannerRetryText: {
    fontFamily: fonts.bold,
    color: '#FFFFFF',
    fontSize: 13,
  },
  scannerCancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#37316A',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerCancelText: {
    fontFamily: fonts.bold,
    color: '#A09EC2',
    fontSize: 13,
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginTop: 40,
  },
  permissionCardTitle: {
    ...typography.sectionHeader,
    color: '#0F0F1A',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionCardDesc: {
    ...typography.secondary,
    color: '#6B6B80',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  permissionButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    height: 48,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  permissionButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  permissionCancelButton: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    height: 48,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionCancelButtonText: {
    ...typography.button,
    fontSize: 14,
    color: '#6B6B80',
  },
});
