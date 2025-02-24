import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, Animated, Dimensions, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button, Text, Portal, Modal, ActivityIndicator, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#043927',
  secondary: '#4CAF50',
  white: '#fff',
  accent: '#D1C4E9',
  background: '#f8f9fa',
  danger: '#dc3545',
};

export default function TryOnScreen() {
  const navigation = useNavigation();
  const [wardrobe, setWardrobe] = useState([]);
  const [processedImage, setProcessedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [itemType, setItemType] = useState('upper');
  const [modelImage, setModelImage] = useState(null);
  
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    loadModelImage();

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

  const loadModelImage = async () => {
    try {
      const savedImage = await AsyncStorage.getItem('lastUploadedImage');
      if (savedImage) {
        setModelImage(savedImage);
      }
    } catch (error) {
      console.error('Error loading model image:', error);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      tabBarButton: (props) => (
        <Button
          {...props}
          onPress={() => {
            if (!modelImage) {
              Alert.alert(
                'Model Required',
                'Please upload a model image first.',
                [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
              );
              return;
            }
            navigation.navigate('TryOn');
          }}
        />
      ),
    });
  }, [modelImage, navigation]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setShowUploadModal(true);
    }
  };

  const addToWardrobe = () => {
    if (selectedImage && itemType) {
      const newItem = {
        id: Date.now().toString(),
        uri: selectedImage,
        type: itemType,
      };
      setWardrobe([...wardrobe, newItem]);
      setSelectedImage(null);
      setShowUploadModal(false);
      setItemType('upper');
    }
  };

  const removeFromWardrobe = (itemId) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your wardrobe?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          onPress: () => setWardrobe(wardrobe.filter(item => item.id !== itemId)),
          style: 'destructive'
        },
      ]
    );
  };

  const tryOnItem = async (itemUri) => {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', {
        uri: itemUri,
        type: 'image/jpeg',
        name: 'clothing.jpg',
      });

      const response = await fetch(`${API_URL}/try-on`, {
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
      Alert.alert('Error', 'Failed to process the image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            iconColor={COLORS.primary}
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>Virtual Try-On</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Wardrobe Section */}
        <View style={styles.wardrobeSection}>
          <Text style={styles.sectionTitle}>My Wardrobe</Text>
          <Button
            mode="contained"
            onPress={pickImage}
            style={styles.addButton}
          >
            Add Item
          </Button>
          
          {wardrobe.length === 0 ? (
            <View style={styles.emptyWardrobe}>
              <Text style={styles.emptyText}>Your wardrobe is empty</Text>
              <Text style={styles.emptySubText}>Add items to start trying them on!</Text>
            </View>
          ) : (
            <ScrollView style={styles.wardrobeList}>
              {wardrobe.map((item) => (
                <View key={item.id} style={styles.wardrobeItem}>
                  <Image source={{ uri: item.uri }} style={styles.itemImage} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemType}>{item.type === 'upper' ? 'Upper Body' : 'Lower Body'}</Text>
                    <View style={styles.itemActions}>
                      <Button
                        mode="contained"
                        onPress={() => tryOnItem(item.uri)}
                        style={styles.tryOnButton}
                      >
                        Try On
                      </Button>
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => removeFromWardrobe(item.id)}
                        style={styles.deleteButton}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Model Display Section */}
        <View style={styles.modelSection}>
          <Text style={styles.sectionTitle}>Virtual Model</Text>
          {isLoading ? (
            <View style={styles.modelLoadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Processing your outfit...</Text>
            </View>
          ) : processedImage ? (
            <Image
              source={{ uri: processedImage }}
              style={styles.modelImage}
              resizeMode="contain"
            />
          ) : modelImage ? (
            <View style={styles.modelContainer}>
              <Image
                source={{ uri: modelImage }}
                style={styles.modelImage}
                resizeMode="contain"
              />
              <Text style={styles.modelPrompt}>
                Select an item from your wardrobe to try it on
              </Text>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>Please upload a model image from the home screen first</Text>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('Home')}
                style={styles.uploadModelButton}
              >
                Upload Model
              </Button>
            </View>
          )}
        </View>
      </View>

      {/* Upload Modal */}
      <Portal>
        <Modal
          visible={showUploadModal}
          onDismiss={() => setShowUploadModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Add to Wardrobe</Text>
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          
          <Text style={styles.modalSubtitle}>Select Clothing Type</Text>
          <View style={styles.clothingTypeContainer}>
            <TouchableOpacity 
              style={[
                styles.typeOption,
                itemType === 'upper' && styles.typeOptionSelected
              ]}
              onPress={() => setItemType('upper')}
            >
              <IconButton
                icon="tshirt-crew"
                size={32}
                iconColor={itemType === 'upper' ? COLORS.white : COLORS.primary}
              />
              <Text style={[
                styles.typeText,
                itemType === 'upper' && styles.typeTextSelected
              ]}>
                Upper Body
              </Text>
              <Text style={[
                styles.typeDescription,
                itemType === 'upper' && styles.typeDescriptionSelected
              ]}>
                Shirts, T-shirts, Jackets
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.typeOption,
                itemType === 'lower' && styles.typeOptionSelected
              ]}
              onPress={() => setItemType('lower')}
            >
              <IconButton
                icon="pants"
                size={32}
                iconColor={itemType === 'lower' ? COLORS.white : COLORS.primary}
              />
              <Text style={[
                styles.typeText,
                itemType === 'lower' && styles.typeTextSelected
              ]}>
                Lower Body
              </Text>
              <Text style={[
                styles.typeDescription,
                itemType === 'lower' && styles.typeDescriptionSelected
              ]}>
                Pants, Shorts, Skirts
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalActions}>
            <Button 
              onPress={() => setShowUploadModal(false)} 
              style={styles.modalButton}
              mode="outlined"
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={addToWardrobe} 
              style={styles.modalButton}
            >
              Add Item
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  backButton: {
    marginRight: 8,
  },
  headerTitle: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
  },
  wardrobeSection: {
    flex: 1,
    marginRight: 16,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modelSection: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.primary,
  },
  addButton: {
    marginBottom: 16,
  },
  emptyWardrobe: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  wardrobeList: {
    flex: 1,
  },
  wardrobeItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: 12,
    padding: 8,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemType: {
    fontSize: 14,
    color: '#666',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tryOnButton: {
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: COLORS.danger + '20',
  },
  modelImage: {
    flex: 1,
    width: '100%',
    borderRadius: 8,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 24,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  uploadModelButton: {
    marginTop: 8,
  },
  modal: {
    backgroundColor: COLORS.white,
    padding: 24,
    margin: 20,
    borderRadius: 12,
    maxWidth: 500,
    width: '90%',
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLORS.primary,
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 16,
    color: '#333',
  },
  clothingTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  typeOption: {
    flex: 1,
    marginHorizontal: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f5f5f5',
  },
  typeOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    color: '#333',
  },
  typeTextSelected: {
    color: COLORS.white,
  },
  typeDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  typeDescriptionSelected: {
    color: COLORS.white + 'CC',
  },
  previewImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  modalButton: {
    marginLeft: 12,
    minWidth: 100,
  },
  modelContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modelPrompt: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 8,
    color: COLORS.white,
    fontSize: 14,
  },
  modelLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.primary,
  },
});