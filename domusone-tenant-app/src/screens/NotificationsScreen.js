// src/screens/NotificationsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Bell, AlertCircle, Info, Megaphone, Clock } from 'lucide-react-native';
import { tenantService } from '../services/supabaseService';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const tenantDetails = await tenantService.getTenantDetails(user.id);
        const notifs = await tenantService.getNotifications(tenantDetails.building_id);
        setNotifications(notifs);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const getNotificationIcon = (isUrgent) => {
    if (isUrgent) {
      return <AlertCircle size={24} color="#ef4444" />;
    }
    return <Info size={24} color="#3b82f6" />;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Megaphone size={24} color="#1e293b" />
        <Text style={styles.headerTitle}>Announcements</Text>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Bell size={48} color="#cbd5e1" />
          <Text style={styles.emptyStateTitle}>No announcements</Text>
          <Text style={styles.emptyStateText}>
            You're all caught up! Check back later for new announcements from your landlord.
          </Text>
        </View>
      ) : (
        notifications.map((notification) => (
          <TouchableOpacity 
            key={notification.id} 
            style={[
              styles.notificationCard,
              notification.is_urgent && styles.urgentNotification
            ]}
          >
            <View style={styles.notificationHeader}>
              {getNotificationIcon(notification.is_urgent)}
              <View style={styles.notificationTitleContainer}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <View style={styles.notificationMeta}>
                  <Clock size={12} color="#94a3b8" />
                  <Text style={styles.notificationTime}>
                    {formatDate(notification.created_at)}
                  </Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.notificationMessage}>{notification.message}</Text>
            
            {notification.is_urgent && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentBadgeText}>URGENT</Text>
              </View>
            )}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 12,
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  urgentNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  notificationTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  urgentBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgentBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
});

export default NotificationsScreen;