import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, Platform, Text } from 'react-native';
import { Button } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const COLORS = {
  primary: '#043927',
  secondary: '#0D6B37',
  white: '#fff',
  accent: '#81C784',
};

const IMAGE_STORAGE_KEY = 'lastUploadedImage';

export default function ImageUpload({ onImageChange }) {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadLastImage();
  }, []);

  useEffect(() => {
    onImageChange?.(image);
  }, [image]);

  const loadLastImage = async () => {
    try {
      const savedImage = await AsyncStorage.getItem(IMAGE_STORAGE_KEY);
      if (savedImage) {
        setImage(savedImage);
        return;
      }

      const response = await fetch(`${API_URL}/uploads`);
      const files = await response.json();
      
      if (files && files.length > 0) {
        const latestImage = `${API_URL}${files[files.length - 1].url}`;
        setImage(latestImage);
        await AsyncStorage.setItem(IMAGE_STORAGE_KEY, latestImage);
      }
    } catch (error) {
      console.error('Error loading last image:', error);
    }
  };

  const removeImage = async () => {
    try {
      if (image) {
        // Remove from server if it's a server URL
        if (image.startsWith(API_URL)) {
          const filename = image.split('/').pop();
          await fetch(`${API_URL}/uploads/${filename}`, {
            method: 'DELETE',
          });
        }
        
        // Remove from storage
        await AsyncStorage.removeItem(IMAGE_STORAGE_KEY);
        setImage(null);
        onImageChange?.(null);

        if (Platform.OS === 'web') {
          window.alert('Model removed successfully');
        } else {
          Alert.alert(
            'Success',
            'Model removed successfully',
            [{ text: 'OK', style: 'default' }]
          );
        }
      }
    } catch (error) {
      console.error('Error removing image:', error);
      if (Platform.OS === 'web') {
        window.alert('Error removing model. Please try again.');
      } else {
        Alert.alert(
          'Error',
          'Error removing model. Please try again.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    }
  };

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    setUploading(true);
    const previousImage = image;
    
    try {
      const formData = new FormData();
      const modelFilename = 'model.jpg';
      
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        const file = new File([blob], modelFilename, { type: 'image/jpeg' });
        formData.append('file', file);
      } else {
        formData.append('file', {
          uri,
          name: modelFilename,
          type: 'image/jpeg',
        });
      }

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
        headers: Platform.OS === 'web' ? {} : {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Construct the full URL for the image
      const imageUrl = `${API_URL}/uploads/model.jpg`;
      await AsyncStorage.setItem('lastUploadedImage', imageUrl);
      setImage(imageUrl);
      onImageChange?.(imageUrl);

      if (Platform.OS === 'web') {
        window.alert('Model uploaded successfully');
      } else {
        Alert.alert(
          'Success',
          'Model uploaded successfully',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setImage(previousImage); // Restore previous image on error
      if (Platform.OS === 'web') {
        window.alert('Error uploading model. Please try again.');
      } else {
        Alert.alert(
          'Error',
          'Error uploading model. Please try again.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {image ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
          <View style={styles.overlay}>
            <View style={styles.buttonGroup}>
              <Button
                mode="contained"
                onPress={pickImage}
                loading={uploading}
                style={[styles.actionButton, styles.changeButton]}
                icon="camera"
              >
                Change Model
              </Button>
              <Button
                mode="contained"
                onPress={removeImage}
                disabled={uploading}
                style={[styles.actionButton, styles.removeButton]}
                icon="delete"
              >
                Remove
              </Button>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.uploadContainer}>
          <View style={styles.uploadContent}>
            <Text style={styles.uploadTitle}>MODEL UPLOAD</Text>
            <View style={styles.divider} />
            <Text style={styles.uploadSubtitle}>
              Upload your model for AI-powered style analysis
            </Text>
            <Button
              mode="contained"
              onPress={pickImage}
              loading={uploading}
              style={styles.button}
              icon="upload"
              labelStyle={styles.buttonLabel}
            >
              SELECT IMAGE
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  uploadContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 20,
  },
  uploadContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  uploadTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 20,
  },
  uploadSubtitle: {
    fontSize: 16,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.8,
  },
  divider: {
    width: 40,
    height: 3,
    backgroundColor: COLORS.white,
    marginBottom: 20,
    opacity: 0.8,
  },
  button: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    borderRadius: 25,
  },
  changeButton: {
    backgroundColor: COLORS.accent,
  },
  removeButton: {
    backgroundColor: '#d32f2f',
  },
});
