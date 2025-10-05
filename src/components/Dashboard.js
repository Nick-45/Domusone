// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Users, CreditCard, AlertCircle, TrendingUp } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';

const Dashboard = ({ buildingInfo }) => {
  const [stats, setStats] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsData, paymentsData] = await Promise.all([
          supabaseService.getDashboardStats(buildingInfo.id),
          supabaseService.getRecentPayments(buildingInfo.id)
        ]);

        // Transform stats data for display
        const transformedStats = [
          {
            title: 'Total Occupancy',
            value: `${statsData.totalTenants}/${statsData.capacity}`,
            subtitle: 'Units occupied',
            icon: Users,
            color: 'blue'
          },
          {
            title: 'Rent Collected',
            value: `KES ${statsData.rentCollected.toLocaleString()}`,
            subtitle: 'This month',
            icon: CreditCard,
            color: 'green'
          },
          {
            title: 'Occupancy Rate',
            value: `${statsData.occupancyRate}%`,
            subtitle: 'Building utilization',
            icon: TrendingUp,
            color: 'purple'
          }
        ];

        setStats(transformedStats);
        setRecentPayments(paymentsData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (buildingInfo?.id) {
      fetchDashboardData();
    }
  }, [buildingInfo]);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`stat-card stat-${stat.color}`}>
              <div className="stat-icon">
                <Icon size={24} />
              </div>
              <div className="stat-content">
                <h3>{stat.value}</h3>
                <p>{stat.title}</p>
                <span>{stat.subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-content">
        <div className="recent-payments">
          <div className="section-header">
            <h2>Recent Payments</h2>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="payments-table">
            {recentPayments.length === 0 ? (
              <div className="no-data">No recent payments</div>
            ) : (
              recentPayments.map((payment, index) => (
                <div key={payment.id} className="payment-row">
                  <div className="payment-info">
                    <div className="tenant-name">
                      {payment.tenants?.profiles?.full_name || 'Unknown Tenant'}
                    </div>
                    <div className="room-number">
                      {payment.tenants?.room_number || 'N/A'}
                    </div>
                  </div>
                  <div className="payment-details">
                    <div className="amount">KES {payment.amount?.toLocaleString()}</div>
                    <div className="date">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`status status-${payment.status}`}>
                    {payment.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="quick-actions">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="action-buttons">
            <button className="action-btn primary">
              <Users size={20} />
              Add New Tenant
            </button>
            <button className="action-btn secondary">
              <Megaphone size={20} />
              Send Announcement
            </button>
            <button className="action-btn secondary">
              <CreditCard size={20} />
              View Financial Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;