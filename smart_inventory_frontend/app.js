import React from 'react';
import { AppRegistry, Alert, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ProductProvider } from './contexts/ProductContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './screens/LoginScreen';
import HomeTabNavigator from './navigators/HomeTabNavigator';
import SettingsScreen from './screens/SettingsScreen';
import AddResultScreen from './screens/AddResultScreen';
import AddPriceScreen from './screens/AddPriceScreen';
import AddExistingProductScreen from './screens/AddExistingProductScreen';
import ProductDetailsScreen from './screens/ProductDetailsScreen';
import EditProductScreen from './screens/EditProductScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  const { isDarkMode, colors } = useTheme();
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const currentColors = isDarkMode ? colors.dark : colors.light;

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: currentColors.background }}>
        <ActivityIndicator size="large" color={currentColors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? "Home" : "Login"}
      screenOptions={{
        headerStyle: {
          backgroundColor: currentColors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Home" 
        component={HomeTabNavigator}
        options={({ navigation }) => ({ 
          title: t('app_title'),
          headerBackVisible: false,
          
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={{ marginRight: 15 }}>
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={({ navigation }) => ({ 
          title: t('settings'),
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
        })}
      />
      <Stack.Screen 
        name="AddResult" 
        component={AddResultScreen}
        options={({ navigation, route }) => ({ 
          title: t('review_item'),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  t('cancel_review_title') || 'Cancel?',
                  t('cancel_review_message') || 'Do you want to cancel and reset the picked image?',
                  [
                    {
                      text: t('no') || 'No',
                      style: 'cancel',
                    },
                    {
                      text: t('yes_cancel') || 'Yes, Cancel',
                      style: 'destructive',
                      onPress: () => {
                        navigation.replace('Home', { 
                          screen: 'Add',
                          params: { resetImage: true }
                        });
                      },
                    },
                  ],
                );
              }}
              style={{ marginLeft: 15 }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="AddPrice" 
        component={AddPriceScreen}
        options={({ navigation }) => ({ 
          title: t('price_prediction') || 'Price Prediction',
          headerStyle: {
            backgroundColor: currentColors.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  t('cancel_price_prediction') || 'Cancel Price Prediction?',
                  t('cancel_price_prediction_message') || 'Are you sure you want to cancel? Your progress will be lost.',
                  [
                    {
                      text: t('no') || 'No',
                      style: 'cancel',
                    },
                    {
                      text: t('yes_cancel') || 'Yes, Cancel',
                      style: 'destructive',
                      onPress: () => {
                        // Navigate to Home Data screen and cancel operation
                        navigation.replace('Home', { screen: 'Data' });
                      },
                    },
                  ]
                );
              }}
              style={{ marginLeft: 15 }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="AddExistingProduct" 
        component={AddExistingProductScreen}
        options={({ navigation }) => ({ 
          title: t('add_quantity') || 'Add Quantity',
          headerStyle: {
            backgroundColor: currentColors.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  t('cancel') || 'Cancel?',
                  t('cancel_message') || 'Are you sure you want to cancel?',
                  [
                    {
                      text: t('no') || 'No',
                      style: 'cancel',
                    },
                    {
                      text: t('yes_cancel') || 'Yes, Cancel',
                      style: 'destructive',
                      onPress: () => {
                        navigation.replace('Home', { screen: 'Data' });
                      },
                    },
                  ]
                );
              }}
              style={{ marginLeft: 15 }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="ProductDetails" 
        component={ProductDetailsScreen}
        options={({ navigation, route }) => ({ 
          title: t('product_details') || 'Product Details',
          headerStyle: {
            backgroundColor: currentColors.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.replace('Home', { screen: 'Data' })}
              style={{ marginLeft: 15 }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('EditProduct', { product: route.params?.product })}
              style={{ marginRight: 15 }}>
              <Ionicons name="create-outline" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="EditProduct" 
        component={EditProductScreen}
        options={({ navigation }) => ({ 
          title: t('edit_product') || 'Edit Product',
          headerStyle: {
            backgroundColor: currentColors.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  t('cancel_edit') || 'Cancel Edit?',
                  t('cancel_edit_message') || 'Are you sure you want to cancel? Your changes will be lost.',
                  [
                    {
                      text: t('no') || 'No',
                      style: 'cancel',
                    },
                    {
                      text: t('yes_cancel') || 'Yes, Cancel',
                      style: 'destructive',
                      onPress: () => {
                        navigation.goBack();
                      },
                    },
                  ]
                );
              }}
              style={{ marginLeft: 15 }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
}

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <ProductProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </ProductProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

AppRegistry.registerComponent('main', () => App);

