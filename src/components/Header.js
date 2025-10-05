// src/components/Header.js
import React from 'this';
import { Bell, Search, User } from 'lucide-react';

const Header = ({ buildingInfo }) => {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="page-title">Welcome back, John!</h1>
        <p className="building-info">
          {buildingInfo.name} • {buildingInfo.address}
        </p>
      </div>

      <div className="header-right">
        <div className="search-bar">
          <Search size={20} />
          <input type="text" placeholder="Search..." />
        </div>

        <button className="icon-btn">
          <Bell size={20} />
          <span className="notification-badge">3</span>
        </button>

        <div className="user-profile">
          <div className="avatar">
            <User size={20} />
          </div>
          <span className="user-name">John Manager</span>
        </div>
      </div>
    </header>
  );
};

export default Header;