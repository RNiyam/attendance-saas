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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Path,
  Rect,
  Circle,
  Line,
  Polyline,
  G,
  Text as SvgText,
} from 'react-native-svg';

interface LoginScreenProps {
  navigation: any;
}

// ─── Animated Clock ──────────────────────────────────────────────────────────

const FUN_LABELS = [
  'On time!',
  'Early bird!',
  'Morning!',
  'Rise & shine!',
  "Let's go!",
  "You're here!",
  'Clock in!',
  'Present!',
  'Ready to rock!',
  'Let\'s do this!',
  'Time to shine!',
  'Welcome back!',
  'Looking good!',
  'Let\'s get it!',
];

interface Bubble {
  id: number;
  label: string;
  x: number;
  anim: Animated.Value;
  opacity: Animated.Value;
}

function AnimatedClock() {
  const secDeg = useRef(new Animated.Value(0)).current;
  const minDeg = useRef(new Animated.Value(0)).current;
  const hourDeg = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const bubbleId = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick every second
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const s = now.getSeconds();
      const m = now.getMinutes();
      const h = now.getHours() % 12;
      secDeg.setValue(s * 6);
      minDeg.setValue(m * 6 + s * 0.1);
      hourDeg.setValue(h * 30 + m * 0.5);
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // Idle glow pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    ).start();
  }, []);

  const handleTap = () => {
    // Bounce scale
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.88, duration: 80, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
    ]).start();

    // Spawn bubble
    const label = FUN_LABELS[Math.floor(Math.random() * FUN_LABELS.length)];
    const xPos = 20 + Math.random() * 60;
    const anim = new Animated.Value(0);
    const opacity = new Animated.Value(1);
    const id = bubbleId.current++;
    setBubbles(prev => [...prev, { id, label, x: xPos, anim, opacity }]);

    Animated.parallel([
      Animated.timing(anim, { toValue: 1, duration: 1000, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start(() => {
      setBubbles(prev => prev.filter(b => b.id !== id));
    });
  };

  const secInterp = secDeg.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });
  const minInterp = minDeg.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });
  const hourInterp = hourDeg.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });
  const glowScale = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.08] });

  return (
    <Pressable onPress={handleTap} style={styles.clockContainer}>
      {/* Glow ring behind clock */}
      <Animated.View
        style={[
          styles.clockGlow,
          { opacity: glowOpacity, transform: [{ scale: glowScale }] },
        ]}
      />

      {/* Clock face */}
      <Animated.View style={[styles.clockFace, { transform: [{ scale: scaleAnim }] }]}>
        <Svg width="96" height="96" viewBox="0 0 96 96">
          {/* Outer ring */}
          <Circle cx="48" cy="48" r="44" fill="#1A1240" stroke="#3D2B7A" strokeWidth="2" />
          {/* Hour markers */}
          {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
            const r1 = i % 3 === 0 ? 34 : 36;
            const r2 = 40;
            const rad = (deg - 90) * Math.PI / 180;
            return (
              <Line
                key={deg}
                x1={48 + r1 * Math.cos(rad)}
                y1={48 + r1 * Math.sin(rad)}
                x2={48 + r2 * Math.cos(rad)}
                y2={48 + r2 * Math.sin(rad)}
                stroke={i % 3 === 0 ? '#9B7FFF' : '#3D2B7A'}
                strokeWidth={i % 3 === 0 ? 2 : 1}
                strokeLinecap="round"
              />
            );
          })}
          {/* Hour hand */}
          <G rotation={0} origin="48, 48">
            <Animated.View style={{ position: 'absolute', transform: [{ rotate: hourInterp }] }}>
              <Svg width="96" height="96" viewBox="0 0 96 96" style={{ position: 'absolute' }}>
                <Line x1="48" y1="48" x2="48" y2="24" stroke="#E0D5FF" strokeWidth="3.5" strokeLinecap="round" />
              </Svg>
            </Animated.View>
          </G>
        </Svg>

        {/* Animated hands rendered as Animated.Views */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Hour hand */}
          <Animated.View
            style={[styles.handBase, { transform: [{ rotate: hourInterp }] }]}
          >
            <View style={[styles.hand, styles.hourHand]} />
          </Animated.View>
          {/* Minute hand */}
          <Animated.View
            style={[styles.handBase, { transform: [{ rotate: minInterp }] }]}
          >
            <View style={[styles.hand, styles.minHand]} />
          </Animated.View>
          {/* Second hand */}
          <Animated.View
            style={[styles.handBase, { transform: [{ rotate: secInterp }] }]}
          >
            <View style={[styles.hand, styles.secHand]} />
          </Animated.View>
          {/* Center dot */}
          <View style={styles.centerDot} />
        </View>
      </Animated.View>

      {/* Tap hint */}
      <Text style={styles.clockTapHint}>tap me</Text>

      {/* Bubbles */}
      {bubbles.map(b => {
        const translateY = b.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -55] });
        const scale = b.anim.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0.5, 1, 0.9] });
        return (
          <Animated.View
            key={b.id}
            pointerEvents="none"
            style={[
              styles.bubble,
              {
                left: b.x,
                opacity: b.opacity,
                transform: [{ translateY }, { scale }],
              },
            ]}
          >
            <Text style={styles.bubbleText}>{b.label}</Text>
          </Animated.View>
        );
      })}
    </Pressable>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <View style={styles.card}>
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {/* ── Animated Clock ── */}
                <AnimatedClock />

                {/* Headers */}
                <Text style={styles.title}>Good morning 👋</Text>
                <Text style={styles.subtitle}>Let's track today's attendance</Text>

                {/* Badges */}
                <View style={styles.badgesContainer}>
                  {['GPS check-in', 'Shift view', 'Leave requests'].map((badge, idx) => (
                    <View key={idx} style={styles.badge}>
                      <Svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#4F7FFF"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <Polyline points="20 6 9 17 4 12" />
                      </Svg>
                      <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                  ))}
                </View>

                {/* Form */}
                <View style={styles.formContainer}>
                  <View style={[styles.inputWrapper, isFocusedEmail && styles.inputWrapperFocused]}>
                    <View style={styles.inputIcon}>
                      <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <Circle cx="12" cy="7" r="4" />
                      </Svg>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Your name or email"
                      placeholderTextColor="#CACAD6"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      autoComplete="username"
                      onFocus={() => setIsFocusedEmail(true)}
                      onBlur={() => setIsFocusedEmail(false)}
                    />
                  </View>

                  <View style={[styles.inputWrapper, isFocusedPassword && styles.inputWrapperFocused]}>
                    <View style={styles.inputIcon}>
                      <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </Svg>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#CACAD6"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoComplete="current-password"
                      onFocus={() => setIsFocusedPassword(true)}
                      onBlur={() => setIsFocusedPassword(false)}
                    />
                  </View>

                  <Pressable
                    style={({ pressed }) => [styles.loginButton, pressed && { opacity: 0.85 }]}
                    onPress={() => navigation.replace('Home')}
                  >
                    <Text style={styles.loginButtonText}>Sign in</Text>
                  </Pressable>

                  <View style={styles.forgotPasswordContainer}>
                    <Pressable style={({ pressed }) => pressed && { opacity: 0.7 }}>
                      <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <Text style={styles.footerText}>New workspace? </Text>
                <Pressable style={({ pressed }) => pressed && { opacity: 0.7 }}>
                  <Text style={styles.footerLink}>Sign up free</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CLOCK_SIZE = 96;
const HAND_OFFSET = CLOCK_SIZE / 2; // 48

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2A1E44',
  },
  container: {
    flex: 1,
    backgroundColor: '#2A1E44',
    paddingTop: 20,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 40,
    flexGrow: 1,
  },

  // ── Clock ──
  clockContainer: {
    width: CLOCK_SIZE + 32,
    height: CLOCK_SIZE + 44,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 24,
    position: 'relative',
  },
  clockGlow: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: CLOCK_SIZE + 44,
    height: CLOCK_SIZE + 44,
    borderRadius: (CLOCK_SIZE + 44) / 2,
    backgroundColor: '#7C3AED',
  },
  clockFace: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    borderRadius: CLOCK_SIZE / 2,
    backgroundColor: '#1A1240',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#3D2B7A',
  },
  handBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hand: {
    position: 'absolute',
    bottom: '50%',
    borderRadius: 4,
  },
  hourHand: {
    width: 4,
    height: 24,
    backgroundColor: '#E0D5FF',
    marginBottom: 0,
  },
  minHand: {
    width: 2.5,
    height: 32,
    backgroundColor: '#9B7FFF',
    marginBottom: 0,
  },
  secHand: {
    width: 1.5,
    height: 36,
    backgroundColor: '#FF6B6B',
    marginBottom: 0,
  },
  centerDot: {
    position: 'absolute',
    top: HAND_OFFSET - 5,
    left: HAND_OFFSET - 5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B6B',
    borderWidth: 1.5,
    borderColor: '#1A1240',
  },
  clockTapHint: {
    marginTop: 8,
    fontSize: 11,
    color: '#9B7FFF',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'lowercase',
  },
  bubble: {
    position: 'absolute',
    top: 16,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C7B8FF',
  },
  bubbleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4C1D95',
  },

  // ── Form ──
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F0F1A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 24,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 32,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 127, 255, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    color: '#4F7FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  formContainer: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8E5F0',
    borderRadius: 14,
    height: 56,
    paddingHorizontal: 6,
  },
  inputWrapperFocused: {
    borderColor: '#7C3AED',
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontWeight: '500',
    color: '#0F0F1A',
  },
  loginButton: {
    backgroundColor: '#4F7FFF',
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#4F7FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  forgotPasswordText: {
    color: '#4F7FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B6B80',
  },
});