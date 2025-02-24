import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Animated, Alert, Platform } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import ImageUpload from '../components/ImageUpload';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  primary: '#043927',
  secondary: '#0D6B37',
  white: '#fff',
  accent: '#81C784',
};

export default function HomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const modelCheckInProgress = useRef(false);
  const [hasModel, setHasModel] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkModel();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    checkModel();
    // Start animation after a short delay to ensure initial render
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, 100);
  }, []);

  const checkModel = async () => {
    try {
      const savedImage = await AsyncStorage.getItem('lastUploadedImage');
      setHasModel(!!savedImage);
    } catch (error) {
      console.error('Error checking model:', error);
      setHasModel(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      tabBarButton: (props) => (
        <Button
          {...props}
          onPress={() => {
            if (!hasModel) {
              if (Platform.OS === 'web') {
                window.alert('Please upload a model image first to use the Style Assistant.');
              } else {
                Alert.alert(
                  'Model Required',
                  'Please upload a model image first to use the Style Assistant.',
                  [{ text: 'OK', style: 'default' }]
                );
              }
              return;
            }
            navigation.navigate('Chat');
          }}
        />
      ),
    });
  }, [hasModel, navigation]);

  const handleStyleAssistant = async () => {
    if (modelCheckInProgress.current) return;
    modelCheckInProgress.current = true;

    try {
      if (!hasModel) {
        if (Platform.OS === 'web') {
          window.alert('Please upload a model image first to use the Style Assistant.');
        } else {
          Alert.alert(
            'Model Required',
            'Please upload a model image first to use the Style Assistant.',
            [{ text: 'OK', style: 'default' }]
          );
        }
        return;
      }
      navigation.navigate('Chat');
    } catch (error) {
      console.error('Error checking model:', error);
    } finally {
      modelCheckInProgress.current = false;
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary]}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}>
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>SUSTAINABLE{'\n'}FASHION</Text>
              <View style={styles.divider} />
              <Text style={styles.subtitle}>
                AI-powered style recommendations for sustainable fashion choices.
              </Text>
            </View>
            <View style={styles.uploadSection}>
              <ImageUpload onImageChange={(image) => setHasModel(!!image)} />
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.buttonContainer, {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }]}>
          <Button
            mode="contained"
            onPress={handleStyleAssistant}
            style={[styles.button, !hasModel && styles.disabledButton]}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            icon="chat-processing"
            disabled={!hasModel}
          >
            STYLE ASSISTANT
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.navigate('TryOn')}
            style={[styles.button, styles.outlinedButton]}
            contentStyle={styles.buttonContent}
            labelStyle={styles.outlinedButtonLabel}
            icon="hanger"
          >
            VIRTUAL TRY-ON
          </Button>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: '100vh',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 80,
  },
  titleSection: {
    flex: 1,
    maxWidth: 600,
  },
  uploadSection: {
    flex: 1,
    height: 500,
    maxWidth: 500,
  },
  title: {
    fontSize: 64,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
    lineHeight: 72,
  },
  divider: {
    width: 60,
    height: 4,
    backgroundColor: COLORS.white,
    marginVertical: 24,
  },
  subtitle: {
    fontSize: 20,
    color: COLORS.white,
    opacity: 0.9,
    lineHeight: 28,
    marginBottom: 40,
  },
  buttonContainer: {
    gap: 16,
    maxWidth: 400,
  },
  button: {
    height: 56,
    borderRadius: 8,
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  outlinedButton: {
    backgroundColor: 'transparent',
    borderColor: COLORS.white,
    borderWidth: 2,
  },
  outlinedButtonLabel: {
    color: COLORS.white,
  },
  disabledButton: {
    backgroundColor: '#81C78480',
    opacity: 0.6,
  },
});
