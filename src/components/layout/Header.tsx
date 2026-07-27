import React, { useState } from 'react';
import { Bell, User, Search, Menu, ChevronDown, Settings, HelpCircle, LogOut } from 'lucide-react';
import { User as UserType } from '../../types';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useStation } from '../../contexts/StationContext';
import StationSelector from '../common/StationSelector';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  toggleSidebar: () => void;
  user: UserType | null;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, user }) => {
  const { logout } = useAuth();
  const { selectedStationId, isSuperAdmin, isRegionalManager, isSupervisor } = useStation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Determine if station selector should be shown
  const showStationSelector = isSuperAdmin || isRegionalManager || isSupervisor;

  // Get role display name
  const getRoleDisplay = () => {
    if (!user) return '';
    switch (user.role) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'REGIONAL_MANAGER': return 'Regional Manager';
      case 'SUPERVISOR': return 'Supervisor';
      case 'ATTENDANT': return 'Attendant';
      case 'ACCOUNTANT': return 'Accountant';
      default: return user.role;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 h-16">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded hover:bg-gray-100 lg:hidden"
          >
            <Menu size={20} />
          </button>
          
          {/* Station Selector */}
          {showStationSelector && (
            <StationSelector 
              className="hidden md:flex"
              onStationChange={(stationId) => {
                // Station changed - you can add additional logic here
                console.log('Station changed to:', stationId);
              }}
            />
          )}
          
          <div className="hidden md:flex items-center gap-2">
            <span className="text-sm text-gray-500">Today</span>
            <span className="text-sm font-medium">{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
          </div>
        </div>

        {/* Center - Search */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search stations, transactions, employees..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button className="relative p-2 rounded hover:bg-gray-100">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-2 rounded hover:bg-gray-100"
            >
              <div className="w-8 h-8 rounded-full bg-petroleum-seagreen text-petroleum-dark flex items-center justify-center font-semibold text-sm">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{getRoleDisplay()}</p>
              </div>
              <ChevronDown size={16} className="text-gray-500" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <p className="text-xs text-petroleum-seagreen mt-1">{getRoleDisplay()}</p>
                </div>
                <button
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100"
                >
                  <Settings size={16} />
                  Settings
                </button>
                <button
                  onClick={() => navigate('/support')}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100"
                >
                  <HelpCircle size={16} />
                  Help & Support
                </button>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Station Selector */}
      {showStationSelector && (
        <div className="md:hidden px-4 py-2 border-t border-gray-100">
          <StationSelector />
        </div>
      )}
    </header>
  );
};

export default Header;