// src/services/supabaseService.js
import { supabase } from '../config/supabase';

export const tenantService = {
  // Auth
  async signIn(phone, password) {
    // For now using phone as identifier, you might want to use email instead
    const { data, error } = await supabase.auth.signInWithPassword({
      email: phone, // Using phone as email for simplicity
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Tenant Data
  async getTenantProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async getTenantDetails(profileId) {
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        *,
        buildings (name, address)
      `)
      .eq('profile_id', profileId)
      .single();
    if (error) throw error;
    return data;
  },

  // Payments
  async getPaymentHistory(tenantId) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('payment_date', { ascending: false });
    if (error) throw error;
    return data;
  },

  async initiateMpesaPayment(phone, amount, tenantId) {
    // This would integrate with your backend that handles M-Pesa STK Push
    const response = await fetch('your_backend_url/api/mpesa/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        amount,
        tenantId,
      }),
    });
    
    if (!response.ok) throw new Error('Payment initiation failed');
    return response.json();
  },

  // Community
  async getCommunityPosts(buildingId) {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('building_id', buildingId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createCommunityPost(buildingId, title, message, userId) {
    const { data, error } = await supabase
      .from('community_posts') // You'll need to create this table
      .insert([{
        building_id: buildingId,
        user_id: userId,
        title,
        message,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
// M-Pesa Payment
  async initiateMpesaPayment(phone, amount, tenantId) {
    const response = await fetch('http://your-backend-url/api/mpesa/initiate-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        amount,
        tenantId,
      }),
    });
    
    if (!response.ok) throw new Error('Payment initiation failed');
    return response.json();
  },

  async checkPaymentStatus(checkoutRequestID) {
    const response = await fetch(
      `http://your-backend-url/api/mpesa/payment-status/${checkoutRequestID}`
    );
    
    if (!response.ok) throw new Error('Failed to check payment status');
    return response.json();
  },

  // Save payment record
  async savePaymentRecord(paymentData) {
    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  // Notifications
  async getNotifications(buildingId) {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('building_id', buildingId)
      .eq('is_urgent', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
};