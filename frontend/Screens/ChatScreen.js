import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, Dimensions, Animated } from 'react-native';
import { TextInput, Button, Text, Surface, ActivityIndicator, Avatar, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
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

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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

const sendMessage = async () => {
  if (!inputText.trim()) return;

  const userMessage = {
    role: 'user',
    content: inputText.trim(),
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
      }),
    });

    const data = await response.json();
    
    const assistantMessage = {
      role: 'assistant',
      content: data.response,
    };

    setMessages(prev => [...prev, assistantMessage]);
  } catch (error) {
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
        <Avatar.Icon 
          size={36} 
          icon="robot" 
          style={styles.avatar}
          color={COLORS.white}
          backgroundColor={COLORS.primary}
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>AI Style Assistant</Text>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 && (
            <Animated.View 
              style={[
                styles.welcomeContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              <Avatar.Icon 
                size={80} 
                icon="robot" 
                style={styles.welcomeAvatar}
                color={COLORS.white}
                backgroundColor={COLORS.primary}
              />
              <Text style={styles.welcomeText}>
                Hello! I'm your AI fashion assistant. Ask me anything about style and fashion!
              </Text>
            </Animated.View>
          )}
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} index={index} />
          ))}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          )}
        </ScrollView>

        <Surface style={styles.inputContainer} elevation={8}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about fashion advice..."
            placeholderTextColor={COLORS.text.placeholder}
            multiline
            maxLength={500}
            disabled={isLoading}
            mode="outlined"
            outlineColor={COLORS.primary}
            activeOutlineColor={COLORS.primary}
            textColor={COLORS.text.primary}
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
            onPress={sendMessage}
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
  avatar: {
    marginRight: 8,
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
  welcomeContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  welcomeAvatar: {
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 18,
    color: COLORS.text.primary,
    textAlign: 'center',
    maxWidth: '80%',
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 10,
    alignItems: 'center',
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
});