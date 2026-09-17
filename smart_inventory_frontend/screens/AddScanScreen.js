import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { classifyAPI } from '../services/api';

export default function AddScanScreen({ navigation }) {
  const { isDarkMode, colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute();
  const currentColors = isDarkMode ? colors.dark : colors.light;

  const [image, setImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);

  const scanAnim = useRef(new Animated.Value(0)).current;

  // Reset image when coming back from AddResult after cancel
  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.resetImage) {
        setImage(null);
        setIsScanning(false);
        // Clear the param
        navigation.setParams({ resetImage: undefined });
      }
    }, [route.params, navigation])
  );

  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      scanAnim.stopAnimation();
      scanAnim.setValue(0);
    }
  }, [isScanning, scanAnim]);

  const scanTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 252], // from top to bottom of the image (260h - small margin)
  });

  // Pick from gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert(t('permission_required'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Take a photo
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert(t('camera_permission_required'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 1 });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Clear selected image
  const clearImage = () => {
    setImage(null);
    setIsScanning(false);
  };

  // Detect & Add button handler
  const handleDetect = async () => {
    if (!image) return;

    setIsScanning(true);
    setError(null);
    
    try {
      // Call classification API
      const result = await classifyAPI.classifyImage(image);
      
      setIsScanning(false);
      
      // Navigate to AddResult screen with the classification result
      navigation.replace('AddResult', {
        imageUri: image,
        initialData: result,
      });
    } catch (err) {
      setIsScanning(false);
      setError(t('failed_to_classify_image'));

      Alert.alert(t('error'), t('failed_to_classify_image'), [
        {
          text: t('ok'),
          onPress: () => setError(null),
        },
      ]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: currentColors.surface,
            borderColor: currentColors.border,
          },
        ]}>
        <View style={styles.headerRow}>
          <View
            style={[styles.iconCircle, { backgroundColor: currentColors.primary + '20' }]}>
            <Ionicons
              name={isScanning ? 'scan-outline' : 'add-circle'}
              size={26}
              color={currentColors.primary}
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.title, { color: currentColors.text }]}>
              {(isScanning ? t('scanning_title') : t('add_item')) || 'Add New Item'}
            </Text>
            <Text style={[styles.subtitle, { color: currentColors.textSecondary }]}>
              {(isScanning ? t('scanning_subtitle') : t('add_item_hint')) ||
                'Upload or capture a pill photo to detect and save.'}
            </Text>
          </View>
        </View>

        {/* IMAGE SELECTED */}
        {image && (
          <View style={styles.imageWrapper}>
            <View style={styles.imageFrame}>
              <Image
                source={{ uri: image }}
                style={[styles.preview, isScanning && styles.previewDimmed]}
              />

              {isScanning && (
                <View style={styles.scanningOverlay}>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.scanningLine,
                      {
                        backgroundColor: currentColors.primary,
                        shadowColor: currentColors.primary,
                        transform: [{ translateY: scanTranslateY }],
                      },
                    ]}
                  />
                </View>
              )}
            </View>

            {/* CLEAR ICON */}
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                if (isScanning) {
                  Alert.alert(
                    t('cancel_scan_title') || 'Cancel detection?',
                    t('cancel_scan_message') || 'Do you want to stop scanning this image?',
                    [
                      {
                        text: t('keep_scanning') || 'Keep scanning',
                        style: 'cancel',
                      },
                      {
                        text: t('cancel') || 'Cancel',
                        style: 'destructive',
                        onPress: clearImage,
                      },
                    ],
                  );
                } else {
                  clearImage();
                }
              }}>
              <Ionicons name="close-circle" size={32} color={currentColors.error} />
            </TouchableOpacity>
          </View>
        )}

        {/* BUTTONS (NO IMAGE SELECTED) */}
        {!image && !isScanning && (
          <View style={styles.actionsColumn}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: currentColors.primary,
                },
              ]}
              onPress={pickImage}>
              <Ionicons name="image-outline" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>
                {t('pick_from_gallery') || 'Pick From Gallery'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.outlineButton,
                {
                  borderColor: currentColors.primary,
                },
              ]}
              onPress={takePhoto}>
              <Ionicons
                name="camera-outline"
                size={20}
                color={currentColors.primary}
                style={styles.buttonIcon}
              />
              <Text style={[styles.outlineButtonText, { color: currentColors.primary }]}>
                {t('take_photo') || 'Take Photo'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* DETECT & ADD BUTTON (ONLY IF IMAGE SELECTED) */}
        {image && !isScanning && (
          <TouchableOpacity
            style={[styles.detectButton, { backgroundColor: currentColors.primary }]}
            onPress={handleDetect}>
            <Ionicons name="scan-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>
              {t('detect_and_add') || 'Detect & Add'}
            </Text>
          </TouchableOpacity>
        )}

        {/* SCANNING STATE INFO */}
        {isScanning && (
          <View style={styles.scanningRow}>
            <ActivityIndicator size="small" color={currentColors.primary} />
            <Text style={[styles.scanningText, { color: currentColors.textSecondary }]}>
              {t('scanning_status') || 'Detecting your pill...'}
            </Text>
          </View>
        )}

        {/* ERROR MESSAGE */}
        {error && !isScanning && (
          <View style={styles.errorRow}>
            <Text style={[styles.errorText, { color: currentColors.error || '#ff4444' }]}>
              {error}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: 20,
    alignItems: 'center',
  },
  imageFrame: {
    width: 260,
    height: 260,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  preview: {
    width: 260,
    height: 260,
    borderRadius: 18,
    resizeMode: 'cover',
  },
  previewDimmed: {
    opacity: 0.4,
  },
  clearButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 2,
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  scanningLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 4,
    opacity: 0.9,
    shadowOpacity: 0.7,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  actionsColumn: {
    marginTop: 8,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  detectButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  outlineButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  scanningRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scanningText: {
    fontSize: 14,
  },
  errorRow: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
});


