// src/services/supabaseService.js
import { supabase } from '../config/supabase';

export const supabaseService = {
  // Auth methods
  async signUp(email, password, userData) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // Wait a moment for the user to be created
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        ...userData
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      throw profileError;
    }

    return authData;
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  // Check if tables exist and create sample data for testing
  async initializeSampleData(landlordId) {
    try {
      // Check if landlord already has a building
      const { data: existingBuilding } = await supabase
        .from('buildings')
        .select('*')
        .eq('landlord_id', landlordId)
        .single();

      if (!existingBuilding) {
        // Create a sample building
        const { data: building } = await supabase
          .from('buildings')
          .insert([{
            landlord_id: landlordId,
            name: 'Sunrise Apartments',
            address: '123 Main Street, Nairobi',
            capacity: 24
          }])
          .select()
          .single();

        return building;
      }

      return existingBuilding;
    } catch (error) {
      console.error('Error initializing sample data:', error);
      throw error;
    }
  },

  // Basic data fetching with error handling
  async getTenantsByBuilding(buildingId) {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          profiles (full_name, phone, email)
        `)
        .eq('building_id', buildingId)
        .eq('status', 'active');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching tenants:', error);
      return [];
    }
  },

  async getDashboardStats(buildingId) {
    try {
      // Get total tenants
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('id', { count: 'exact' })
        .eq('building_id', buildingId)
        .eq('status', 'active');

      if (tenantsError) throw tenantsError;

      // Get building capacity
      const { data: building, error: buildingError } = await supabase
        .from('buildings')
        .select('capacity')
        .eq('id', buildingId)
        .single();

      if (buildingError) throw buildingError;

      return {
        totalTenants: tenants?.length || 0,
        capacity: building?.capacity || 0,
        rentCollected: 0, // We'll implement this later
        occupancyRate: building?.capacity ? Math.round((tenants?.length / building.capacity) * 100) : 0
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalTenants: 0,
        capacity: 0,
        rentCollected: 0,
        occupancyRate: 0
      };
    }
  }
};