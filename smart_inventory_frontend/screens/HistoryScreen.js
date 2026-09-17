import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { productsAPI } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen() {
  const { isDarkMode, colors } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const currentColors = isDarkMode ? colors.dark : colors.light;

  const [logs, setLogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    if (!user || !user.username) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      // Fetch both logs and products from backend
      const [logsData, productsData] = await Promise.all([
        productsAPI.getLogs(user.username),
        productsAPI.getAllProducts(),
      ]);
      
      // Only set data if we got valid responses
      if (Array.isArray(logsData)) {
        setLogs(logsData);
      } else {
        setLogs([]);
      }
      
      if (Array.isArray(productsData)) {
        setProducts(productsData);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Error loading activity logs:', err);
      setError(t('failed_to_load_activity_logs'));
      setLogs([]);
      setProducts([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filter and process activity logs
  const activityLogs = useMemo(() => {
    // Filter only ADD_STOCK and REMOVE_STOCK actions
    const filtered = logs.filter(
      (log) => log.action === 'ADD_STOCK' || log.action === 'REMOVE_STOCK'
    );

    // Map logs with product names
    return filtered.map((log) => {
      // Try to get product name from:
      // 1. Direct product_name field in log (if backend includes it)
      // 2. Product lookup by product_id
      // 3. old_data or new_data (might have product_name)
      let productName = log.product_name;
      
      if (!productName) {
        const product = products.find((p) => p.product_id === log.product_id);
        productName = product?.product_name;
      }
      
      if (!productName && log.old_data?.product_name) {
        productName = log.old_data.product_name;
      }
      
      if (!productName && log.new_data?.product_name) {
        productName = log.new_data.product_name;
      }
      
      // Get remaining quantity from new_data (after the change)
      const remainingQty = log.new_data?.quantity ?? log.old_data?.quantity ?? 0;
      
      return {
        ...log,
        product_name: productName || t('deleted_product') || 'Deleted Product',
        quantity_change: log.quantity_change || 0,
        remaining_quantity: remainingQty,
      };
    });
  }, [logs, products]);

  const renderLogItem = ({ item }) => {
    const isAdd = item.action === 'ADD_STOCK';
    const color = isAdd ? '#4CAF50' : '#ff4444'; // Green for add, red for remove
    const icon = isAdd ? 'add-circle' : 'remove-circle';
    // quantity_change is positive for ADD_STOCK, negative for REMOVE_STOCK
    const quantityChange = item.quantity_change || 0;
    const quantityText = isAdd
      ? `+${quantityChange}`
      : `${quantityChange}`; // Already negative for REMOVE_STOCK

    return (
      <View
        style={[
          styles.logCard,
          {
            backgroundColor: currentColors.surface,
            borderColor: currentColors.border,
            borderLeftWidth: 4,
            borderLeftColor: color,
          },
        ]}>
        <View style={styles.logHeader}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
          <View style={styles.logContent}>
            <Text style={[styles.productName, { color: currentColors.text }]}>
              {item.product_name}
            </Text>
            <View style={styles.logDetails}>
              <Text style={[styles.quantityChange, { color }]}>
                {quantityText}
              </Text>
              <Text style={[styles.separator, { color: currentColors.textSecondary }]}>
                •
              </Text>
              <Text style={[styles.remainingText, { color: currentColors.textSecondary }]}>
                {t('remaining') || 'Remaining'}: {item.remaining_quantity}
              </Text>
            </View>
          </View>
        </View>
        {item.timestamp && (
          <Text style={[styles.timestamp, { color: currentColors.textSecondary }]}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: currentColors.background }]}>
        <ActivityIndicator size="large" color={currentColors.primary} />
        <Text style={[styles.loadingText, { color: currentColors.textSecondary }]}>
          {t('loading_activity_logs') || 'Loading activity logs...'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: currentColors.background }]}>
        <Ionicons name="alert-circle" size={48} color={currentColors.error || '#ff4444'} />
        <Text style={[styles.errorText, { color: currentColors.textSecondary }]}>{error}</Text>
        <Text style={[styles.retryText, { color: currentColors.primary }]} onPress={loadData}>
          {t('retry') || 'Tap to retry'}
        </Text>
      </View>
    );
  }

  if (!user || !user.username) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: currentColors.background }]}>
        <Ionicons name="lock-closed-outline" size={48} color={currentColors.textSecondary} />
        <Text style={[styles.errorText, { color: currentColors.textSecondary }]}>
          {t('login_required_activity_logs')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      <FlatList
        data={activityLogs}
        renderItem={renderLogItem}
        keyExtractor={(item) => item._id || Math.random().toString()}
        contentContainerStyle={
          activityLogs.length === 0
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
            <Ionicons name="time-outline" size={64} color={currentColors.textSecondary} />
            <Text style={[styles.emptyText, { color: currentColors.textSecondary }]}>
              {t('no_activity_logs') || 'No activity logs yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: currentColors.textSecondary }]}>
              {t('activity_logs_will_appear') || 'Activity logs will appear here when you add or remove product quantities'}
            </Text>
          </View>
        }
      />
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
    padding: 20,
  },
  listContent: {
    padding: 16,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  logCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logContent: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  logDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityChange: {
    fontSize: 16,
    fontWeight: '700',
  },
  separator: {
    fontSize: 14,
  },
  remainingText: {
    fontSize: 14,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 8,
    marginLeft: 52,
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
    paddingHorizontal: 40,
  },
});
