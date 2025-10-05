// src/screens/RentPaymentScreen.js
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
import { CreditCard, Calendar, History, CheckCircle } from 'lucide-react-native';
import { tenantService } from '../services/supabaseService';

const RentPaymentScreen = () => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const history = await tenantService.getPaymentHistory(user.id);
        setPaymentHistory(history);
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
    }
  };

  const handleMpesaPayment = async () => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const tenantDetails = await tenantService.getTenantDetails(user.id);
      
      // This would integrate with your M-Pesa backend
      const result = await tenantService.initiateMpesaPayment(
        tenantDetails.phone,
        tenantDetails.rent_amount,
        tenantDetails.id
      );

      Alert.alert(
        'Payment Initiated',
        'Check your phone to complete the M-Pesa payment',
        [{ text: 'OK', onPress: () => setShowPaymentModal(false) }]
      );

      // Reload payment history
      await loadPaymentHistory();
    } catch (error) {
      Alert.alert('Payment Failed', error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.paymentCard}>
        <Text style={styles.cardTitle}>Pay Rent</Text>
        <Text style={styles.amount}>KES 15,000</Text>
        <Text style={styles.dueDate}>Due by 5th of each month</Text>
        
        <TouchableOpacity 
          style={styles.payNowButton}
          onPress={() => setShowPaymentModal(true)}
        >
          <CreditCard size={20} color="white" />
          <Text style={styles.payNowText}>Pay with M-Pesa</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Payment History</Text>
        {paymentHistory.map((payment) => (
          <View key={payment.id} style={styles.paymentItem}>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentPeriod}>{payment.period}</Text>
              <Text style={styles.paymentDate}>
                {new Date(payment.payment_date).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.paymentDetails}>
              <Text style={styles.paymentAmount}>KES {payment.amount}</Text>
              <View style={[styles.statusBadge, payment.status === 'completed' && styles.statusCompleted]}>
                <Text style={styles.statusText}>{payment.status}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Payment</Text>
            <Text style={styles.modalAmount}>KES 15,000</Text>
            <Text style={styles.modalDescription}>
              You will receive an M-Pesa prompt on your phone to complete this payment.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, processing && styles.confirmButtonDisabled]}
                onPress={handleMpesaPayment}
                disabled={processing}
              >
                <Text style={styles.confirmButtonText}>
                  {processing ? 'Processing...' : 'Confirm'}
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
    padding: 16,
  },
  paymentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
  },
  dueDate: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  payNowButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 16,
    width: '100%',
  },
  payNowText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  historySection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  paymentInfo: {
    flex: 1,
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
  paymentDetails: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
  },
  statusCompleted: {
    backgroundColor: '#dcfce7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1e293b',
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
    textAlign: 'center',
    marginBottom: 16,
  },
  modalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RentPaymentScreen;