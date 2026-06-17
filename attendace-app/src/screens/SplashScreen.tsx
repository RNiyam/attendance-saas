import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import Svg, {
  Circle,
  Line,
  Path,
  Rect,
  Ellipse,
  G,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { fonts, typography } from '../theme';

interface SplashScreenProps {
  navigation: any;
}

// ─── Premium Ambient Background ──────────────────────────────────────────────

function PremiumBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <RadialGradient id="glow1" cx="15%" cy="15%" rx="65%" ry="65%" fx="15%" fy="15%">
            <Stop offset="0%" stopColor="#EEF2FF" stopOpacity="0.85" />
            <Stop offset="50%" stopColor="#E0E7FF" stopOpacity="0.5" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="glow2" cx="85%" cy="80%" rx="70%" ry="70%" fx="85%" fy="80%">
            <Stop offset="0%" stopColor="#F5F3FF" stopOpacity="0.9" />
            <Stop offset="50%" stopColor="#EDE9FE" stopOpacity="0.45" />
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

const { width } = Dimensions.get('window');

// ─── Employee data ────────────────────────────────────────────────
const EMPLOYEES = [
  {
    name: 'Sarah K.',
    time: 'Today · 09:02 AM',
    status: 'Clocked In',
    isIn: true,
  },
  {
    name: 'Marcus T.',
    time: 'Today · 06:30 PM',
    status: 'Clocked Out',
    isIn: false,
  },
];

// ─── Face SVGs ────────────────────────────────────────────────────
function FaceSarah() {
  return (
    <Svg width={42} height={42} viewBox="0 0 42 42">
      <Circle cx={21} cy={21} r={21} fill="#F5D0A8" />
      <Ellipse cx={21} cy={12} rx={10} ry={9} fill="#2C1A10" />
      <Rect x={11} y={12} width={20} height={8} fill="#2C1A10" />
      <Ellipse cx={21} cy={23} rx={8} ry={9} fill="#EDB87A" />
      <Ellipse cx={18} cy={21.5} rx={1.3} ry={1.5} fill="#2C1A10" />
      <Ellipse cx={24} cy={21.5} rx={1.3} ry={1.5} fill="#2C1A10" />
      <Path
        d="M18 26 Q21 28.5 24 26"
        stroke="#B07840"
        strokeWidth={1.1}
        fill="none"
        strokeLinecap="round"
      />
      <Rect x={17} y={30} width={8} height={5} rx={2.5} fill="#EDB87A" />
      <Ellipse cx={21} cy={42} rx={13} ry={7} fill="#7B64B0" />
    </Svg>
  );
}

function FaceMarcus() {
  return (
    <Svg width={42} height={42} viewBox="0 0 42 42">
      <Circle cx={21} cy={21} r={21} fill="#C8906A" />
      <Ellipse cx={21} cy={11} rx={11} ry={10} fill="#1A0E08" />
      <Ellipse cx={12} cy={16} rx={4} ry={6} fill="#1A0E08" />
      <Ellipse cx={30} cy={16} rx={4} ry={6} fill="#1A0E08" />
      <Ellipse cx={21} cy={23} rx={8} ry={9} fill="#C07848" />
      <Ellipse cx={18} cy={21.5} rx={1.3} ry={1.5} fill="#1A0E08" />
      <Ellipse cx={24} cy={21.5} rx={1.3} ry={1.5} fill="#1A0E08" />
      <Path
        d="M18 26 Q21 28 24 26"
        stroke="#8B5830"
        strokeWidth={1.1}
        fill="none"
        strokeLinecap="round"
      />
      <Rect x={17} y={30} width={8} height={5} rx={2.5} fill="#C07848" />
      <Ellipse cx={21} cy={42} rx={13} ry={7} fill="#9B88C4" />
    </Svg>
  );
}

// ─── Clock Icon SVG ───────────────────────────────────────────────
function ClockIcon() {
  return (
    <Svg width={52} height={52} viewBox="0 0 52 52">
      {/* outer ring */}
      <Circle cx={26} cy={26} r={20} stroke="#4A3880" strokeWidth={2.5} fill="none" />
      {/* inner track ring */}
      <Circle cx={26} cy={26} r={14} stroke="#6B5AA0" strokeWidth={2.5} fill="none" />
      {/* tick marks */}
      <G stroke="#6B5AA0" strokeWidth={1.5} strokeLinecap="round">
        <Line x1={26} y1={8} x2={26} y2={11} />
        <Line x1={44} y1={26} x2={41} y2={26} />
        <Line x1={26} y1={44} x2={26} y2={41} />
        <Line x1={8} y1={26} x2={11} y2={26} />
      </G>
      {/* hour hand */}
      <Line x1={26} y1={26} x2={26} y2={16} stroke="#C4B8FF" strokeWidth={2.5} strokeLinecap="round" />
      {/* minute hand */}
      <Line x1={26} y1={26} x2={33} y2={20} stroke="#A090E0" strokeWidth={2} strokeLinecap="round" />
      {/* center dot */}
      <Circle cx={26} cy={26} r={2.5} fill="#C4B8FF" />
      {/* check badge */}
      <Circle cx={37} cy={37} r={7} fill="#7B64B0" />
      <Circle cx={37} cy={37} r={7} stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} fill="none" />
      <Path
        d="M34 37l2.2 2.2L40 34.5"
        stroke="#fff"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// ─── Slide Button ─────────────────────────────────────────────────
const SLIDER_WIDTH = width * 0.85;
const KNOB_WIDTH = 56;
const MAX_SLIDE = SLIDER_WIDTH - KNOB_WIDTH - 8; // 8 for padding (4 on each side)

function SlideButton({ onSlideComplete }: { onSlideComplete: () => void }) {
  const pan = useRef(new Animated.ValueXY()).current;
  const slideTextOpacity = useRef(new Animated.Value(1)).current;
  const welcomeOpacity = useRef(new Animated.Value(0)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;
  const [completed, setCompleted] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        let newX = gestureState.dx;
        if (newX < 0) newX = 0;
        if (newX > MAX_SLIDE) newX = MAX_SLIDE;
        pan.x.setValue(newX);

        const progress = Math.min(newX / MAX_SLIDE, 1);
        slideTextOpacity.setValue(1 - progress * 1.5);
      },
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dx > MAX_SLIDE * 0.65) {
          setCompleted(true);
          Animated.parallel([
            Animated.timing(pan.x, {
              toValue: MAX_SLIDE,
              duration: 150,
              useNativeDriver: false,
            }),
            Animated.timing(slideTextOpacity, {
              toValue: 0,
              duration: 150,
              useNativeDriver: false,
            }),
            Animated.timing(welcomeOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: false,
            }),
            Animated.timing(bgAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: false,
            }),
          ]).start(() => {
            // Wait a moment so the user can read "Welcome"
            setTimeout(() => onSlideComplete(), 600);
          });
        } else {
          Animated.parallel([
            Animated.spring(pan.x, {
              toValue: 0,
              friction: 5,
              tension: 40,
              useNativeDriver: false,
            }),
            Animated.timing(slideTextOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: false,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const containerBg = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#2A1E44', '#2E7D52'], // Navy to Green
  });

  return (
    <Animated.View style={[styles.sliderContainer, { backgroundColor: containerBg }]}>
      <Animated.Text style={[styles.sliderText, { opacity: slideTextOpacity }]}>
        Slide to Login
      </Animated.Text>
      <Animated.Text style={[styles.sliderText, { opacity: welcomeOpacity }]}>
        Welcome
      </Animated.Text>
      <Animated.View
        style={[styles.sliderKnob, { transform: [{ translateX: pan.x }] }]}
        {...(completed ? {} : panResponder.panHandlers)}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 18l6-6-6-6"
            stroke={completed ? "#2E7D52" : "#2A1E44"}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Employee Card ────────────────────────────────────────────────
function EmployeeCard({ emp }: { emp: typeof EMPLOYEES[0] }) {
  return (
    <View style={styles.empCard}>
      <View style={styles.faceRing}>
        {emp.isIn ? <FaceSarah /> : <FaceMarcus />}
      </View>
      <View style={styles.empInfo}>
        <Text style={styles.empName}>{emp.name}</Text>
        <Text style={styles.empTime}>{emp.time}</Text>
        <View style={[styles.empPill, emp.isIn ? styles.pillIn : styles.pillOut]}>
          <View style={[styles.pillDot, emp.isIn ? styles.dotIn : styles.dotOut]} />
          <Text style={[styles.pillText, emp.isIn ? styles.textIn : styles.textOut]}>
            {emp.status}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Splash ──────────────────────────────────────────────────
export default function SplashScreen({ navigation }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const iconFloatAnim = useRef(new Animated.Value(0)).current;
  const cardSlideAnim = useRef(new Animated.Value(0)).current;

  const [activeIndex, setActiveIndex] = useState(0);
  const CARD_HEIGHT = 72;

  // entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSlideComplete = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => navigation.replace('Login'));
  };

  // icon float loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconFloatAnim, {
          toValue: -6,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(iconFloatAnim, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // auto-scroll cards
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % EMPLOYEES.length;
        Animated.spring(cardSlideAnim, {
          toValue: -next * CARD_HEIGHT,
          friction: 7,
          tension: 50,
          useNativeDriver: true,
        }).start();
        return next;
      });
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <PremiumBackground />

      <Animated.View
        style={[
          styles.contentContainer,
          { 
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim 
          },
        ]}
        needsOffscreenAlphaCompositing={true}
      >

        {/* ── Employee ticker ── */}
        <View style={styles.tickerWrap}>
          <Animated.View
            style={[
              styles.tickerTrack,
              { transform: [{ translateY: cardSlideAnim }] },
            ]}
          >
            {EMPLOYEES.map((emp, i) => (
              <EmployeeCard key={i} emp={emp} />
            ))}
          </Animated.View>
        </View>

        {/* indicator dots */}
        <View style={styles.dotsRow}>
          {EMPLOYEES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.indDot,
                activeIndex === i ? styles.indDotActive : null,
              ]}
            />
          ))}
        </View>

        {/* ── Clock icon ── */}
        <Animated.View
          style={[
            styles.iconContainer,
            { transform: [{ translateY: iconFloatAnim }] },
          ]}
        >
          <ClockIcon />
        </Animated.View>

        {/* ── App name ── */}
        <Text style={styles.title}>WorkforceOS</Text>
        <Text style={styles.subtitle}>TRACK · MANAGE · GROW</Text>

      </Animated.View>

      <Animated.View style={{ position: 'absolute', bottom: 60, width: '100%', alignItems: 'center', opacity: fadeAnim }}>
        <SlideButton onSlideComplete={handleSlideComplete} />
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ticker
  tickerWrap: {
    width: 200,
    height: 72,
    overflow: 'hidden',
    borderRadius: 18,
    marginBottom: 12,
  },
  tickerTrack: {
    flexDirection: 'column',
  },
  empCard: {
    width: 200,
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  faceRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  empInfo: {
    flexDirection: 'column',
    gap: 2,
  },
  empName: {
    ...typography.employeeName,
    fontSize: 13,
    color: '#2A1E44',
  },
  empTime: {
    ...typography.caption,
    fontSize: 10,
    color: '#9B88C4',
  },
  empPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  pillIn: { backgroundColor: '#E8F5EE' },
  pillOut: { backgroundColor: '#FEECEC' },
  pillDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  dotIn: { backgroundColor: '#2E7D52' },
  dotOut: { backgroundColor: '#A03030' },
  pillText: {
    ...typography.statusChip,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  textIn: { color: '#2E7D52' },
  textOut: { color: '#A03030' },

  // indicator dots
  dotsRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 20,
  },
  indDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D9D4F0',
  },
  indDotActive: {
    width: 14,
    backgroundColor: '#7B64B0',
  },

  // clock icon
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },

  // text
  title: {
    ...typography.screenTitle,
    fontSize: 28,
    fontStyle: 'italic',
    color: '#2A1E44',
    letterSpacing: -0.3,
    marginBottom: 7,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 10,
    letterSpacing: 3,
    color: '#9B88C4',
    marginBottom: 32,
  },

  // slider button
  sliderContainer: {
    width: width * 0.85,
    height: 64,
    backgroundColor: '#1E1B4B',
    borderRadius: 32,
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  sliderText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#F0EDF8',
    fontFamily: fonts.semiBold,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  sliderKnob: {
    width: 56,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 4,
    top: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});