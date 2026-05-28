import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { loginUser, getUserSession, verifyFace } from '../apis/loginApi';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Path,
  Rect,
  Circle,
  Line,
  Polyline,
  G,
  Text as SvgText,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';

interface LoginScreenProps {
  navigation: any;
}

// ─── Premium Ambient Background ──────────────────────────────────────────────

function PremiumBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <RadialGradient id="glow1" cx="15%" cy="15%" rx="65%" ry="65%" fx="15%" fy="15%">
            <Stop offset="0%" stopColor="#EEF2FF" stopOpacity="0.8" />
            <Stop offset="50%" stopColor="#E0E7FF" stopOpacity="0.45" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="glow2" cx="85%" cy="80%" rx="70%" ry="70%" fx="85%" fy="80%">
            <Stop offset="0%" stopColor="#F5F3FF" stopOpacity="0.85" />
            <Stop offset="50%" stopColor="#EDE9FE" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FAF9FF" />
            <Stop offset="50%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#F8FAFC" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#bgGrad)" />
        <Circle cx="15%" cy="15%" r="280" fill="url(#glow1)" />
        <Circle cx="85%" cy="80%" r="300" fill="url(#glow2)" />
      </Svg>
    </View>
  );
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
  floatDown?: boolean;
  pan?: Animated.ValueXY;
}

// ─── Draggable Floating Label ────────────────────────────────────────────────

function DraggableBubble({ bubble, onRemove }: { bubble: Bubble; onRemove: (id: number) => void }) {
  const pan = useRef(bubble.pan || new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Stop the auto-fade so user can play with it
        bubble.opacity.stopAnimation();
        bubble.opacity.setValue(1);
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        // Fade out and remove after releasing
        Animated.timing(bubble.opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }).start(() => onRemove(bubble.id));
      },
    })
  ).current;

  const translateY = bubble.anim.interpolate({ inputRange: [0, 1], outputRange: [0, 70] });
  const scale = bubble.anim.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0.5, 1.05, 1] });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.bubble,
        styles.bubbleDraggable,
        {
          left: bubble.x,
          opacity: bubble.opacity,
          transform: [
            { translateY },
            { scale },
            { translateX: pan.x },
            { translateY: pan.y },
          ],
        },
      ]}
    >
      <Text style={styles.bubbleText}>{bubble.label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={styles.bubbleDragHint}>Drag Me </Text>
        <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><Path d="M14 4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><Path d="M10 4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><Path d="M6 10V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v7.69A5.05 5.05 0 0 0 3.36 17c.5.54 1.13 1 1.83 1.29l3.52 1.46A4.97 4.97 0 0 0 10.59 20h3.69a6.03 6.03 0 0 0 5.72-6.19V11a2 2 0 0 0-2-2z"/>
        </Svg>
      </View>
    </Animated.View>
  );
}

// ─── Time-based Greeting ─────────────────────────────────────────────────────

function getGreeting(): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Good morning', icon: <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Circle cx="12" cy="12" r="5"/><Line x1="12" y1="1" x2="12" y2="3"/><Line x1="12" y1="21" x2="12" y2="23"/><Line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><Line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><Line x1="1" y1="12" x2="3" y2="12"/><Line x1="21" y1="12" x2="23" y2="12"/><Line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><Line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></Svg> };
  if (hour >= 12 && hour < 17) return { text: 'Good afternoon', icon: <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 2v2"/><Path d="M4.93 4.93l1.41 1.41"/><Path d="M20 12h2"/><Path d="M19.07 4.93l-1.41 1.41"/><Path d="M15.94 13A4 4 0 0 0 8.35 11 5 5 0 0 0 8 21h8a4 4 0 0 0 .04-7.96z"/></Svg> };
  if (hour >= 17 && hour < 21) return { text: 'Good evening', icon: <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 2v2"/><Path d="M4.93 4.93l1.41 1.41"/><Path d="M19.07 4.93l-1.41 1.41"/><Path d="M2 18h20"/><Path d="M16 18a4 4 0 0 0-8 0"/></Svg> };
  return { text: 'Good night', icon: <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></Svg> };
}

function AnimatedClock() {
  const secDeg = useRef(new Animated.Value(0)).current;
  const minDeg = useRef(new Animated.Value(0)).current;
  const hourDeg = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
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

  const removeBubble = (id: number) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
  };

  const handleTap = () => {
    // Bounce scale
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.88, duration: 80, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
    ]).start();

    // Pick label
    const label = FUN_LABELS[Math.floor(Math.random() * FUN_LABELS.length)];
    const xPos = 10 + Math.random() * (CLOCK_SIZE - 20);
    const anim = new Animated.Value(0);
    const opacity = new Animated.Value(1);
    const id = bubbleId.current++;

    // Every 3rd tap spawns a draggable bubble that floats DOWN
    const shouldFloatDown = id % 3 === 0;

    if (shouldFloatDown) {
      const pan = new Animated.ValueXY();
      setBubbles(prev => [...prev, { id, label, x: xPos, anim, opacity, floatDown: true, pan }]);

      // Float down animation (no auto-remove — user drags to dismiss)
      Animated.timing(anim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
        easing: Easing.out(Easing.cubic),
      }).start(() => {
        // Auto-fade after 4 seconds if user doesn't interact
        Animated.sequence([
          Animated.delay(4000),
          Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: false }),
        ]).start(() => removeBubble(id));
      });
    } else {
      // Normal bubble floats UP
      setBubbles(prev => [...prev, { id, label, x: xPos, anim, opacity }]);

      Animated.parallel([
        Animated.timing(anim, { toValue: 1, duration: 1000, useNativeDriver: false, easing: Easing.out(Easing.cubic) }),
        Animated.sequence([
          Animated.delay(500),
          Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: false }),
        ]),
      ]).start(() => removeBubble(id));
    }
  };

  const secInterp = secDeg.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });
  const minInterp = minDeg.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });
  const hourInterp = hourDeg.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });

  return (
    <Pressable onPress={handleTap} style={styles.clockContainer}>
      {/* Clock face */}
      <Animated.View style={[styles.clockFace, { transform: [{ scale: scaleAnim }] }]}>
        <Svg width="96" height="96" viewBox="0 0 96 96">
          {/* Outer ring */}
          <Circle cx="48" cy="48" r="44" fill="#FFFFFF" stroke="#7C3AED" strokeWidth="2" />
          {/* Hour markers */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
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
                stroke={i % 3 === 0 ? '#7C3AED' : '#D1D5DB'}
                strokeWidth={i % 3 === 0 ? 2 : 1}
                strokeLinecap="round"
              />
            );
          })}
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
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
        <Text style={[styles.clockTapHint, { marginTop: 0, marginRight: 4 }]}>Tap Me</Text>
        <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><Path d="M14 4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><Path d="M10 4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><Path d="M6 10V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v7.69A5.05 5.05 0 0 0 3.36 17c.5.54 1.13 1 1.83 1.29l3.52 1.46A4.97 4.97 0 0 0 10.59 20h3.69a6.03 6.03 0 0 0 5.72-6.19V11a2 2 0 0 0-2-2z"/>
        </Svg>
      </View>

      {/* Bubbles */}
      {bubbles.map(b => {
        // Draggable bubble that floats down
        if (b.floatDown) {
          return <DraggableBubble key={b.id} bubble={b} onRemove={removeBubble} />;
        }

        // Normal bubble floats up
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

// ─── Greeting Text Component ──────────────────────────────────────────────────

function GreetingText() {
  const greeting = useMemo(() => getGreeting(), []);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      <Text style={[styles.title, { marginBottom: 0, marginRight: 8 }]}>{greeting.text}</Text>
      {greeting.icon}
    </View>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // ─── Face Scanner Integration States & Refs ─────────────────────────────────
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

  // Staggered Mount Animations
  const clockAnim = useRef(new Animated.Value(0)).current;
  const greetingAnim = useRef(new Animated.Value(0)).current;
  const inputsAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  // Active Spring Focus Animations for inputs
  const focusEmailAnim = useRef(new Animated.Value(0)).current;
  const focusPasswordAnim = useRef(new Animated.Value(0)).current;

  // Tactile Button Scale Spring
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.timing(clockAnim, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.back(1.2)) }),
      Animated.timing(greetingAnim, { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      Animated.timing(inputsAnim, { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      Animated.timing(buttonAnim, { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
    ]).start();
  }, []);

  // Proactively request camera permissions when the scanner HUD mounts
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

  // ─── Holographic Face Scanner Loops & Captures ───────────────────────────────
  useEffect(() => {
    if (showFaceScan) {
      // 1. Loop holographic sweeping laser beam
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

      // 2. Loop pulse animation for HUD guidelines
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

      // 3. Loop rotation animation for concentric vector circles
      rotationAnim.setValue(0);
      Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 15000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // 4. Reset scanning state & set 2.5s timer for high-speed auto-capture
      setFaceStatus('ALIGN YOUR FACE...');
      setFaceScanning(false);
      setScanSuccess(false);

      if (permission?.granted) {
        if (captureTimeoutRef.current) {
          clearTimeout(captureTimeoutRef.current);
        }
        captureTimeoutRef.current = setTimeout(() => {
          handleAutoCapture();
        }, 2500);
      }
    } else {
      if (captureTimeoutRef.current) {
        clearTimeout(captureTimeoutRef.current);
      }
      laserAnim.setValue(0);
      pulseAnim.setValue(1);
      rotationAnim.setValue(0);
    }

    return () => {
      if (captureTimeoutRef.current) {
        clearTimeout(captureTimeoutRef.current);
      }
    };
  }, [showFaceScan, permission?.granted]);

  const handleAutoCapture = async () => {
    if (!cameraRef.current) return;
    setFaceScanning(true);
    setFaceStatus('CAPTURING BIOMETRICS...');

    try {
      // 1. Take high-fidelity snapshot
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (!photo || !photo.uri) {
        throw new Error('Failed to capture frame from front camera.');
      }

      setFaceStatus('ANALYZING BIOMETRICS...');

      // 2. Extract 128D face embedding via Python server
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

      // 3. Match similarity with DB records
      const matchSuccess = await verifyFace(sessionData.accessToken, extractData.embedding);

      if (matchSuccess) {
        setFaceStatus('IDENTITY VERIFIED!');
        setScanSuccess(true);

        // Success transition delay
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
        // Face mismatch occurred
        setFaceStatus('FACE MISMATCH!');
        setTimeout(() => {
          setShowFaceScan(false);
        }, 1500);
      }
    } catch (err: any) {
      // General error (like connection issues or no face detected)
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

  const handleFocusEmail = () => {
    setIsFocusedEmail(true);
    Animated.spring(focusEmailAnim, { toValue: 1, friction: 8, tension: 120, useNativeDriver: true }).start();
  };

  const handleBlurEmail = () => {
    setIsFocusedEmail(false);
    Animated.spring(focusEmailAnim, { toValue: 0, friction: 8, tension: 120, useNativeDriver: true }).start();
  };

  const handleFocusPassword = () => {
    setIsFocusedPassword(true);
    Animated.spring(focusPasswordAnim, { toValue: 1, friction: 8, tension: 120, useNativeDriver: true }).start();
  };

  const handleBlurPassword = () => {
    setIsFocusedPassword(false);
    Animated.spring(focusPasswordAnim, { toValue: 0, friction: 8, tension: 120, useNativeDriver: true }).start();
  };

  const handlePressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.95, useNativeDriver: true, speed: 20, bounciness: 0 }).start();
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
      // 1. Authenticate user
      const loginData = await loginUser(normalizedEmail, password);

      if (loginData.accessToken) {
        // 2. Fetch session details including roles & face status
        const session = await getUserSession(loginData.accessToken);

        // 3. Conditional routing: open Face Scanner if already registered in DB
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
          // Skip scanner if no face exists
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

  // Interpolations for stagger entrance
  const clockOpacity = clockAnim;
  const clockTranslateY = clockAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });

  const greetingOpacity = greetingAnim;
  const greetingTranslateY = greetingAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  const inputsOpacity = inputsAnim;
  const inputsTranslateY = inputsAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  const buttonOpacity = buttonAnim;
  const buttonTranslateY = buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  // Interpolations for input focus
  const emailIconScale = focusEmailAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const passwordIconScale = focusPasswordAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  if (showFaceScan) {
    if (!permission) {
      return (
        <SafeAreaView style={styles.scannerWrapper}>
          <PremiumBackground />
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
          <PremiumBackground />
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
            <Text style={styles.permissionCardDesc}>We use the front camera to scan your face and match it securely with the encrypted biometric template in our database.</Text>
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
          {/* Header Panel */}
          <View style={styles.scannerHeader}>
            <View style={styles.scannerOrgBadge}>
              <Text style={styles.scannerOrgText}>{sessionData?.organization?.name || 'WORKFORCEOS'}</Text>
            </View>
            <Text style={styles.scannerTitle}>Face Verification</Text>
            <Text style={styles.scannerSubtitle}>Secured Biometric Terminal Access</Text>
          </View>

          {/* Central Camera Box */}
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

          {/* Status Display Card & Control Console */}
          <View style={styles.scannerStatusCard}>
            <View style={styles.statusIndicatorWrapper}>
              {faceScanning ? (
                <ActivityIndicator size="small" color="#7C3AED" />
              ) : scanSuccess ? (
                <View style={styles.successDot} />
              ) : (
                <View style={styles.idleDot} />
              )}
              <Text style={[styles.statusCardTitle, scanSuccess && styles.statusCardTitleSuccess]}>
                {faceStatus}
              </Text>
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
                {/* Center Section containing Header & Inputs */}
                <View style={styles.centerSection}>
                  {/* Centered Clock */}
                  <Animated.View
                    style={[
                      styles.clockWrapper,
                      {
                        opacity: clockOpacity,
                        transform: [{ translateY: clockTranslateY }]
                      }
                    ]}
                    needsOffscreenAlphaCompositing={true}
                  >
                    <AnimatedClock />
                  </Animated.View>

                  {/* Greeting Header above the email field */}
                  <Animated.View style={[
                    styles.headerTextContainer,
                    {
                      opacity: greetingOpacity,
                      transform: [{ translateY: greetingTranslateY }]
                    }
                  ]}>
                    <GreetingText />
                    <Text style={styles.subtitle}>Let's track today's attendance</Text>
                  </Animated.View>

                  {/* Inputs */}
                  <Animated.View style={[
                    styles.inputsContainer,
                    {
                      opacity: inputsOpacity,
                      transform: [{ translateY: inputsTranslateY }]
                    }
                  ]}>
                    <View style={styles.inputWrapper}>
                      <Animated.View
                        style={[
                          styles.inputWrapperFocusedBorder,
                          { opacity: focusEmailAnim }
                        ]}
                        pointerEvents="none"
                      />
                      <Animated.View style={[styles.inputIcon, { transform: [{ scale: emailIconScale }] }]}>
                        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <Circle cx="12" cy="7" r="4" />
                        </Svg>
                      </Animated.View>
                      <TextInput
                        style={styles.input}
                        placeholder="Your name or email"
                        placeholderTextColor="#CACAD6"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        autoComplete="username"
                        onFocus={handleFocusEmail}
                        onBlur={handleBlurEmail}
                      />
                    </View>

                    <View style={styles.inputWrapper}>
                      <Animated.View
                        style={[
                          styles.inputWrapperFocusedBorder,
                          { opacity: focusPasswordAnim }
                        ]}
                        pointerEvents="none"
                      />
                      <Animated.View style={[styles.inputIcon, { transform: [{ scale: passwordIconScale }] }]}>
                        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </Svg>
                      </Animated.View>
                      <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#CACAD6"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoComplete="current-password"
                        onFocus={handleFocusPassword}
                        onBlur={handleBlurPassword}
                      />
                      <Pressable
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIconContainer}
                      >
                        {showPassword ? (
                          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.5 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <Line x1="1" y1="1" x2="23" y2="23" />
                          </Svg>
                        ) : (
                          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <Circle cx="12" cy="12" r="3" />
                          </Svg>
                        )}
                      </Pressable>
                    </View>
                  </Animated.View>
                </View>

                {/* Bottom Section containing Sign in & Forgot Password */}
                <Animated.View
                  style={[
                    styles.bottomSection,
                    {
                      opacity: buttonOpacity,
                      transform: [{ translateY: buttonTranslateY }]
                    }
                  ]}
                  needsOffscreenAlphaCompositing={true}
                >
                  {error && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  <Pressable
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handleLogin}
                    disabled={loading}
                    style={{ width: '100%' }}
                  >
                    <Animated.View style={[styles.loginButton, { transform: [{ scale: buttonScale }] }]}>
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.loginButtonText}>Sign in</Text>
                      )}
                    </Animated.View>
                  </Pressable>

                  <View style={styles.forgotPasswordContainer}>
                    <Pressable style={({ pressed }) => pressed && { opacity: 0.7 }}>
                      <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                    </Pressable>
                  </View>
                </Animated.View>
              </ScrollView>
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
    backgroundColor: '#FAF9FF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF9FF',
    paddingTop: 20,
  },
  card: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 24,
    flexGrow: 1,
    justifyContent: 'space-between',
  },

  // ── Clock ──
  clockContainer: {
    width: CLOCK_SIZE + 60,
    height: CLOCK_SIZE + 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    overflow: 'visible',
  },
  clockFace: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    borderRadius: CLOCK_SIZE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
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
    backgroundColor: '#1A1240',
    marginBottom: 0,
  },
  minHand: {
    width: 2.5,
    height: 32,
    backgroundColor: '#7C3AED',
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
    borderColor: '#FFFFFF',
  },
  clockTapHint: {
    marginTop: 8,
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  bubble: {
    position: 'absolute',
    top: -12,
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
  bubbleDraggable: {
    top: CLOCK_SIZE + 14,
    backgroundColor: '#F5F3FF',
    borderColor: '#7C3AED',
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 100,
  },
  bubbleDragHint: {
    fontSize: 9,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 2,
  },

  // ── Form ──
  clockWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    overflow: 'visible',
    zIndex: 10,
  },
  headerTextContainer: {
    marginBottom: 20,
  },
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
    marginBottom: 0,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  bottomSection: {
    width: '100%',
    marginTop: 20,
  },
  inputsContainer: {
    gap: 16,
    marginTop: 8,
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
    position: 'relative',
  },
  inputWrapperFocusedBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#7C3AED',
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
  eyeIconContainer: {
    width: 44,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    width: '100%',
    alignItems: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },

  // ── Scanner Styles ──
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
    color: '#22D3EE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  scannerHeader: {
    width: '85%',
    alignItems: 'center',
    marginTop: 20,
  },
  scannerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  scannerSubtitle: {
    fontSize: 13,
    color: '#8C8AA2',
    fontWeight: '500',
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
    fontSize: 14,
    fontWeight: '800',
    color: '#E4E2F0',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statusCardTitleSuccess: {
    color: '#10B981',
  },
  statusCardDesc: {
    fontSize: 11.5,
    color: '#8C8AA2',
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
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
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
    color: '#A09EC2',
    fontSize: 13,
    fontWeight: '700',
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
    fontSize: 18,
    fontWeight: '800',
    color: '#0F0F1A',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionCardDesc: {
    fontSize: 13,
    color: '#6B6B80',
    textAlign: 'center',
    lineHeight: 18,
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
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
    color: '#6B6B80',
    fontSize: 14,
    fontWeight: '600',
  },
});