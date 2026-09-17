import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, FlatList, Image, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { productsAPI } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

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

export default function DataScreen() {
  const { isDarkMode, colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const currentColors = isDarkMode ? colors.dark : colors.light;

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForm, setSelectedForm] = useState(null);
  const [selectedUseType, setSelectedUseType] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showUseTypeModal, setShowUseTypeModal] = useState(false);

  const loadProducts = async () => {
    try {
      setError(null);
      const data = await productsAPI.getAllProducts();
      setProducts(data);
    } catch (err) {
      setError(t('failed_to_load_products'));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  // Filter products based on search query, form, and use type
  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((product) => {
        const productName = (product.product_name || '').toLowerCase();
        const form = (product.form || '').toLowerCase();
        const useType = (product.use_type || '').toLowerCase();
        const weightUnit = (product.weight_unit || '').toLowerCase();
        
        return (
          productName.includes(query) ||
          form.includes(query) ||
          useType.includes(query) ||
          weightUnit.includes(query) ||
          String(product.weight_num || '').includes(query)
        );
      });
    }
    
    // Apply form filter
    if (selectedForm) {
      filtered = filtered.filter((product) => product.form === selectedForm);
    }
    
    // Apply use type filter
    if (selectedUseType) {
      filtered = filtered.filter((product) => product.use_type === selectedUseType);
    }
    
    return filtered;
  }, [products, searchQuery, selectedForm, selectedUseType]);
  
  const clearFilters = () => {
    setSelectedForm(null);
    setSelectedUseType(null);
    setSearchQuery('');
  };
  
  const hasActiveFilters = selectedForm || selectedUseType || searchQuery.trim();

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={[styles.productCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}
      onPress={() => navigation.replace('ProductDetails', { product: item })}
      activeOpacity={0.7}>
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: currentColors.text }]}>
          {item.product_name}
        </Text>
        <Text style={[styles.productDetails, { color: currentColors.textSecondary }]}>
          {item.weight_num} {item.weight_unit} • {item.form} • {item.use_type}
        </Text>
        <View style={styles.productMeta}>
          <Text style={[styles.productPrice, { color: currentColors.primary }]}>
            ${item.price?.toFixed(2) || '0.00'}
          </Text>
          {(item.quantity || 0) === 0 ? (
            <View style={[styles.soldOutBadge, { backgroundColor: (currentColors.error || '#ff4444') + '20', borderColor: currentColors.error || '#ff4444' }]}>
              <Text style={[styles.soldOutText, { color: currentColors.error || '#ff4444' }]}>
                {t('sold_out') || 'Sold Out'}
              </Text>
            </View>
          ) : (
            <Text style={[styles.productQuantity, { color: currentColors.primary }]}>
              Qty: {item.quantity || 0}
            </Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={currentColors.textSecondary} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: currentColors.background }]}>
        <ActivityIndicator size="large" color={currentColors.primary} />
        <Text style={[styles.loadingText, { color: currentColors.textSecondary }]}>
          {t('loading_products') || 'Loading products...'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: currentColors.background }]}>
        <Ionicons name="alert-circle" size={48} color={currentColors.error || '#ff4444'} />
        <Text style={[styles.errorText, { color: currentColors.textSecondary }]}>{error}</Text>
        <Text style={[styles.retryText, { color: currentColors.primary }]} onPress={loadProducts}>
          {t('retry') || 'Tap to retry'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
        <Ionicons name="search" size={20} color={currentColors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: currentColors.text }]}
          placeholder={t('search_products') || 'Search products...'}
          placeholderTextColor={currentColors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={currentColors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: selectedForm ? currentColors.primary : currentColors.surface,
              borderColor: selectedForm ? currentColors.primary : currentColors.border,
            },
          ]}
          onPress={() => setShowFormModal(true)}>
          <Ionicons
            name="medical-outline"
            size={16}
            color={selectedForm ? '#fff' : currentColors.textSecondary}
          />
          <Text
            style={[
              styles.filterButtonText,
              { color: selectedForm ? '#fff' : currentColors.text },
            ]}>
            {selectedForm || t('form') || 'Form'}
          </Text>
          {selectedForm && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                setSelectedForm(null);
              }}
              style={styles.filterClearButton}>
              <Ionicons name="close-circle" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: selectedUseType ? currentColors.primary : currentColors.surface,
              borderColor: selectedUseType ? currentColors.primary : currentColors.border,
            },
          ]}
          onPress={() => setShowUseTypeModal(true)}>
          <Ionicons
            name="bandage-outline"
            size={16}
            color={selectedUseType ? '#fff' : currentColors.textSecondary}
          />
          <Text
            style={[
              styles.filterButtonText,
              { color: selectedUseType ? '#fff' : currentColors.text },
            ]}>
            {selectedUseType || t('use_type') || 'Use Type'}
          </Text>
          {selectedUseType && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                setSelectedUseType(null);
              }}
              style={styles.filterClearButton}>
              <Ionicons name="close-circle" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {hasActiveFilters && (
          <TouchableOpacity
            style={[styles.clearFiltersButton, { borderColor: currentColors.border }]}
            onPress={clearFilters}>
            <Ionicons name="close" size={16} color={currentColors.textSecondary} />
            <Text style={[styles.clearFiltersText, { color: currentColors.textSecondary }]}>
              {t('clear_filters') || 'Clear'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item._id || item.product_id || Math.random().toString()}
        contentContainerStyle={
          filteredProducts.length === 0
            ? styles.listContentEmpty
            : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={currentColors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={hasActiveFilters ? "search-outline" : "cube-outline"} 
              size={64} 
              color={currentColors.textSecondary} 
            />
            <Text style={[styles.emptyText, { color: currentColors.textSecondary }]}>
              {hasActiveFilters
                ? t('no_results') || 'No products found'
                : t('no_products') || 'No products yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: currentColors.textSecondary }]}>
              {hasActiveFilters
                ? t('try_different_filters') || 'Try different filters or search terms'
                : t('add_first_product') || 'Add your first product to get started'}
            </Text>
          </View>
        }
      />

      {/* Form Filter Modal */}
      <Modal
        visible={showFormModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFormModal(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowFormModal(false)}
          style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: currentColors.surface, borderColor: currentColors.border },
            ]}>
            <Text style={[styles.modalTitle, { color: currentColors.text }]}>
              {t('filter_by_form') || 'Filter by Form'}
            </Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setSelectedForm(null);
                  setShowFormModal(false);
                }}>
                <Text style={[styles.modalOptionText, { color: currentColors.text }]}>
                  {t('all') || 'All'}
                </Text>
              </TouchableOpacity>
              {FORMS.map((form) => (
                <TouchableOpacity
                  key={form}
                  style={styles.modalOption}
                  onPress={() => {
                    setSelectedForm(form);
                    setShowFormModal(false);
                  }}>
                  <Text style={[styles.modalOptionText, { color: currentColors.text }]}>
                    {form}
                  </Text>
                  {selectedForm === form && (
                    <Ionicons name="checkmark" size={20} color={currentColors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Use Type Filter Modal */}
      <Modal
        visible={showUseTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUseTypeModal(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowUseTypeModal(false)}
          style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: currentColors.surface, borderColor: currentColors.border },
            ]}>
            <Text style={[styles.modalTitle, { color: currentColors.text }]}>
              {t('filter_by_use_type') || 'Filter by Use Type'}
            </Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setSelectedUseType(null);
                  setShowUseTypeModal(false);
                }}>
                <Text style={[styles.modalOptionText, { color: currentColors.text }]}>
                  {t('all') || 'All'}
                </Text>
              </TouchableOpacity>
              {USE_TYPES.map((useType) => (
                <TouchableOpacity
                  key={useType}
                  style={styles.modalOption}
                  onPress={() => {
                    setSelectedUseType(useType);
                    setShowUseTypeModal(false);
                  }}>
                  <Text style={[styles.modalOptionText, { color: currentColors.text }]}>
                    {useType}
                  </Text>
                  {selectedUseType === useType && (
                    <Ionicons name="checkmark" size={20} color={currentColors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    flex: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  filterClearButton: {
    marginLeft: 4,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalOptionText: {
    fontSize: 15,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  productCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  productDetails: {
    fontSize: 14,
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '700',
  },
  productQuantity: {
    fontSize: 14,
  },
  soldOutBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  soldOutText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

