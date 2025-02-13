import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, Animated, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button, Text, Portal, Modal, ActivityIndicator, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../config';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#043927',
  secondary: '#4CAF50',
  white: '#fff',
  accent: '#D1C4E9',
  background: '#f8f9fa',
};

const TRY_ON_ENDPOINT = `${API_URL}/try-on`;

export default function TryOnScreen() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setShowModal(true);
    }
  };

  const processImage = async () => {
    setIsLoading(true);
    setShowModal(false);

    try {
      const formData = new FormData();
      formData.append('image', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'photo.jpg',
      });

      const response = await fetch(TRY_ON_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      setProcessedImage(data.processedImageUrl);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Virtual Try-On</Text>
      </LinearGradient>

      <View style={styles.content}>
        {selectedImage ? (
          <Animated.View 
            style={[
              styles.imageContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <Image 
              source={{ uri: processedImage || selectedImage }} 
              style={styles.image}
              resizeMode="contain"
            />
            
            <View style={styles.buttonContainer}>
              <Button 
                mode="contained"
                onPress={() => {
                  setSelectedImage(null);
                  setProcessedImage(null);
                }}
                style={styles.button}
                icon="camera"
                
              >
                Try Another Look
              </Button>
            </View>
          </Animated.View>
        ) : (
          <Animated.View 
            style={[
              styles.uploadContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <IconButton
              icon="tshirt-crew"
              size={80}
              iconColor={COLORS.primary}
            />
            <Text style={styles.uploadText}>
              Upload an image to try on clothes virtually
            </Text>
            <Button 
              mode="contained"
              onPress={pickImage}
              style={styles.button}
              icon="upload"
              textColor={COLORS.white}
            >
              Upload Image
            </Button>
          </Animated.View>
        )}
      </View>

      <Portal>
        <Modal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalText}>Process this image?</Text>
          <View style={styles.modalButtons}>
            <Button 
              onPress={() => setShowModal(false)}
              mode="outlined"
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button 
              onPress={processImage}
              mode="contained"
              style={styles.modalButton}
            >
              Process
            </Button>
          </View>
        </Modal>
      </Portal>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Processing image...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  uploadContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
  },
  uploadText: {
    fontSize: 18,
    marginVertical: 20,
    textAlign: 'center',
    color: '#666',
    maxWidth: '80%',
  },
  imageContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    height: 48,
    color: 'fffff'
  },
  modal: {
    backgroundColor: COLORS.white,
    padding: 20,
    margin: 20,
    borderRadius: 16,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    minWidth: 100,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.primary,
    marginTop: 10,
    fontSize: 16,
  },
});