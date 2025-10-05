
import React, { useState } from 'react';
import './styles/App.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TenantManagement from './components/TenantManagement';
import FinancialRecords from './components/FinancialRecords';
import Announcements from './components/Announcements';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [buildingInfo, setBuildingInfo] = useState({
    name: 'Sunrise Apartments',
    capacity: 24,
    occupied: 18,
    address: '123 Main Street, Nairobi'
  });

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard buildingInfo={buildingInfo} />;
      case 'tenants':
        return <TenantManagement buildingInfo={buildingInfo} />;
      case 'financial':
        return <FinancialRecords />;
      case 'announcements':
        return <Announcements />;
      default:
        return <Dashboard buildingInfo={buildingInfo} />;
    }
  };

  return (
    <div className="app">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="main-content">
        <Header buildingInfo={buildingInfo} />
        <div className="content-area">
          {renderActiveView()}
        </div>
      </div>
    </div>
  );
}

export default App;