// src/components/TenantManagement.js
import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, MoreVertical, AlertCircle } from 'lucide-react';
import TenantForm from './TenantForm';
import { supabaseService } from '../services/supabaseService';

const TenantManagement = ({ buildingInfo }) => {
  const [showTenantForm, setShowTenantForm] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTenants();
  }, [buildingInfo]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const tenantsData = await supabaseService.getTenantsByBuilding(buildingInfo.id);
      setTenants(tenantsData);
    } catch (err) {
      console.error('Error fetching tenants:', err);
      setError('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTenant = async (tenantData) => {
    try {
      const newTenant = await supabaseService.createTenant({
        ...tenantData,
        building_id: buildingInfo.id
      });
      setTenants([...tenants, newTenant]);
      setShowTenantForm(false);
    } catch (err) {
      console.error('Error creating tenant:', err);
      setError('Failed to create tenant');
    }
  };

  const handleDeactivateTenant = async (tenantId) => {
    try {
      await supabaseService.updateTenantStatus(tenantId, 'inactive');
      setTenants(tenants.filter(tenant => tenant.id !== tenantId));
    } catch (err) {
      console.error('Error deactivating tenant:', err);
      setError('Failed to deactivate tenant');
    }
  };

  if (loading) {
    return <div className="loading">Loading tenants...</div>;
  }

  return (
    <div className="tenant-management">
      <div className="page-header">
        <div className="header-content">
          <h1>Tenant Management</h1>
          <p>Manage your building's tenants and their information</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowTenantForm(true)}
          disabled={tenants.length >= buildingInfo.capacity + 1}
        >
          <Plus size={20} />
          Add Tenant
        </button>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {tenants.length >= buildingInfo.capacity + 1 && (
        <div className="capacity-warning">
          <AlertCircle size={20} />
          <span>Building at full capacity. To add a new tenant, please deactivate an existing one.</span>
        </div>
      )}

      <div className="management-toolbar">
        <div className="search-box">
          <Search size={20} />
          <input type="text" placeholder="Search tenants..." />
        </div>
        <button className="btn-secondary">
          <Filter size={20} />
          Filter
        </button>
      </div>

      <div className="tenants-grid">
        {tenants.map((tenant) => (
          <div key={tenant.id} className="tenant-card">
            <div className="tenant-header">
              <div className="tenant-avatar">
                <Users size={24} />
              </div>
              <div className="tenant-info">
                <h3>{tenant.profiles?.full_name}</h3>
                <p>Room {tenant.room_number}</p>
              </div>
              <button className="menu-btn">
                <MoreVertical size={16} />
              </button>
            </div>

            <div className="tenant-details">
              <div className="detail-item">
                <span className="label">Phone:</span>
                <span>{tenant.profiles?.phone || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Email:</span>
                <span>{tenant.profiles?.email || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Rent:</span>
                <span className="rent-amount">KES {tenant.rent_amount?.toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <span className="label">Due Date:</span>
                <span>{tenant.rent_due_date}th of month</span>
              </div>
            </div>

            <div className="tenant-actions">
              <button className="btn-outline">View Details</button>
              <button 
                className="btn-outline warning"
                onClick={() => handleDeactivateTenant(tenant.id)}
              >
                Deactivate
              </button>
            </div>
          </div>
        ))}
      </div>

      {tenants.length === 0 && !loading && (
        <div className="no-data">
          <Users size={48} />
          <h3>No tenants yet</h3>
          <p>Add your first tenant to get started</p>
        </div>
      )}

      {showTenantForm && (
        <TenantForm
          onClose={() => setShowTenantForm(false)}
          onSave={handleAddTenant}
          currentCount={tenants.length}
          capacity={buildingInfo.capacity}
        />
      )}
    </div>
  );
};

export default TenantManagement;