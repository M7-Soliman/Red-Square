import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { View, StyleSheet, Platform, Alert } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeScreen from './Screens/HomeScreen';
import ChatScreen from './Screens/ChatScreen';
import TryOnScreen from './Screens/TryOnScreen';

const Stack = createNativeStackNavigator();

const COLORS = {
  primary: '#043927',
  secondary: '#0D6B37',
  white: '#fff',
  accent: '#81C784',
};

const CustomHeader = ({ navigation, route }) => {
  const [hasModel, setHasModel] = useState(false);

  useEffect(() => {
    checkModel();
    const unsubscribe = navigation.addListener('focus', () => {
      checkModel();
    });
    return unsubscribe;
  }, [navigation]);

  const checkModel = async () => {
    try {
      const savedImage = await AsyncStorage.getItem('lastUploadedImage');
      setHasModel(!!savedImage);
    } catch (error) {
      console.error('Error checking model:', error);
      setHasModel(false);
    }
  };

  const handleChatNavigation = () => {
    if (!hasModel) {
      if (Platform.OS === 'web') {
        window.alert('Please upload a model image first to use the Style Assistant.');
      } else {
        Alert.alert(
          'Model Required',
          'Please upload a model image first to use the Style Assistant.',
          [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
        );
      }
      return;
    }
    navigation.navigate('Chat');
  };

  const handleTryOnNavigation = () => {
    if (!hasModel) {
      if (Platform.OS === 'web') {
        window.alert('Please upload a model image first to use Virtual Try-On.');
      } else {
        Alert.alert(
          'Model Required',
          'Please upload a model image first to use Virtual Try-On.',
          [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
        );
      }
      return;
    }
    navigation.navigate('TryOn');
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.leftSection}>
          <IconButton
            icon="leaf"
            iconColor={COLORS.white}
            size={24}
            onPress={() => navigation.navigate('Home')}
            style={styles.leafIcon}
          />
          <Text 
            style={styles.logo} 
            onPress={() => navigation.navigate('Home')}
          >
            Green Square
          </Text>
        </View>
        
        <View style={styles.rightSection}>
          <IconButton
            icon="chat-processing"
            iconColor={hasModel ? (route.name === 'Chat' ? COLORS.white : COLORS.primary) : '#999'}
            size={24}
            onPress={handleChatNavigation}
            style={[
              styles.navButton,
              route.name === 'Chat' && styles.activeNavButton,
              !hasModel && styles.disabledNavButton,
            ]}
          />
          <IconButton
            icon="tshirt-crew"
            iconColor={hasModel ? (route.name === 'TryOn' ? COLORS.white : COLORS.primary) : '#999'}
            size={24}
            onPress={handleTryOnNavigation}
            style={[
              styles.navButton,
              route.name === 'TryOn' && styles.activeNavButton,
              !hasModel && styles.disabledNavButton,
            ]}
          />
        </View>
      </View>
    </View>
  );
};

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{
            header: (props) => <CustomHeader {...props} />,
            contentStyle: { 
              backgroundColor: '#F5F7F9',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ headerShown: true }}
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen}
            options={{ headerShown: true }}
          />
          <Stack.Screen 
            name="TryOn" 
            component={TryOnScreen}
            options={{ headerShown: true }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 40,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 4,
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  leafIcon: {
    margin: 0,
  },
  navButton: {
    margin: 0,
    borderRadius: 20,
  },
  activeNavButton: {
    backgroundColor: COLORS.primary,
  },
  disabledNavButton: {
    opacity: 0.6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
});