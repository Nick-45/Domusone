// src/components/Sidebar.js
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Megaphone,
  LogOut
} from 'lucide-react';

const Sidebar = ({ activeView, setActiveView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tenants', label: 'Tenant Management', icon: Users },
    { id: 'financial', label: 'Financial Records', icon: CreditCard },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">D1</div>
          <div className="logo-text">
            <div className="logo-title">DomusOne</div>
            <div className="logo-subtitle">Landlord Portal</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item logout-btn">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;