import React, { useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useProduct } from '../contexts/ProductContext';
import { useAuth } from '../contexts/AuthContext';
import { productsAPI } from '../services/api';

export default function AddExistingProductScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { isDarkMode, colors } = useTheme();
  const { t } = useTranslation();
  const { productData, productImage, clearProduct } = useProduct();
  const { user } = useAuth();
  const currentColors = isDarkMode ? colors.dark : colors.light;

  const existingProduct = route.params?.existingProduct;
  const [quantity, setQuantity] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleAddQuantity = async () => {
    // Validate quantity
    if (!quantity || quantity.trim() === '' || parseInt(quantity) <= 0) {
      setErrors({ quantity: t('quantity_required') || 'Quantity is required and must be greater than 0' });
      return;
    }

    // Check if user is authenticated
    if (!user || !user.username) {
      Alert.alert(
        t('error') || 'Error',
        t('login_required') || 'Please login to add products'
      );
      return;
    }

    try {
      setIsLoading(true);
      
      // Add product with new quantity (this will update existing product)
      const result = await productsAPI.addProduct(
        productData,
        productImage,
        existingProduct.price, // Use existing price
        parseInt(quantity),
        user.username
      );

      setIsLoading(false);

      // Clear product context
      clearProduct();

      // Navigate back to Home first (before showing alert)
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });

      // Show success message after navigation completes
      setTimeout(() => {
        Alert.alert(
          t('success') || 'Success',
          t('quantity_added_with_count', { count: quantity })
        );
      }, 500);
    } catch (err) {
      setIsLoading(false);
      Alert.alert(
        t('error') || 'Error',
        t('failed_to_add_quantity')
      );
    }
  };

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
        <TouchableOpacity onPress={Keyboard.dismiss} activeOpacity={1}>
          <View style={{ flex: 1 }}>
            {/* Header */}
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
                  <Ionicons name="information-circle" size={26} color={currentColors.primary} />
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={[styles.title, { color: currentColors.text }]}>
                    {t('product_already_exists') || 'Product Already Exists'}
                  </Text>
                  <Text style={[styles.subtitle, { color: currentColors.textSecondary }]}>
                    {t('product_already_exists_message') ||
                      'This product is already in your inventory. You can add more quantity.'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Product Info */}
            <View style={[styles.productCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
              {/* Product Image */}
              {productImage && (
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: productImage }} style={styles.productImage} />
                </View>
              )}

              {/* Product Name */}
              {productData?.product_name && (
                <Text style={[styles.productName, { color: currentColors.text }]}>
                  {productData.product_name}
                </Text>
              )}

              {/* Product Details */}
              <View style={styles.detailsRow}>
                <Text style={[styles.detailLabel, { color: currentColors.textSecondary }]}>
                  {t('weight') || 'Weight'}:
                </Text>
                <Text style={[styles.detailValue, { color: currentColors.text }]}>
                  {productData?.weight_num} {productData?.weight_unit}
                </Text>
              </View>

              <View style={styles.detailsRow}>
                <Text style={[styles.detailLabel, { color: currentColors.textSecondary }]}>
                  {t('form') || 'Form'}:
                </Text>
                <Text style={[styles.detailValue, { color: currentColors.text }]}>
                  {productData?.form}
                </Text>
              </View>

              <View style={styles.detailsRow}>
                <Text style={[styles.detailLabel, { color: currentColors.textSecondary }]}>
                  {t('use_type') || 'Use Type'}:
                </Text>
                <Text style={[styles.detailValue, { color: currentColors.text }]}>
                  {productData?.use_type}
                </Text>
              </View>

              {/* Existing Price */}
              <View style={[styles.priceContainer, { backgroundColor: currentColors.primary + '10', borderColor: currentColors.primary + '30' }]}>
                <Text style={[styles.priceLabel, { color: currentColors.textSecondary }]}>
                  {t('price') || 'Price'}:
                </Text>
                <Text style={[styles.priceValue, { color: currentColors.primary }]}>
                  ${existingProduct?.price?.toFixed(2) || '0.00'}
                </Text>
              </View>

              {/* Current Quantity */}
              <View style={styles.detailsRow}>
                <Text style={[styles.detailLabel, { color: currentColors.textSecondary }]}>
                  {t('quantity') || 'Quantity'}:
                </Text>
                <Text style={[styles.detailValue, { color: currentColors.text }]}>
                  {existingProduct?.quantity || 0}
                </Text>
              </View>
            </View>

            {/* Quantity Input */}
            <View style={[styles.formCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: currentColors.text }]}>
                  {t('add_quantity') || 'Add Quantity'}
                </Text>
                <TextInput
                  value={quantity}
                  onChangeText={(text) => {
                    const numeric = text.replace(/[^0-9]/g, '');
                    setQuantity(numeric);
                    if (errors.quantity) {
                      setErrors({ ...errors, quantity: null });
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor={currentColors.placeholder}
                  style={[
                    styles.quantityInput,
                    {
                      backgroundColor: currentColors.surface,
                      borderColor: errors.quantity ? '#ff4444' : currentColors.border,
                      color: currentColors.text,
                    },
                  ]}
                />
                {errors.quantity && (
                  <Text style={[styles.errorText, { color: '#ff4444' }]}>
                    {errors.quantity}
                  </Text>
                )}
              </View>

              {/* Add to Store Button */}
              <TouchableOpacity
                style={[
                  styles.addButton,
                  {
                    backgroundColor: currentColors.primary,
                    opacity: isLoading ? 0.6 : 1,
                  },
                ]}
                onPress={handleAddQuantity}
                disabled={isLoading}>
                <Text style={styles.addButtonText}>
                  {isLoading
                    ? (t('adding') || 'Adding...')
                    : t('add_to_store') || 'Add to Store'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 40,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
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
  productCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  imageWrapper: {
    marginBottom: 16,
  },
  productImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  priceContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  formCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  quantityInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  addButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

