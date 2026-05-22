import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import SplashScreen from './src/screens/SplashScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import FaceRegistrationScreen from './src/screens/FaceRegistrationScreen';

type ScreenName = 'Splash' | 'Home' | 'Register' | 'Attendance';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Splash');

  if (currentScreen === 'Splash') {
    return <SplashScreen onFinish={() => setCurrentScreen('Home')} />;
  }

  if (currentScreen === 'Register') {
    return <FaceRegistrationScreen onBack={() => setCurrentScreen('Home')} />;
  }

  if (currentScreen === 'Attendance') {
    return <AttendanceScreen onBack={() => setCurrentScreen('Home')} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HRMS Face Attendance</Text>

      <View style={styles.buttonContainer}>
        <Button title="Register Face" onPress={() => setCurrentScreen('Register')} />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Mark Attendance" onPress={() => setCurrentScreen('Attendance')} />
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  buttonContainer: {
    marginVertical: 10,
    width: '100%',
    maxWidth: 300,
  },
});
