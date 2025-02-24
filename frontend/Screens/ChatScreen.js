import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, Dimensions, Animated, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Surface, ActivityIndicator, Avatar, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused, useNavigation, useFocusEffect } from '@react-navigation/native';
import { API_URL } from '../config';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#043927',
  secondary: '#0D6B37',
  white: '#fff',
  accent: '#81C784',
  background: '#F5F7F9',
  text: {
    primary: '#1A1A1A',
    secondary: '#666666',
    placeholder: '#999999',
  }
};

const CHAT_ENDPOINT = `${API_URL}/chat`;
const CHAT_STORAGE_KEY = '@green_square_chat_messages';

const CONVERSATION_STARTERS = [
  {
    text: "What colors would look good on me?",
    icon: "palette",
  },
  {
    text: "Can you help me find an outfit for a wedding?",
    icon: "hanger",
  },
  {
    text: "What's trending in fashion this season?",
    icon: "trending-up",
  },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const scrollViewRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const inputRef = useRef();

  const handleKeyPress = (e) => {
    if (e.nativeEvent.key === 'Enter') {
      // If Shift is held, allow new line
      if (e.nativeEvent.shiftKey) {
        return;
      }
      // Otherwise send the message
      e.preventDefault();
      if (inputText.trim()) {
        sendMessage(inputText);
      }
    }
  };

  const handleSubmit = () => {
    if (inputText.trim()) {
      sendMessage(inputText);
    }
  };

  // Clear chat when component mounts
  useEffect(() => {
    clearChat();
  }, []);

  // Handle focus effects
  useFocusEffect(
    React.useCallback(() => {
      // Update navigation appearance
      navigation.setOptions({
        tabBarIcon: ({ size }) => (
          <MaterialCommunityIcons 
            name="message-text" 
            size={size} 
            color={COLORS.primary} 
          />
        ),
        tabBarLabel: () => (
          <Text style={{ color: COLORS.primary, fontSize: 12 }}>
            Style Assistant
          </Text>
        ),
        // Hide header when in chat screen
        headerShown: false,
      });

      // Clear chat on focus
      clearChat();

      return () => {
        // Reset navigation appearance when leaving
        navigation.setOptions({
          headerShown: true,
          tabBarIcon: ({ size }) => (
            <MaterialCommunityIcons 
              name="message-text" 
              size={size} 
              color={COLORS.text.secondary} 
            />
          ),
          tabBarLabel: () => (
            <Text style={{ color: COLORS.text.secondary, fontSize: 12 }}>
              Style Assistant
            </Text>
          ),
        });
      };
    }, [])
  );

  useEffect(() => {
    if (messages.length === 0) {
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
    }
  }, [messages]);

  const loadSavedMessages = async () => {
    try {
      const savedMessages = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      const savedSessionId = await AsyncStorage.getItem(CHAT_STORAGE_KEY + '_session');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
      if (savedSessionId) {
        setSessionId(savedSessionId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const saveChatMessages = async (newMessages, newSessionId) => {
    try {
      await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(newMessages));
      if (newSessionId) {
        await AsyncStorage.setItem(CHAT_STORAGE_KEY + '_session', newSessionId);
        setSessionId(newSessionId);
      }
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const clearChat = async () => {
    try {
      await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
      await AsyncStorage.removeItem(CHAT_STORAGE_KEY + '_session');
      setMessages([]);
      setSessionId(null);
      setInputText('');
      
      // Clear chat on the backend
      await fetch(`${API_URL}/chat/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId
        }),
      });
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  const sendMessage = async (message) => {
    if (!message.trim()) return;

    const userMessage = {
      role: 'user',
      content: message.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages,
          session_id: sessionId
        }),
      });

      const data = await response.json();
      
      const assistantMessage = {
        role: 'assistant',
        content: data.response,
      };

      const newMessages = [...messages, userMessage, assistantMessage];
      setMessages(newMessages);
      saveChatMessages(newMessages, data.session_id);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'Sorry, there was an error processing your message. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const MessageBubble = ({ message, index }) => (
    <Animated.View 
      style={[
        styles.messageRow,
        message.role === 'user' ? styles.userRow : styles.assistantRow,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      {message.role === 'assistant' && (
        <Avatar.Image 
          source={require('../assets/assistant-avatar.png')} 
          style={styles.assistantAvatar}
        />
      )}
      <Surface 
        style={[
          styles.messageBubble,
          message.role === 'user' ? styles.userMessage : styles.assistantMessage,
        ]}
        elevation={2}
      >
        <Text style={[
          styles.messageText,
          message.role === 'user' ? styles.userMessageText : styles.assistantMessageText
        ]}>
          {message.content}
        </Text>
      </Surface>
    </Animated.View>
  );

  const SuggestionBubble = ({ text, icon, onPress }) => (
    <TouchableOpacity onPress={() => onPress(text)}>
      <Surface style={styles.suggestionBubble}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.suggestionGradient}
        >
          <View style={styles.suggestionContent}>
            <MaterialCommunityIcons name={icon} size={24} color={COLORS.white} />
            <Text style={styles.suggestionText}>{text}</Text>
          </View>
        </LinearGradient>
      </Surface>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.header}
      >
        <TouchableOpacity 
          onPress={() => navigation.navigate('Home')}
          style={styles.backButton}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color={COLORS.white} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Style Assistant</Text>
        <IconButton
          icon="delete"
          size={24}
          onPress={clearChat}
          iconColor={COLORS.white}
        />
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 && (
            <View style={styles.suggestionsContainer}>
              {CONVERSATION_STARTERS.map((starter, index) => (
                <Animated.View
                  key={index}
                  style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  }}
                >
                  <SuggestionBubble
                    text={starter.text}
                    icon={starter.icon}
                    onPress={sendMessage}
                  />
                </Animated.View>
              ))}
            </View>
          )}
          
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} index={index} />
          ))}
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          )}
        </ScrollView>

        <Surface style={styles.inputContainer} elevation={8}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Press Enter to send, Shift+Enter for new line..."
            placeholderTextColor={COLORS.text.placeholder}
            multiline
            maxLength={500}
            disabled={isLoading}
            mode="outlined"
            outlineColor={COLORS.primary}
            activeOutlineColor={COLORS.primary}
            textColor={COLORS.text.primary}
            onKeyPress={handleKeyPress}
            onSubmitEditing={handleSubmit}
            blurOnSubmit={false}
            theme={{
              colors: {
                onSurfaceVariant: COLORS.text.secondary,
              },
            }}
            contentStyle={styles.inputContent}
          />
          <IconButton
            icon="send"
            mode="contained"
            size={28}
            iconColor={COLORS.white}
            containerColor={COLORS.primary}
            onPress={handleSubmit}
            disabled={isLoading || !inputText.trim()}
            style={styles.sendButton}
          />
        </Surface>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  assistantAvatar: {
    width: 40,
    height: 40,
    marginRight: 8,
    borderRadius: 20,
  },
  messageBubble: {
    maxWidth: width * 0.75,
    padding: 12,
    borderRadius: 20,
  },
  userMessage: {
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 4,
  },
  assistantMessage: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.text.primary,
  },
  userMessageText: {
    color: COLORS.white,
  },
  assistantMessageText: {
    color: COLORS.text.primary,
  },
  suggestionsContainer: {
    padding: 16,
    gap: 12,
    backgroundColor: COLORS.white,
  },
  suggestionBubble: {
    borderRadius: 20,
    elevation: 4,
    marginVertical: 6,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
  },
  suggestionGradient: {
    padding: 16,
    borderRadius: 20,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  suggestionText: {
    color: COLORS.white,
    fontSize: 16,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: COLORS.white,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  input: {
    flex: 1,
    marginRight: 8,
    backgroundColor: COLORS.white,
    maxHeight: 100,
    fontSize: 16,
  },
  inputContent: {
    backgroundColor: COLORS.white,
    color: COLORS.text.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sendButton: {
    margin: 0,
    marginBottom: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  loadingContainer: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});