import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { productsAPI } from '../services/api';
import api from '../services/api';

export default function ProductDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { isDarkMode, colors } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const currentColors = isDarkMode ? colors.dark : colors.light;

  const initialProduct = route.params?.product;
  const [product, setProduct] = useState(initialProduct);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Remove quantity modal state
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeQuantity, setRemoveQuantity] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);
  const [quantityError, setQuantityError] = useState(null);
  
  // Delete product state
  const [isDeleting, setIsDeleting] = useState(false);

  // Refresh product data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const refreshProduct = async () => {
        // Get product from route params (may be updated)
        const routeProduct = route.params?.product;
        const productToUse = product || routeProduct;
        const productId = productToUse?.product_id || productToUse?._id;
        if (!productId) return;
        
        setIsRefreshing(true);
        try {
          // Fetch all products and find the one matching our product_id
          const allProducts = await productsAPI.getAllProducts();
          const updatedProduct = allProducts.find(
            (p) => (p.product_id && p.product_id === productId) || 
                   (p._id && p._id === productId)
          );
          
          if (updatedProduct) {
            setProduct(updatedProduct);
            // Reset image loading state when product updates
            setImageLoading(true);
            setImageError(false);
          }
        } catch (err) {
          console.error('Error refreshing product:', err);
          // Don't show error to user, just keep existing product data
        } finally {
          setIsRefreshing(false);
        }
      };

      refreshProduct();
    }, [route.params?.product]) // Refresh when route params change
  );

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

  const handleRemoveQuantity = async () => {
    const quantity = parseInt(removeQuantity);
    
    // Validation
    if (!removeQuantity || quantity <= 0) {
      setQuantityError(t('quantity_input_required'));
      return;
    }
    
    if (quantity > (product.quantity || 0)) {
      setQuantityError(t('quantity_exceeds_stock') || 'Quantity cannot exceed current stock');
      return;
    }
    
    if (!user || !user.username) {
      Alert.alert(
        t('error') || 'Error',
        t('login_required') || 'Please login to remove quantity'
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
    
    setIsRemoving(true);
    setQuantityError(null);
    
    try {
      const result = await productsAPI.removeQuantity(
        product.product_id,
        quantity,
        user.username
      );
      
      Alert.alert(
        t('success') || 'Success',
        t('quantity_removed_with_remaining', {
          count: quantity,
          remaining: result.new_quantity,
        }),
        [
          {
            text: t('ok') || 'OK',
            onPress: async () => {
              // Refresh product data
              try {
                const allProducts = await productsAPI.getAllProducts();
                const updatedProduct = allProducts.find(
                  (p) => (p.product_id && p.product_id === product.product_id) || 
                         (p._id && p._id === product._id)
                );
                
                if (updatedProduct) {
                  setProduct(updatedProduct);
                }
              } catch (err) {
                console.error('Error refreshing product:', err);
              }
              
              setShowRemoveModal(false);
              setRemoveQuantity('');
              setQuantityError(null);
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert(
        t('error') || 'Error',
        err.message || t('failed_to_remove_quantity') || 'Failed to remove quantity. Please try again.'
      );
    } finally {
      setIsRemoving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!user || !user.username) {
      Alert.alert(
        t('error') || 'Error',
        t('login_required') || 'Please login to delete products'
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
    
    setIsDeleting(true);
    
    try {
      await productsAPI.deleteProduct(product.product_id, user.username);
      
      Alert.alert(
        t('success') || 'Success',
        t('product_deleted_successfully') || 'Product deleted successfully',
        [
          {
            text: t('ok') || 'OK',
            onPress: () => {
              // Navigate back to Data screen
              navigation.replace('Home', { screen: 'Data' });
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert(
        t('error') || 'Error',
        err.message || t('failed_to_delete_product') || 'Failed to delete product. Please try again.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
    <ScrollView
      style={[styles.container, { backgroundColor: currentColors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={async () => {
            if (!product?.product_id) return;
            
            setIsRefreshing(true);
            try {
              const allProducts = await productsAPI.getAllProducts();
              const updatedProduct = allProducts.find(
                (p) => p.product_id === product.product_id || p._id === product._id
              );
              
              if (updatedProduct) {
                setProduct(updatedProduct);
                setImageLoading(true);
                setImageError(false);
              }
            } catch (err) {
              console.error('Error refreshing product:', err);
            } finally {
              setIsRefreshing(false);
            }
          }}
          tintColor={currentColors.primary}
        />
      }>
      {/* Product Image */}
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
        </View>
      )}

      {/* Product Details */}
      <View style={[styles.detailsCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
        {/* Product Name */}
        <View style={styles.detailRow}>
          <View style={styles.detailHeader}>
            <Ionicons name="cube-outline" size={20} color={currentColors.primary} />
            <Text style={[styles.detailLabel, { color: currentColors.textSecondary }]}>
              {t('product_name') || 'Product Name'}
            </Text>
          </View>
          <Text style={[styles.detailValue, { color: currentColors.text }]}>
            {product.product_name}
          </Text>
        </View>

        {/* Weight */}
        <View style={styles.detailRow}>
          <View style={styles.detailHeader}>
            <Ionicons name="scale-outline" size={20} color={currentColors.primary} />
            <Text style={[styles.detailLabel, { color: currentColors.textSecondary }]}>
              {t('weight') || 'Weight'}
            </Text>
          </View>
          <Text style={[styles.detailValue, { color: currentColors.text }]}>
            {product.weight_num} {product.weight_unit}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.detailRow}>
          <View style={styles.detailHeader}>
            <Ionicons name="medical-outline" size={20} color={currentColors.primary} />
            <Text style={[styles.detailLabel, { color: currentColors.textSecondary }]}>
              {t('form') || 'Form'}
            </Text>
          </View>
          <Text style={[styles.detailValue, { color: currentColors.text }]}>
            {product.form}
          </Text>
        </View>

        {/* Use Type */}
        <View style={styles.detailRow}>
          <View style={styles.detailHeader}>
            <Ionicons name="bandage-outline" size={20} color={currentColors.primary} />
            <Text style={[styles.detailLabel, { color: currentColors.textSecondary }]}>
              {t('use_type') || 'Use Type'}
            </Text>
          </View>
          <Text style={[styles.detailValue, { color: currentColors.text }]}>
            {product.use_type}
          </Text>
        </View>

        {/* Price */}
        <View style={[styles.detailRow, styles.highlightRow, { backgroundColor: currentColors.primary + '10' }]}>
          <View style={styles.detailHeader}>
            <Ionicons name="cash-outline" size={20} color={currentColors.primary} />
            <Text style={[styles.detailLabel, { color: currentColors.textSecondary }]}>
              {t('price') || 'Price'}
            </Text>
          </View>
          <Text style={[styles.detailValue, styles.priceValue, { color: currentColors.primary }]}>
            ${product.price?.toFixed(2) || '0.00'}
          </Text>
        </View>

        {/* Quantity */}
        <View style={[styles.detailRow, styles.highlightRow, { backgroundColor: currentColors.primary + '10' }]}>
          <View style={styles.detailHeader}>
            <Ionicons name="layers-outline" size={20} color={currentColors.primary} />
            <Text style={[styles.detailLabel, { color: currentColors.textSecondary }]}>
              {t('quantity') || 'Quantity'}
            </Text>
          </View>
          {(product.quantity || 0) === 0 ? (
            <View style={styles.soldOutContainer}>
              <Text style={[styles.soldOutText, { color: currentColors.error || '#ff4444' }]}>
                {t('sold_out') || 'Sold Out'}
              </Text>
            </View>
          ) : (
            <Text style={[styles.detailValue, styles.quantityValue, { color: currentColors.primary }]}>
              {product.quantity || 0}
            </Text>
          )}
        </View>

        {/* Created Date */}
        {product.created_at && (
          <View style={styles.detailRow}>
            <View style={styles.detailHeader}>
              <Ionicons name="calendar-outline" size={20} color={currentColors.textSecondary} />
              <Text style={[styles.detailLabel, { color: currentColors.textSecondary }]}>
                {t('created_at') || 'Created At'}
              </Text>
            </View>
            <Text style={[styles.detailValue, { color: currentColors.text }]}>
              {new Date(product.created_at).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionButtonsRow}>
        {/* Remove Quantity Button - Only show if quantity > 0 */}
        {(product.quantity || 0) > 0 ? (
          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: '#FF9800' }]}
            onPress={() => setShowRemoveModal(true)}
            activeOpacity={0.8}>
            <Ionicons name="remove-circle-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.removeButtonText}>
              {t('remove_quantity') || 'Remove Quantity'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.removeButtonPlaceholder} />
        )}

        {/* Delete Product Button */}
        <TouchableOpacity
          style={[
            styles.deleteButton,
            { backgroundColor: currentColors.error || '#ff4444', opacity: isDeleting ? 0.6 : 1 },
          ]}
          onPress={() => {
            Alert.alert(
              t('delete_product') || 'Delete Product',
              t('delete_product_confirmation') || 'Are you sure you want to delete this product? This action cannot be undone.',
              [
                {
                  text: t('cancel') || 'Cancel',
                  style: 'cancel',
                },
                {
                  text: t('delete') || 'Delete',
                  style: 'destructive',
                  onPress: handleDeleteProduct,
                },
              ]
            );
          }}
          activeOpacity={0.8}
          disabled={isDeleting}>
          {isDeleting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.deleteButtonText}>
                {t('delete_product') || 'Delete Product'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>

    {/* Remove Quantity Modal */}
    <Modal
      visible={showRemoveModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowRemoveModal(false)}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowRemoveModal(false)}
          style={styles.modalBackdrop}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[styles.modalContent, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: currentColors.text }]}>
                {t('remove_quantity') || 'Remove Quantity'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowRemoveModal(false);
                  setRemoveQuantity('');
                  setQuantityError(null);
                }}>
                <Ionicons name="close" size={24} color={currentColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDescription, { color: currentColors.textSecondary }]}>
              {t('remove_quantity_description') || 'Enter the quantity you want to remove from this product.'}
            </Text>

            <Text style={[styles.currentQuantityLabel, { color: currentColors.text }]}>
              {t('current_quantity') || 'Current Quantity'}: 
              <Text style={[styles.currentQuantityValue, { color: currentColors.primary }]}>
                {' '}{product.quantity || 0}
              </Text>
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: currentColors.text }]}>
                {t('quantity_to_remove') || 'Quantity to Remove'}
              </Text>
              <TextInput
                value={removeQuantity}
                onChangeText={(text) => {
                  const numeric = text.replace(/[^0-9]/g, '');
                  setRemoveQuantity(numeric);
                  setQuantityError(null);
                }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={currentColors.placeholder}
                style={[
                  styles.quantityInput,
                  {
                    backgroundColor: currentColors.surface,
                    borderColor: quantityError ? '#ff4444' : currentColors.border,
                    color: currentColors.text,
                  },
                ]}
                autoFocus
              />
              {quantityError && (
                <Text style={styles.errorText}>{quantityError}</Text>
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: currentColors.border }]}
                onPress={() => {
                  setShowRemoveModal(false);
                  setRemoveQuantity('');
                  setQuantityError(null);
                }}>
                <Text style={[styles.modalButtonText, { color: currentColors.text }]}>
                  {t('cancel') || 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                  { backgroundColor: currentColors.error || '#ff4444', opacity: isRemoving ? 0.6 : 1 },
                ]}
                onPress={handleRemoveQuantity}
                disabled={isRemoving}>
                {isRemoving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>
                    {t('remove') || 'Remove'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
    </>
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
  detailsCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  detailRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  highlightRow: {
    borderRadius: 12,
    paddingHorizontal: 12,
    marginVertical: 4,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 28,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  soldOutContainer: {
    marginLeft: 28,
  },
  soldOutText: {
    fontSize: 24,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: 20,
    marginHorizontal: 0,
    marginBottom: 20,
    gap: 12,
  },
  removeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  removeButtonPlaceholder: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonIcon: {
    marginRight: 0,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  currentQuantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  currentQuantityValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  quantityInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    // backgroundColor set inline
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

