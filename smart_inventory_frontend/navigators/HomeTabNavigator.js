import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import AddScreen from '../screens/AddScreen';
import DataScreen from '../screens/DataScreen';
import HistoryScreen from '../screens/HistoryScreen';

const Tab = createBottomTabNavigator();

function FloatingBubble({ currentColors }) {
  const bubbleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(bubbleAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(bubbleAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const scale = bubbleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.5],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: currentColors.primary,
        opacity: opacityAnim,
        transform: [{ scale }],
      }}
    />
  );
}

export default function HomeTabNavigator() {
  const { t } = useTranslation();
  const { isDarkMode, colors } = useTheme();
  const currentColors = isDarkMode ? colors.dark : colors.light;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const startRotation = () => {
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: rotateAnim._value + 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: ['0deg', '360deg', '720deg', '1080deg', '1440deg'],
  });

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: currentColors.primary,
        tabBarInactiveTintColor: currentColors.textSecondary,
        tabBarStyle: {
          backgroundColor: currentColors.surface,
          borderTopColor: currentColors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Data') iconName = 'grid-outline';
          else if (route.name === 'History') iconName = 'time-outline';
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}>
      <Tab.Screen
        name="Data"
        component={DataScreen}
        options={{
          tabBarLabel: t('tab_data'),
        }}
      />
      <Tab.Screen
        name="Add"
        component={AddScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ color, size }) => (
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: currentColors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: -50,
              elevation: 8,
              shadowColor: currentColors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}>
              <FloatingBubble currentColors={currentColors} />
              <Animated.View style={{ 
                transform: [{ rotate: rotation }, { scale: scaleAnim }],
                zIndex: 10,
              }}>
                <Ionicons name="add" size={32} color="#fff" />
              </Animated.View>
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: () => startRotation(),
        })}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: t('tab_history'),
        }}
      />
    </Tab.Navigator>
  );
}