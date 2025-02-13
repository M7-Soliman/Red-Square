import React, { useEffect } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  primary: '#043927',
  secondary: '#0D6B37',
  white: '#fff',
  accent: '#81C784',
};

export default function HomeScreen({ navigation }) {
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
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
  }, []);

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
          <Text style={styles.title}>SUSTAINABLE{'\n'}FASHION</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>
            AI-powered style recommendations for sustainable fashion choices.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.buttonContainer, {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }]}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Chat')}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            icon="chat-processing"
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
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingTop: 160,
    paddingBottom: 60,
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
    maxWidth: 600,
    lineHeight: 28,
  },
  buttonContainer: {
    gap: 16,
    maxWidth: 400,
  },
  button: {
    height: 56,
    borderRadius: 8,
    marginTop: 12,
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
});
