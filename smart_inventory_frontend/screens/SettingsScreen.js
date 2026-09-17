import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsScreen({ navigation }) {
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const { language, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const { logout } = useAuth();
  const currentColors = isDarkMode ? colors.dark : colors.light;
  const isRTL = language === 'ar';
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Update header when theme changes
  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: currentColors.primary,
      },
      headerTintColor: '#fff',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginLeft: 15 }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [isDarkMode, currentColors, navigation]);

  const handleLogout = async () => {
    Alert.alert(
      t('logout') || 'Logout',
      t('logout_confirmation') || 'Are you sure you want to logout?',
      [
        {
          text: t('cancel') || 'Cancel',
          style: 'cancel',
        },
        {
          text: t('logout') || 'Logout',
          style: 'destructive',
          onPress: async () => {
            // Clear the session/login data
            await logout();
            // Navigate to Login screen
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const handleLanguageSelect = (lang) => {
    changeLanguage(lang);
    setShowLanguageModal(false);
  };

  const styles = createStyles(currentColors, isRTL);

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Language Controller */}
        <TouchableOpacity 
          style={[styles.controlItem, { 
            backgroundColor: currentColors.surface, 
            borderColor: currentColors.border 
          }]}
          onPress={() => setShowLanguageModal(true)}>
          <View style={styles.controlLeft}>
            <Ionicons 
              name="language-outline" 
              size={24} 
              color={currentColors.primary} 
              style={styles.icon}
            />
            <View style={styles.controlTextContainer}>
              <Text style={[styles.controlLabel, { color: currentColors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                {t('language')}
              </Text>
              <Text style={[styles.controlValue, { color: currentColors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                {language === 'en' ? t('english') : t('arabic')}
              </Text>
            </View>
          </View>
          <Ionicons 
            name="chevron-down-outline" 
            size={20} 
            color={currentColors.textSecondary} 
          />
        </TouchableOpacity>

        {/* Language Selection Modal */}
        <Modal
          visible={showLanguageModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowLanguageModal(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowLanguageModal(false)}>
            <View 
              style={[styles.modalContent, { 
                backgroundColor: currentColors.surface,
                borderColor: currentColors.border 
              }]}>
              <Text style={[styles.modalTitle, { color: currentColors.text }]}>
                {t('language')}
              </Text>
              
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  { 
                    backgroundColor: language === 'en' ? currentColors.primary + '20' : 'transparent',
                    borderColor: currentColors.border 
                  }
                ]}
                onPress={() => handleLanguageSelect('en')}>
                <View style={styles.languageOptionLeft}>
                  <Text style={[styles.languageOptionText, { color: currentColors.text }]}>
                    {t('english')}
                  </Text>
                  <Text style={[styles.languageOptionCode, { color: currentColors.textSecondary }]}>
                    EN
                  </Text>
                </View>
                {language === 'en' && (
                  <Ionicons name="checkmark" size={20} color={currentColors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.languageOption,
                  { 
                    backgroundColor: language === 'ar' ? currentColors.primary + '20' : 'transparent',
                    borderColor: currentColors.border 
                  }
                ]}
                onPress={() => handleLanguageSelect('ar')}>
                <View style={styles.languageOptionLeft}>
                  <Text style={[styles.languageOptionText, { color: currentColors.text }]}>
                    {t('arabic')}
                  </Text>
                  <Text style={[styles.languageOptionCode, { color: currentColors.textSecondary }]}>
                    AR
                  </Text>
                </View>
                {language === 'ar' && (
                  <Ionicons name="checkmark" size={20} color={currentColors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Theme Controller */}
        <View 
          style={[styles.controlItem, { 
            backgroundColor: currentColors.surface, 
            borderColor: currentColors.border 
          }]}>
          <View style={styles.controlLeft}>
            <Ionicons 
              name={isDarkMode ? "moon-outline" : "sunny-outline"} 
              size={24} 
              color={currentColors.primary} 
              style={styles.icon}
            />
            <View style={styles.controlTextContainer}>
              <Text style={[styles.controlLabel, { color: currentColors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                {isDarkMode ? t('darkMode') : t('lightMode')}
              </Text>
              <Text style={[styles.controlValue, { color: currentColors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                {isDarkMode ? t('darkMode') : t('lightMode')}
              </Text>
            </View>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: currentColors.primary }}
            thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
          />
        </View>

      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: currentColors.error }]}
          onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.logoutIcon} />
          <Text style={styles.logoutButtonText}>{t('logout')}</Text>
        </TouchableOpacity>

        {/* Copyright */}
        <View style={styles.copyrightContainer}>
          <Text style={[styles.copyrightText, { color: currentColors.textSecondary }]}>
            {t('copyright')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors, isRTL) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  controlItem: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    minHeight: 60,
  },
  controlLeft: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: isRTL ? 0 : 12,
    marginLeft: isRTL ? 12 : 0,
  },
  controlTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  controlValue: {
    fontSize: 14,
  },
  bottomSection: {
    padding: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logoutButton: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  logoutIcon: {
    marginRight: isRTL ? 0 : 8,
    marginLeft: isRTL ? 8 : 0,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  copyrightContainer: {
    alignItems: 'center',
  },
  copyrightText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  languageOptionLeft: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  languageOptionCode: {
    fontSize: 14,
    fontWeight: '400',
  },
});
