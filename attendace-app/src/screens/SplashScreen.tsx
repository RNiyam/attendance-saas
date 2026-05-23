import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import Svg, {
  Circle,
  Line,
  Path,
  Rect,
  Ellipse,
  G,
} from 'react-native-svg';

interface SplashScreenProps {
  onFinish: () => void;
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
export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const iconFloatAnim = useRef(new Animated.Value(0)).current;
  const cardSlideAnim = useRef(new Animated.Value(0)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;

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

    // loading bar
    Animated.timing(loadingAnim, {
      toValue: 1,
      duration: 2200,
      useNativeDriver: false,
    }).start();

    // exit
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => onFinish());
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

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

  const loadingWidth = loadingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>

      {/* background blobs */}
      <View style={styles.blobTL} />
      <View style={styles.blobBR} />

      <Animated.View
        style={[
          styles.contentContainer,
          { transform: [{ scale: scaleAnim }] },
        ]}
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

        {/* ── Loading bar ── */}
        <View style={styles.loadingBarContainer}>
          <Animated.View style={[styles.loadingBar, { width: loadingWidth }]} />
        </View>

      </Animated.View>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EDF8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // blobs
  blobTL: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#E3DCF5',
    top: -100,
    left: -100,
  },
  blobBR: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#D8EEE8',
    bottom: -70,
    right: -70,
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
    borderWidth: 1,
    borderColor: 'rgba(155,136,196,0.18)',
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
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '600',
    color: '#2A1E44',
  },
  empTime: {
    fontSize: 10,
    fontWeight: '400',
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
    fontSize: 9,
    fontWeight: '600',
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
    borderWidth: 1.5,
    borderColor: 'rgba(155,136,196,0.2)',
  },

  // text
  title: {
    fontSize: 28,
    fontWeight: '400',
    fontStyle: 'italic',
    color: '#2A1E44',
    letterSpacing: -0.3,
    marginBottom: 7,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 3,
    color: '#9B88C4',
    marginBottom: 32,
  },

  // loading bar
  loadingBarContainer: {
    width: width * 0.35,
    height: 3,
    backgroundColor: 'rgba(155,136,196,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingBar: {
    height: '100%',
    backgroundColor: '#9B88C4',
    borderRadius: 2,
  },
});