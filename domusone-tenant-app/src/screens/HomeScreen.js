// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { Bell, CreditCard, Calendar, Home, AlertCircle } from 'lucide-react-native';
import { tenantService } from '../services/supabaseService';
import { supabase } from '../config/supabase';

const HomeScreen = ({ navigation }) => {
  const [tenantData, setTenantData] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('announcements')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'announcements' },
        (payload) => {
          // New announcement received
          setNotifications(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const [profile, tenantDetails, payments, notifs] = await Promise.all([
          tenantService.getTenantProfile(user.id),
          tenantService.getTenantDetails(user.id),
          tenantService.getPaymentHistory(user.id),
          tenantService.getNotifications(tenantDetails?.building_id)
        ]);

        setTenantData({ ...profile, ...tenantDetails });
        setPaymentHistory(payments);
        setNotifications(notifs);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getRentStatus = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const hasPaid = paymentHistory.some(
      payment => payment.period === currentMonth && payment.status === 'completed'
    );
    return hasPaid ? 'Paid' : 'Due';
  };

  const getNextDueDate = () => {
    if (!tenantData) return null;
    const now = new Date();
    const dueDate = new Date(now.getFullYear(), now.getMonth(), tenantData.rent_due_date);
    
    if (now.getDate() > tenantData.rent_due_date) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }
    
    return dueDate;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {tenantData?.full_name}!</Text>
          <Text style={styles.buildingName}>{tenantData?.buildings?.name}</Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Bell size={24} color="#1e293b" />
          {notifications.length > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{notifications.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Rent Status Card */}
      <View style={styles.rentCard}>
        <View style={styles.rentHeader}>
          <View>
            <Text style={styles.rentTitle}>Monthly Rent</Text>
            <Text style={styles.rentAmount}>KES {tenantData?.rent_amount?.toLocaleString()}</Text>
          </View>
          <View style={[styles.statusBadge, getRentStatus() === 'Paid' ? styles.statusPaid : styles.statusDue]}>
            <Text style={styles.statusText}>{getRentStatus()}</Text>
          </View>
        </View>

        <View style={styles.rentDetails}>
          <View style={styles.detailItem}>
            <Calendar size={16} color="#64748b" />
            <Text style={styles.detailText}>
              Due {getNextDueDate()?.toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Home size={16} color="#64748b" />
            <Text style={styles.detailText}>Room {tenantData?.room_number}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.payButton}
          onPress={() => navigation.navigate('Rent')}
        >
          <CreditCard size={20} color="white" />
          <Text style={styles.payButtonText}>Pay Rent</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      {notifications.length > 0 && (
        <View style={styles.notificationsSection}>
          <Text style={styles.sectionTitle}>Latest Announcements</Text>
          {notifications.slice(0, 3).map((notification) => (
            <TouchableOpacity key={notification.id} style={styles.notificationItem}>
              <AlertCircle size={20} color="#f59e0b" />
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage} numberOfLines={2}>
                  {notification.message}
                </Text>
                <Text style={styles.notificationTime}>
                  {new Date(notification.created_at).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recent Payments */}
      <View style={styles.paymentsSection}>
        <Text style={styles.sectionTitle}>Recent Payments</Text>
        {paymentHistory.slice(0, 5).map((payment) => (
          <View key={payment.id} style={styles.paymentItem}>
            <View>
              <Text style={styles.paymentPeriod}>{payment.period}</Text>
              <Text style={styles.paymentDate}>
                {new Date(payment.payment_date).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.paymentAmountContainer}>
              <Text style={styles.paymentAmount}>KES {payment.amount?.toLocaleString()}</Text>
              <Text style={styles.paymentStatus}>{payment.status}</Text>
            </View>
          </View>
        ))}
        {paymentHistory.length === 0 && (
          <Text style={styles.noDataText}>No payment history</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  buildingName: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  rentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rentTitle: {
    fontSize: 16,
    color: '#64748b',
  },
  rentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusPaid: {
    backgroundColor: '#dcfce7',
  },
  statusDue: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rentDetails: {
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    color: '#64748b',
    fontSize: 14,
  },
  payButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 16,
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  notificationsSection: {
    marginBottom: 24,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 10,
    color: '#94a3b8',
  },
  paymentsSection: {
    marginBottom: 24,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentPeriod: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  paymentDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  paymentAmountContainer: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  paymentStatus: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 2,
  },
  noDataText: {
    textAlign: 'center',
    color: '#64748b',
    fontStyle: 'italic',
    padding: 20,
  },
});

export default HomeScreen;