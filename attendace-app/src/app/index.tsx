import { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';

export default function SplashScreen() {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const textOpacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Fade in and scale up logo
    opacity.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.exp) });
    scale.value = withSpring(1, { damping: 14, stiffness: 100 });
    
    // Continuous pulse effect for the glow
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    // Animate text up and fade in
    textOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
    translateY.value = withDelay(600, withSpring(0, { damping: 12, stiffness: 90 }));

    // Navigate to home after 3.5 seconds
    const timer = setTimeout(() => {
      router.replace('/home');
    }, 3500);

    return () => clearTimeout(timer);
  }, [opacity, pulseScale, scale, textOpacity, translateY]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background Decorator Lines */}
      <View style={styles.decoratorTop} />
      <View style={styles.decoratorBottom} />

      <Animated.View style={[styles.logoContainer, logoStyle]}>
        {/* Pulsing background glow */}
        <Animated.View style={[styles.glowWrapper, pulseStyle]} />
        
        {/* Main Logo Icon (Face/Scan Concept) */}
        <View style={styles.iconPlaceholder}>
          <View style={styles.scanLine} />
          <View style={styles.eyeLeft} />
          <View style={styles.eyeRight} />
          <View style={styles.smile} />
          
          {/* Corner markers for scan effect */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
      </Animated.View>
      
      <Animated.View style={[styles.textContainer, textStyle]}>
        <Text style={styles.title}>Niyam</Text>
        <Text style={styles.subtitle}>Smart Attendance</Text>
      </Animated.View>
      
      <Animated.View style={[styles.footer, textStyle]}>
        <Text style={styles.footerText}>POWERED BY AI FACE RECOGNITION</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b', // zinc-950 dark premium
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  decoratorTop: {
    position: 'absolute',
    top: -150,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(56, 189, 248, 0.03)', // sky-400 tint
    zIndex: 0,
  },
  decoratorBottom: {
    position: 'absolute',
    bottom: -200,
    right: -150,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(99, 102, 241, 0.03)', // indigo-500 tint
    zIndex: 0,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
    zIndex: 10,
  },
  glowWrapper: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#38bdf8', // sky-400
    opacity: 0.15,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 20,
  },
  iconPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.8)', // slate-900 transparent
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  scanLine: {
    position: 'absolute',
    top: '30%',
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(56, 189, 248, 0.6)',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  eyeLeft: {
    position: 'absolute',
    top: '35%',
    left: '30%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38bdf8',
  },
  eyeRight: {
    position: 'absolute',
    top: '35%',
    right: '30%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38bdf8',
  },
  smile: {
    position: 'absolute',
    bottom: '30%',
    width: 24,
    height: 10,
    borderBottomWidth: 3,
    borderBottomColor: '#38bdf8',
    borderRadius: 10,
    opacity: 0.8,
  },
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: '#38bdf8',
  },
  cornerTL: { top: 8, left: 8, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 4 },
  cornerTR: { top: 8, right: 8, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 4 },
  cornerBL: { bottom: 8, left: 8, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 8, right: 8, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 4 },
  
  textContainer: {
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8', // slate-400
    letterSpacing: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    zIndex: 10,
  },
  footerText: {
    color: '#475569', // slate-600
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '700',
  },
});
