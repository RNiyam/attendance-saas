import { StatusBar } from 'expo-status-bar';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>HRMS Face Attendance</Text>

      <View style={styles.buttonContainer}>
        <Button title="Register Face" onPress={() => navigation.navigate('Register')} />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Mark Attendance" onPress={() => navigation.navigate('Attendance')} />
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
