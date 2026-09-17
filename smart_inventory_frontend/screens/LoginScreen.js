import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const { login, isAuthenticated } = useAuth();

  const currentColors = isDarkMode ? colors.dark : colors.light;
  const isRTL = language === 'ar';

  // Redirect to Home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }
  }, [isAuthenticated, navigation]);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert(t('error') || 'Error', t('pleaseFillAllFields') || 'Please fill all fields');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Attempting login for:', username);
      const result = await login(username.trim(), password);
      console.log('Login result:', result);
      
      if (result.success) {
        // Navigate to Home screen after successful login
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      } else {
        Alert.alert(
          t('error') || 'Error',
          result.error || t('invalid_credentials')
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        t('error') || 'Error',
        error.message || t('login_error')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createStyles(currentColors, isRTL);

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/logo/logo.png')}
                style={styles.logo}
                contentFit="contain"
              />
            </View>

            <Text style={[styles.title, { color: currentColors.text }]}>
              {t('welcomeBack')}
            </Text>
            <Text style={[styles.subtitle, { color: currentColors.textSecondary }]}>
              {t('signInToContinue')}
            </Text>

            <View style={styles.form}>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: currentColors.surface, 
                  color: currentColors.text,
                  borderColor: currentColors.border,
                  textAlign: isRTL ? 'right' : 'left',
                }]}
                placeholder={t('username')}
                placeholderTextColor={currentColors.placeholder}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoComplete="username"
              />

              <TextInput
                style={[styles.input, { 
                  backgroundColor: currentColors.surface, 
                  color: currentColors.text,
                  borderColor: currentColors.border,
                  textAlign: isRTL ? 'right' : 'left',
                }]}
                placeholder={t('password')}
                placeholderTextColor={currentColors.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
              />

              <TouchableOpacity 
                style={[
                  styles.loginButton, 
                  { 
                    backgroundColor: currentColors.primary,
                    opacity: isLoading ? 0.6 : 1,
                  }
                ]} 
                onPress={handleLogin}
                disabled={isLoading}>
                <Text style={styles.loginButtonText}>
                  {isLoading ? (t('logging_in') || 'Logging in...') : t('login')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={[styles.forgotPasswordText, { color: currentColors.primary }]}>
                  {t('forgotPassword')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Theme and Language Toggle Buttons - Bottom (Fixed - Outside KeyboardAvoidingView) */}
      <View style={styles.bottomControls}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={toggleTheme}>
          <Text style={styles.iconButtonText}>
            {isDarkMode ? '🌙' : '☀️'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.iconButton}
          onPress={toggleLanguage}>
          <Text style={styles.iconButtonText}>
            🌐
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors, isRTL) => StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 100, // Space for bottom controls
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 0,
  },
  logo: {
    width: 300,
    height: 150,
    marginBottom:50,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconButtonText: {
    fontSize: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
  },
  loginButton: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPassword: {
    marginTop: 20,
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
  },
});
