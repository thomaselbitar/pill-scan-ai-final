import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { productsAPI } from '../services/api';
import api from '../services/api';

const WEIGHT_UNITS = [
  'g',
  'mg',
  'ml',
  'tablets',
  'capsules',
  'caplets',
  'sachets',
  'spray',
  'drops',
  'vial',
  'tape',
  'ampoules',
  'patch',
  'other',
];

const FORMS = [
  'tablets',
  'capsules',
  'caplets',
  'syrup',
  'suspension',
  'cream',
  'ointment',
  'gel',
  'spray',
  'drops',
  'oral drops',
  'nasal spray',
  'solution',
  'mouth wash',
  'liquid',
  'tape',
  'suppository',
  'inhalation',
  'other',
];

const USE_TYPES = [
  'Pain killer',
  'Antibiotic',
  'Anti-inflammatory',
  'Cold & Flu',
  'Vitamins / Supplements',
  'Skin treatment',
  'Eye/Ear',
  'Nasal spray',
  'Cough syrup / Bronchial',
  'Stomach / Digestive',
  'Other',
];

export default function EditProductScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { isDarkMode, colors } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const currentColors = isDarkMode ? colors.dark : colors.light;

  const product = route.params?.product;
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [productName, setProductName] = useState(product?.product_name || '');
  const [weightNum, setWeightNum] = useState(
    product?.weight_num != null ? String(product.weight_num) : '',
  );
  const [weightUnit, setWeightUnit] = useState(product?.weight_unit || WEIGHT_UNITS[0]);
  const [form, setForm] = useState(product?.form || FORMS[0]);
  const [useType, setUseType] = useState(product?.use_type || USE_TYPES[0]);
  const [price, setPrice] = useState(product?.price != null ? String(product.price) : '');

  const [pickerType, setPickerType] = useState(null); // 'weight' | 'form' | 'use'
  const [errors, setErrors] = useState({});

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

    if (!price || price.trim() === '' || parseFloat(price) <= 0) {
      newErrors.price = t('price_required') || 'Price is required and must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateFields()) {
      return;
    }

    if (!user || !user.username) {
      Alert.alert(
        t('error') || 'Error',
        t('login_required') || 'Please login to edit products'
      );
      return;
    }

    if (!product?.product_id) {
      Alert.alert(
        t('error') || 'Error',
        t('product_not_found') || 'Product not found'
      );
      return;
    }

    setIsSaving(true);
    try {
      const result = await productsAPI.editProduct(
        product.product_id,
        {
          product_name: productName.trim(),
          weight_num: weightNum ? Number(weightNum) : null,
          weight_unit: weightUnit,
          form,
          use_type: useType,
        },
        parseFloat(price),
        user.username
      );

      Alert.alert(
        t('success') || 'Success',
        t('product_updated_successfully') || 'Product updated successfully',
        [
          {
            text: t('ok') || 'OK',
            onPress: () => {
              // Navigate back - ProductDetailsScreen will refresh via useFocusEffect
              navigation.goBack();
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert(
        t('error') || 'Error',
        t('failed_to_update_product')
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!product) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: currentColors.background }]}>
        <Ionicons name="alert-circle" size={48} color={currentColors.error || '#ff4444'} />
        <Text style={[styles.errorText, { color: currentColors.textSecondary }]}>
          {t('product_not_found') || 'Product not found'}
        </Text>
      </View>
    );
  }

  // Build image URL from GridFS ID
  const BASE_URL = api.defaults.baseURL;
  const imageUrl = product.image_gridfs_id
    ? `${BASE_URL}/products/image/${product.image_gridfs_id}`
    : null;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: currentColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            {/* Product Image (Not Editable) */}
            {imageUrl && (
              <View style={[styles.imageContainer, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
                {imageLoading && (
                  <View style={styles.imageLoader}>
                    <ActivityIndicator size="large" color={currentColors.primary} />
                  </View>
                )}
                {imageError ? (
                  <View style={styles.imageErrorContainer}>
                    <Ionicons name="image-outline" size={64} color={currentColors.textSecondary} />
                    <Text style={[styles.imageErrorText, { color: currentColors.textSecondary }]}>
                      {t('image_not_available') || 'Image not available'}
                    </Text>
                  </View>
                ) : (
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.productImage}
                    resizeMode="cover"
                    onLoadStart={() => setImageLoading(true)}
                    onLoadEnd={() => setImageLoading(false)}
                    onError={() => {
                      setImageLoading(false);
                      setImageError(true);
                    }}
                  />
                )}
                <View style={[styles.imageNote, { backgroundColor: currentColors.background + 'E6' }]}>
                  <Ionicons name="information-circle-outline" size={16} color={currentColors.textSecondary} />
                  <Text style={[styles.imageNoteText, { color: currentColors.textSecondary }]}>
                    {t('image_not_editable') || 'Image is not editable'}
                  </Text>
                </View>
              </View>
            )}

            {/* Editable Form */}
            <View style={[styles.formCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
              {/* Product Name */}
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

              {/* Weight and Unit */}
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

              {/* Form */}
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

              {/* Use Type */}
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

              {/* Price */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: currentColors.text }]}>
                  {t('price') || 'Price'}
                </Text>
                <TextInput
                  value={price}
                  onChangeText={(text) => {
                    const numeric = text.replace(/[^0-9.]/g, '');
                    setPrice(numeric);
                    if (errors.price) {
                      setErrors({ ...errors, price: null });
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={currentColors.placeholder}
                  style={[
                    styles.input,
                    {
                      backgroundColor: currentColors.surface,
                      borderColor: errors.price ? '#ff4444' : currentColors.border,
                      color: currentColors.text,
                    },
                  ]}
                />
                {errors.price && (
                  <Text style={[styles.errorText, { color: '#ff4444' }]}>
                    {errors.price}
                  </Text>
                )}
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: currentColors.primary,
                    opacity: isSaving ? 0.6 : 1,
                  },
                ]}
                onPress={handleSave}
                disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.saveButtonText}>
                      {t('save_changes') || 'Save Changes'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>

      {/* Picker Modal */}
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imageLoader: {
    position: 'absolute',
    zIndex: 1,
  },
  imageErrorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  imageErrorText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  imageNote: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  imageNoteText: {
    fontSize: 12,
  },
  formCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
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
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 15,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonIcon: {
    marginRight: 0,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
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
});

