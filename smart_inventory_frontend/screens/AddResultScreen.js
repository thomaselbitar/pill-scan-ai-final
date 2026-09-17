import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useProduct } from '../contexts/ProductContext';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { aiAPI, productsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { WEIGHT_UNITS, FORMS, USE_TYPES } from '../constants/productFields';

export default function AddResultScreen({ onBack, onConfirm }) {
  const route = useRoute();
  const navigation = useNavigation();
  const { isDarkMode, colors } = useTheme();
  const { t } = useTranslation();
  const { saveProduct } = useProduct();
  const { user } = useAuth();
  const currentColors = isDarkMode ? colors.dark : colors.light;

  const imageUri = route.params?.imageUri;
  const initialData = route.params?.initialData || {};

  const [productName, setProductName] = useState(initialData.product_name || '');
  const [weightNum, setWeightNum] = useState(
    initialData.weight_num != null ? String(initialData.weight_num) : '',
  );
  const [weightUnit, setWeightUnit] = useState(initialData.weight_unit || WEIGHT_UNITS[0]);
  const [form, setForm] = useState(initialData.form || FORMS[0]);
  const [useType, setUseType] = useState(initialData.use_type || USE_TYPES[0]);
  const confidence = initialData.confidence || 0;

  const [pickerType, setPickerType] = useState(null); // 'weight' | 'form' | 'use'
  const [errors, setErrors] = useState({});
  const [isChecking, setIsChecking] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiApplied, setAiApplied] = useState(false);

  // Get emoji based on confidence level
  const getConfidenceEmoji = (conf) => {
    if (conf >= 0.7) {
      return '😊'; // High confidence - smile face
    } else if (conf >= 0.4) {
      return '😐'; // Medium confidence - poker face
    } else {
      return '😞'; // Low confidence - sad face
    }
  };

  // Get confidence text
  const getConfidenceText = (conf) => {
    if (conf >= 0.7) {
      return t('high_confidence') || 'High Confidence';
    } else if (conf >= 0.4) {
      return t('medium_confidence') || 'Medium Confidence';
    } else {
      return t('low_confidence') || 'Low Confidence';
    }
  };

  const openPicker = (type) => setPickerType(type);
  const closePicker = () => setPickerType(null);

  const currentOptions =
    pickerType === 'weight' ? WEIGHT_UNITS : pickerType === 'form' ? FORMS : USE_TYPES;

  const handleSelectOption = (value) => {
    if (pickerType === 'weight') {
      setWeightUnit(value);
      if (errors.weightUnit) {
        setErrors({ ...errors, weightUnit: null });
      }
    }
    if (pickerType === 'form') {
      setForm(value);
      if (errors.form) {
        setErrors({ ...errors, form: null });
      }
    }
    if (pickerType === 'use') {
      setUseType(value);
      if (errors.useType) {
        setErrors({ ...errors, useType: null });
      }
    }
    closePicker();
  };

  const validateFields = () => {
    const newErrors = {};
    
    if (!productName || productName.trim() === '') {
      newErrors.productName = t('product_name_required') || 'Product name is required';
    }
    
    if (!weightNum || weightNum.trim() === '') {
      newErrors.weightNum = t('weight_num_required') || 'Weight / strength is required';
    }
    
    if (!weightUnit || weightUnit.trim() === '') {
      newErrors.weightUnit = t('weight_unit_required') || 'Unit is required';
    }
    
    if (!form || form.trim() === '') {
      newErrors.form = t('form_required') || 'Form is required';
    }
    
    if (!useType || useType.trim() === '') {
      newErrors.useType = t('use_type_required') || 'Use type is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const applyAiResult = (data) => {
    setProductName(data.product_name || '');
    const num = data.weight_num;
    setWeightNum(num != null && num !== 0 ? String(num) : '');
    setWeightUnit(data.weight_unit || WEIGHT_UNITS[0]);
    setForm(data.form || FORMS[0]);
    setUseType(data.use_type || USE_TYPES[0]);
    setErrors({});
  };

  const handleTryWithAi = async () => {
    if (!imageUri || isAiLoading || isChecking) {
      return;
    }

    setIsAiLoading(true);
    try {
      const result = await aiAPI.extractProductFromImage(imageUri);
      applyAiResult(result);
      setAiApplied(true);
      Alert.alert(t('ai_analysis_success_title'), t('ai_analysis_success_message'), [
        { text: t('ok') },
      ]);
    } catch {
      Alert.alert(t('error'), t('ai_analysis_failed_kept'));
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleConfirm = async () => {
    // Validate all fields
    if (!validateFields()) {
      return;
    }
    
    const result = {
      product_name: productName.trim(),
      weight_num: weightNum ? Number(weightNum) : null,
      weight_unit: weightUnit,
      form,
      use_type: useType,
    };
    
    // Save product data and image to context
    saveProduct(result, imageUri);
    
    // Check if product exists in database
    setIsChecking(true);
    try {
      const checkResult = await productsAPI.checkProduct(result);
      
      if (checkResult.exists) {
        // Product exists - navigate to existing product screen
        navigation.replace('AddExistingProduct', {
          existingProduct: checkResult.product,
        });
      } else {
        // Product doesn't exist - navigate to price prediction screen
        navigation.replace('AddPrice');
      }
    } catch (error) {
      // If check fails, proceed to price prediction anyway
      console.error('Error checking product:', error);
      navigation.replace('AddPrice');
    } finally {
      setIsChecking(false);
    }
    
    if (onConfirm) {
      onConfirm(result);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: currentColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
        {/* Header with image */}
        <View
          style={[
            styles.card,
            { backgroundColor: currentColors.surface, borderColor: currentColors.border },
          ]}>
          <View style={styles.headerRow}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: currentColors.primary + '20' },
              ]}>
              <Ionicons name="checkmark-circle" size={26} color={currentColors.primary} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.title, { color: currentColors.text }]}>
                {t('review_item') || 'Review detected item'}
              </Text>
              <Text style={[styles.subtitle, { color: currentColors.textSecondary }]}>
                {t('review_item_hint') ||
                  'We detected this information. You can edit it before saving.'}
              </Text>
            </View>
          </View>

          {imageUri && (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: imageUri }} style={styles.preview} />
            </View>
          )}

          {/* Confidence Badge — hidden after successful AI extraction */}
          {!aiApplied && confidence > 0 && (
            <View style={[styles.confidenceBadge, { 
              backgroundColor: confidence >= 0.7 
                ? '#4CAF50' + '20' 
                : confidence >= 0.4 
                ? '#FF9800' + '20' 
                : '#F44336' + '20',
              borderColor: confidence >= 0.7 
                ? '#4CAF50' 
                : confidence >= 0.4 
                ? '#FF9800' 
                : '#F44336',
            }]}>
              <Text style={styles.confidenceEmoji}>
                {getConfidenceEmoji(confidence)}
              </Text>
              <Text style={[styles.confidenceText, { 
                color: confidence >= 0.7 
                  ? '#4CAF50' 
                  : confidence >= 0.4 
                  ? '#FF9800' 
                  : '#F44336' 
              }]}>
                {getConfidenceText(confidence)}
              </Text>
            </View>
          )}

          {/* Fields */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: currentColors.text }]}>
              {t('product_name') || 'Product name'}
            </Text>
            <TextInput
              value={productName}
              onChangeText={(text) => {
                setProductName(text);
                if (errors.productName) {
                  setErrors({ ...errors, productName: null });
                }
              }}
              placeholder={t('product_name_placeholder') || 'Enter product name'}
              placeholderTextColor={currentColors.placeholder}
              style={[
                styles.input,
                {
                  backgroundColor: currentColors.surface,
                  borderColor: errors.productName ? '#ff4444' : currentColors.border,
                  color: currentColors.text,
                },
              ]}
            />
            {errors.productName && (
              <Text style={[styles.errorText, { color: '#ff4444' }]}>
                {errors.productName}
              </Text>
            )}
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.rowItem]}>
              <Text style={[styles.label, { color: currentColors.text }]}>
                {t('weight_num') || 'Weight / strength'}
              </Text>
              <TextInput
                value={weightNum}
                onChangeText={(text) => {
                  const numeric = text.replace(/[^0-9.]/g, '');
                  setWeightNum(numeric);
                  if (errors.weightNum) {
                    setErrors({ ...errors, weightNum: null });
                  }
                }}
                keyboardType="numeric"
                placeholder={t('weight_num_placeholder') || 'e.g. 500'}
                placeholderTextColor={currentColors.placeholder}
                style={[
                  styles.input,
                  {
                    backgroundColor: currentColors.surface,
                    borderColor: errors.weightNum ? '#ff4444' : currentColors.border,
                    color: currentColors.text,
                  },
                ]}
              />
              {errors.weightNum && (
                <Text style={[styles.errorText, { color: '#ff4444' }]}>
                  {errors.weightNum}
                </Text>
              )}
            </View>

            <View style={[styles.fieldGroup, styles.rowItem]}>
              <Text style={[styles.label, { color: currentColors.text }]}>
                {t('weight_unit') || 'Unit'}
              </Text>
              <TouchableOpacity
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: currentColors.surface,
                    borderColor: errors.weightUnit ? '#ff4444' : currentColors.border,
                  },
                ]}
                onPress={() => openPicker('weight')}>
                <Text style={[styles.dropdownText, { color: currentColors.text }]}>
                  {weightUnit}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={18}
                  color={currentColors.textSecondary}
                />
              </TouchableOpacity>
              {errors.weightUnit && (
                <Text style={[styles.errorText, { color: '#ff4444' }]}>
                  {errors.weightUnit}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: currentColors.text }]}>
              {t('form') || 'Form'}
            </Text>
            <TouchableOpacity
              style={[
                styles.dropdown,
                {
                  backgroundColor: currentColors.surface,
                  borderColor: errors.form ? '#ff4444' : currentColors.border,
                },
              ]}
              onPress={() => openPicker('form')}>
              <Text style={[styles.dropdownText, { color: currentColors.text }]}>
                {form}
              </Text>
              <Ionicons
                name="chevron-down"
                size={18}
                color={currentColors.textSecondary}
              />
            </TouchableOpacity>
            {errors.form && (
              <Text style={[styles.errorText, { color: '#ff4444' }]}>
                {errors.form}
              </Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: currentColors.text }]}>
              {t('use_type') || 'Use type'}
            </Text>
            <TouchableOpacity
              style={[
                styles.dropdown,
                {
                  backgroundColor: currentColors.surface,
                  borderColor: errors.useType ? '#ff4444' : currentColors.border,
                },
              ]}
              onPress={() => openPicker('use')}>
              <Text style={[styles.dropdownText, { color: currentColors.text }]}>
                {useType}
              </Text>
              <Ionicons
                name="chevron-down"
                size={18}
                color={currentColors.textSecondary}
              />
            </TouchableOpacity>
            {errors.useType && (
              <Text style={[styles.errorText, { color: '#ff4444' }]}>
                {errors.useType}
              </Text>
            )}
          </View>
        </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>

      {/* Bottom buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.aiButtonBottom,
            {
              borderColor: currentColors.primary,
              opacity: isAiLoading || isChecking || !imageUri ? 0.6 : 1,
            },
          ]}
          onPress={handleTryWithAi}
          disabled={isAiLoading || isChecking || !imageUri}>
          {isAiLoading ? (
            <View style={styles.aiLoadingRow}>
              <ActivityIndicator size="small" color={currentColors.primary} />
              <Text style={[styles.aiButtonText, { color: currentColors.primary }]}>
                {t('analyzing_with_ai') || 'Analyzing with AI...'}
              </Text>
            </View>
          ) : (
            <Text style={[styles.aiButtonText, { color: currentColors.primary }]}>
              {aiApplied ? t('try_again_with_ai') : t('try_with_ai')}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.primaryButtonBottom,
            {
              backgroundColor: currentColors.primary,
              opacity: isChecking || isAiLoading ? 0.6 : 1,
            },
          ]}
          onPress={handleConfirm}
          disabled={isChecking || isAiLoading}>
          <Text style={[styles.primaryButtonText, { color: '#fff' }]}>
            {isChecking
              ? (t('checking') || 'Checking...')
              : t('proceed_predict_price') || 'Proceed to Predict Price'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Picker modal */}
      <Modal visible={!!pickerType} transparent animationType="fade" onRequestClose={closePicker}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={closePicker}
          style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: currentColors.surface, borderColor: currentColors.border },
            ]}>
            <Text style={[styles.modalTitle, { color: currentColors.text }]}>
              {pickerType === 'weight'
                ? t('weight_unit') || 'Unit'
                : pickerType === 'form'
                  ? t('form') || 'Form'
                  : t('use_type') || 'Use type'}
            </Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {currentOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.optionRow}
                  onPress={() => handleSelectOption(option)}>
                  <Text style={[styles.optionText, { color: currentColors.text }]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  imageWrapper: {
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  preview: {
    width: 220,
    height: 220,
    borderRadius: 18,
    resizeMode: 'cover',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  confidenceEmoji: {
    fontSize: 18,
    marginRight: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  rowItem: {
    flex: 1,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownText: {
    fontSize: 15,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 30,
    gap: 12,
  },
  aiButtonBottom: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 52,
  },
  aiButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  aiLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButtonBottom: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    minHeight: 56,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonIcon: {
    marginRight: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  optionRow: {
    paddingVertical: 10,
  },
  optionText: {
    fontSize: 15,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});


