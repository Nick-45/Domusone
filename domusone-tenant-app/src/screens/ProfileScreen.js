// src/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { User, Phone, Mail, Home, Calendar, LogOut, Edit3, Shield } from 'lucide-react-native';
import { tenantService } from '../services/supabaseService';
import { supabase } from '../config/supabase';

const ProfileScreen = ({ navigation }) => {
  const [tenantData, setTenantData] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [profile, tenantDetails] = await Promise.all([
          tenantService.getTenantProfile(user.id),
          tenantService.getTenantDetails(user.id)
        ]);
        setTenantData({ ...profile, ...tenantDetails });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile data');
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await tenantService.signOut();
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    } finally {
      setLoading(false);
      setShowLogoutModal(false);
    }
  };

  const ProfileItem = ({ icon: Icon, label, value }) => (
    <View style={styles.profileItem}>
      <View style={styles.profileItemIcon}>
        <Icon size={20} color="#2563eb" />
      </View>
      <View style={styles.profileItemContent}>
        <Text style={styles.profileItemLabel}>{label}</Text>
        <Text style={styles.profileItemValue}>{value || 'Not set'}</Text>
      </View>
    </View>
  );

  if (!tenantData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <User size={40} color="#64748b" />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{tenantData.full_name}</Text>
          <Text style={styles.profileRole}>Tenant</Text>
        </View>
        <TouchableOpacity style={styles.editButton}>
          <Edit3 size={20} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.sectionContent}>
          <ProfileItem icon={User} label="Full Name" value={tenantData.full_name} />
          <ProfileItem icon={Phone} label="Phone Number" value={tenantData.phone} />
          <ProfileItem icon={Mail} label="Email" value={tenantData.email} />
        </View>
      </View>

      {/* Rental Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rental Information</Text>
        <View style={styles.sectionContent}>
          <ProfileItem icon={Home} label="Building" value={tenantData.buildings?.name} />
          <ProfileItem icon={Home} label="Room Number" value={tenantData.room_number} />
          <ProfileItem icon={Calendar} label="Rent Due Date" value={`${tenantData.rent_due_date}th of each month`} />
          <ProfileItem icon={Shield} label="Rent Amount" value={`KES ${tenantData.rent_amount?.toLocaleString()}`} />
        </View>
      </View>

      {/* Emergency Contacts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        <View style={styles.sectionContent}>
          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>Landlord/Caretaker</Text>
            <Text style={styles.contactValue}>+254 700 000 000</Text>
          </View>
          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>Emergency Maintenance</Text>
            <Text style={styles.contactValue}>+254 711 000 000</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Actions</Text>
        <View style={styles.sectionContent}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Change Password</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Update Contact Information</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]}
            onPress={() => setShowLogoutModal(true)}
          >
            <LogOut size={20} color="#ef4444" />
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>DomusOne Tenant App v1.0.0</Text>
      </View>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to logout from your account?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalConfirmButton, loading && styles.modalConfirmButtonDisabled]}
                onPress={handleLogout}
                disabled={loading}
              >
                <Text style={styles.modalConfirmButtonText}>
                  {loading ? 'Logging out...' : 'Logout'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    backgroundColor: 'white',
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    color: '#64748b',
  },
  editButton: {
    padding: 8,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionContent: {
    paddingHorizontal: 20,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  profileItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileItemContent: {
    flex: 1,
  },
  profileItemLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  profileItemValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  contactItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  contactLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  logoutButtonText: {
    color: '#ef4444',
    marginLeft: 8,
  },
  versionContainer: {
    padding: 20,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  modalConfirmButtonDisabled: {
    backgroundColor: '#fca5a5',
  },
  modalConfirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;