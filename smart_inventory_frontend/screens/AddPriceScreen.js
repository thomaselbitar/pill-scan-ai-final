import React, { useEffect, useState, useRef } from 'react';
import { Animated, Easing, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useProduct } from '../contexts/ProductContext';
import { useAuth } from '../contexts/AuthContext';
import { priceAPI, productsAPI } from '../services/api';
import { Alert } from 'react-native';

export default function AddPriceScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { isDarkMode, colors } = useTheme();
  const { t } = useTranslation();
  const { productData, productImage, clearProduct } = useProduct();
  const { user } = useAuth();
  const currentColors = isDarkMode ? colors.dark : colors.light;

  const [isLoading, setIsLoading] = useState(true);
  const [priceData, setPriceData] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [errors, setErrors] = useState({});
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressTimerRef = useRef(null);

  const steps = [
    { message: t('checking_product') || 'Checking product...', progress: 25 },
    { message: t('checking_market') || 'Checking market...', progress: 50 },
    { message: t('comparing_product') || 'Comparing product...', progress: 75 },
    { message: t('calculating_price') || 'Calculating price...', progress: 100 },
  ];

  useEffect(() => {
    // Price prediction API call
    const predictPrice = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setProgress(0);
        setCurrentStep(0);

        // Smooth continuous progress animation
        const totalDuration = 4000; // 4 seconds total
        const progressInterval = 16; // Update every ~16ms (60fps) for smoothness
        
        // Start smooth animation to 100% with easing
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: totalDuration,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start();
        
        // Update progress and step messages smoothly
        const startTime = Date.now();
        let progressComplete = false;
        
        progressTimerRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const currentProgress = Math.min((elapsed / totalDuration) * 100, 100);
          
          if (currentProgress >= 100 && !progressComplete) {
            progressComplete = true;
            setProgress(100);
            setCurrentStep(3);
            if (progressTimerRef.current) {
              clearInterval(progressTimerRef.current);
              progressTimerRef.current = null;
            }
          } else {
            setProgress(Math.min(Math.round(currentProgress), 100));
            
            // Update step message based on progress
            if (currentProgress <= 25) {
              setCurrentStep(0);
            } else if (currentProgress <= 50) {
              setCurrentStep(1);
            } else if (currentProgress <= 75) {
              setCurrentStep(2);
            } else {
              setCurrentStep(3);
            }
          }
        }, progressInterval);

        // Call price prediction API
        const response = await priceAPI.predictPrice(productData);
        
        // Wait for progress animation to complete
        await new Promise((resolve) => {
          setTimeout(() => {
            // Ensure progress is at 100%
            setProgress(100);
            setCurrentStep(3);
            resolve();
          }, totalDuration);
        });

        // Set price data
        setPriceData({
          price: response.predicted_price,
          currency: 'USD', // You can modify this based on your backend response
        });
        setPrice(String(response.predicted_price));
        setIsLoading(false);
      } catch (err) {
        setError(t('failed_to_predict_price'));
        setIsLoading(false);
      }
    };

    if (productData) {
      predictPrice();
    } else {
      // If no product data, go back
      //navigation.goBack();
    }
    
    // Cleanup function
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [productData, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          nestedScrollEnabled={true}
          bounces={true}>
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
              <Ionicons 
                name={isLoading ? "hourglass-outline" : error ? "close-circle" : "checkmark-circle"} 
                size={26} 
                color={currentColors.primary} 
              />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.title, { color: currentColors.text }]}>
                {isLoading 
                  ? (t('predicting_price') || 'Predicting price...')
                  : error
                  ? (t('error') || 'Error')
                  : (t('price_predicted') || 'Price predicted')}
              </Text>
              <Text style={[styles.subtitle, { color: currentColors.textSecondary }]}>
                {isLoading
                  ? (t('predicting_price_hint') || 'Please wait while we analyze the product data')
                  : error
                  ? error
                  : t('price_predicted_hint')}
              </Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {isLoading ? (
            <>
              {/* Product Image and Name */}
              {productImage && (
                <View style={styles.productInfoContainer}>
                  <View style={[styles.productImageContainer, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
                    <Image source={{ uri: productImage }} style={styles.productImage} resizeMode="cover" />
                  </View>
                  {productData?.product_name && (
                    <Text style={[styles.productName, { color: currentColors.text }]}>
                      {productData.product_name}
                    </Text>
                  )}
                </View>
              )}
              
              <View style={styles.progressContainer}>
                {/* Linear Progress Bar */}
                <View style={styles.progressBarContainer}>
                  {/* Percentage text */}
                  <Text style={[styles.progressText, { color: currentColors.primary }]}>
                    {progress}%
                  </Text>
                  
                  {/* Progress bar background */}
                  <View style={[styles.progressBarBackground, { backgroundColor: currentColors.border + '20' }]}>
                    {/* Progress bar fill */}
                    <Animated.View
                      style={[
                        styles.progressBarFill,
                        {
                          backgroundColor: currentColors.primary,
                          width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
              {/* Current step message */}
              <Text style={[styles.stepMessage, { color: currentColors.text }]}>
                {steps[currentStep]?.message || steps[0].message}
              </Text>
            </>
          ) : error ? (
            <>
              <View style={[styles.errorContainer, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
                <Ionicons name="alert-circle" size={48} color="#ff4444" />
                <Text style={[styles.errorMessage, { color: currentColors.textSecondary }]}>
                  {error}
                </Text>
              </View>
            </>
          ) : priceData ? (
            <>
              {/* Product Image and Name */}
              {productImage && (
                <View style={styles.productInfoContainer}>
                  <View style={[styles.productImageContainer, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
                    <Image source={{ uri: productImage }} style={styles.productImage} resizeMode="cover" />
                  </View>
                  {productData?.product_name && (
                    <Text style={[styles.productName, { color: currentColors.text }]}>
                      {productData.product_name}
                    </Text>
                  )}
                </View>
              )}
              
              <View style={[styles.formCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
                {/* Price Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: currentColors.text }]}>
                    {t('price') || 'Price'}
                  </Text>
                  <View style={[
                    styles.priceInputContainer,
                    { borderColor: errors.price ? '#ff4444' : currentColors.border }
                  ]}>
                    <Text style={[styles.currencySymbol, { color: currentColors.textSecondary }]}>
                      {priceData.currency}
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
                        styles.priceInput,
                        {
                          backgroundColor: currentColors.surface,
                          color: currentColors.text,
                        },
                      ]}
                    />
                  </View>
                  {errors.price && (
                    <Text style={[styles.errorText, { color: '#ff4444' }]}>
                      {errors.price}
                    </Text>
                  )}
                </View>

                {/* Quantity Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: currentColors.text }]}>
                    {t('quantity') || 'Quantity'}
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
                  style={[styles.addToStoreButton, { backgroundColor: currentColors.primary }]}
                  onPress={async () => {
                    // Validate inputs
                    const newErrors = {};
                    
                    if (!price || price.trim() === '' || parseFloat(price) <= 0) {
                      newErrors.price = t('price_required') || 'Price is required and must be greater than 0';
                    }
                    
                    if (!quantity || quantity.trim() === '' || parseInt(quantity) <= 0) {
                      newErrors.quantity = t('quantity_required') || 'Quantity is required and must be greater than 0';
                    }
                    
                    setErrors(newErrors);
                    
                    // If no errors, proceed
                    if (Object.keys(newErrors).length === 0) {
                      // Check if user is authenticated
                      if (!user || !user.username) {
                        Alert.alert(
                          t('error') || 'Error',
                          t('login_required') || 'Please login to add products'
                        );
                        return;
                      }

                      // Save product to backend
                      try {
                        setIsLoading(true);
                        const result = await productsAPI.addProduct(
                          productData,
                          productImage,
                          parseFloat(price),
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
                            result.status === 'created_new'
                              ? t('product_added')
                              : t('product_updated')
                          );
                        }, 500);
                      } catch (err) {
                        setIsLoading(false);
                        Alert.alert(
                          t('error') || 'Error',
                          t('failed_to_add_product')
                        );
                      }
                    }
                  }}>
                  <Text style={styles.addToStoreButtonText}>
                    {t('add_to_store') || 'Add to Store'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
  },
  progressBarBackground: {
    width: '100%',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  stepMessage: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  productInfoContainer: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  productImageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorContainer: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '100%',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  formCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    minWidth: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 0,
  },
  quantityInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  addToStoreButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  addToStoreButtonText: {
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

