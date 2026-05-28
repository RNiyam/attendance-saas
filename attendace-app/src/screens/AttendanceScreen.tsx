import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { ActivityIndicator, Button, Image, StyleSheet, Text, View, Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.select({
  android: 'http://10.0.2.2:5003',
  ios: 'http://127.0.0.1:5003',
  default: 'http://127.0.0.1:5003',
}) as string);

type ScreenProps = {
  navigation: any;
  route: {
    params?: {
      accessToken?: string;
      employeeId?: number;
    };
  };
};

type CapturedPhoto = {
  uri: string;
};

export default function AttendanceScreen({ navigation, route }: ScreenProps) {
  const { accessToken, employeeId } = route.params || {};
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;

    const capturedPhoto = await cameraRef.current.takePictureAsync();
    setPhoto(capturedPhoto);
  };

  const markAttendance = async () => {
    if (!photo) return;

    setLoading(true);
    setStatus('Extracting face embedding...');

    try {
      const formData = new FormData();
      formData.append(
        'file',
        {
          uri: photo.uri,
          name: 'face.jpg',
          type: 'image/jpeg',
        } as any,
      );

      const pythonBackendUrl = (process.env.EXPO_PUBLIC_PYTHON_API_URL || 'http://127.0.0.1:8000') + '/extract-face';
      const response = await fetch(pythonBackendUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();

      if (!data.success) {
        setStatus('Failed to detect face. Try again.');
        setLoading(false);
        return;
      }

      setStatus('Matching face...');

      const nodeBackendUrl = `${API_BASE_URL}/api/attendance/check-in`;
      const attResponse = await fetch(nodeBackendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          employeeId: employeeId || 1,
          source: 'face',
          embedding: data.embedding,
          selfieUrl: photo.uri,
        }),
      });

      if (attResponse.ok) {
        setStatus('Attendance marked successfully!');
      } else {
        const errData = await attResponse.json();
        setStatus('Failed: ' + (errData.error || 'Face match failed.'));
      }
    } catch (error) {
      console.error(error);
      setStatus('Network error during attendance marking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mark Attendance</Text>

      {!photo ? (
        <CameraView style={styles.camera} facing="front" ref={cameraRef}>
          <View style={styles.buttonContainer}>
            <Button title="Take Selfie" onPress={takePicture} />
          </View>
        </CameraView>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo.uri }} style={styles.camera} />
          <View style={styles.actionButtons}>
            <Button title="Retake" onPress={() => setPhoto(null)} disabled={loading} />
            <Button title="Clock In" onPress={markAttendance} disabled={loading} />
          </View>
          {loading && <ActivityIndicator size="large" color="#0000ff" />}
          <Text style={styles.statusText}>{status}</Text>
        </View>
      )}

      <View style={styles.backButton}>
        <Button title="Back to Home" onPress={() => navigation.goBack()} disabled={loading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  camera: {
    width: '100%',
    height: 400,
    borderRadius: 10,
    overflow: 'hidden',
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    padding: 20,
  },
  previewContainer: {
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  statusText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: {
    marginTop: 40,
  },
  permissionText: {
    textAlign: 'center',
  },
});
