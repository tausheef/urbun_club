import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Menu, X, LogOut, Lock, Truck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { deliveryTrackerAPI } from '../utils/api';

export default function Sidebar() {
  const [expandedMenus, setExpandedMenus] = useState({
    docket: true,
    pod: false,
    coloader: false,
    reports: false,
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { logout, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // ✅ NEW: Delivery tracker counts
  const [deliveringSoonCount, setDeliveringSoonCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);

  // ✅ NEW: Fetch overdue + delivering soon counts for sidebar badge
  useEffect(() => {
    fetchDeliveryTrackerCounts();

    // Refresh every 5 minutes
    const interval = setInterval(fetchDeliveryTrackerCounts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDeliveryTrackerCounts = async () => {
    try {
      const result = await deliveryTrackerAPI.getAll();
      if (result?.success && result?.summary) {
        setDeliveringSoonCount(result.summary.deliveringSoon ?? 0);
        setOverdueCount(result.summary.overdue ?? 0);
      }
    } catch (error) {
      console.error("Error fetching delivery tracker counts:", error);
    }
  };

  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const menuItems = {
    docket: {
      label: '📋 DOCKET MODULE',
      icon: ChevronDown,
      items: [
        { name: 'DOCKET ENTRY', path: '/docketentry', adminOnly: false },
        { name: 'DOCKET MODIFY', path: '/update-docket', adminOnly: true },
        { name: 'DOCKET CANCEL', path: '/cancel-docket', adminOnly: true },
        { name: 'DOCKET ACTIVITY', path: '/search-activity', adminOnly: false },
      ]
    },
    pod: {
      label: '📄 POD MODULE',
      icon: ChevronDown,
      items: [
        { name: 'PROOF OF DELIVERY', path: '/proofofdelivery', adminOnly: false },
      ]
    },
    coloader: {
      label: '🚛 CO-LOADER',
      icon: ChevronDown,
      items: [
        { name: 'CO-LOADER ENTRY', path: '/coloader-entry', adminOnly: false },
        { name: 'CO-LOADER BOOKINGS', path: '/coloader-bookings', adminOnly: false },
      ]
    },
    reports: {
      label: 'ℹ️ Reports',
      icon: ChevronDown,
      items: [
        { name: 'MIS REPORTS', path: '/misreports', adminOnly: false },
      ]
    },
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const handleMenuItemClick = (item) => {
    if (item.adminOnly && !isAdmin()) {
      alert('This feature is only accessible to administrators.');
      return;
    }
    if (item.path) {
      navigate(item.path);
    }
  };

  // ✅ Show badge only if there's something to show
  const showDeliveryBadge = deliveringSoonCount > 0 || overdueCount > 0;

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-800 text-gray-100 transition-all duration-300 overflow-y-auto border-r border-gray-700 flex flex-col`}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <Link
            to="/"
            className={`flex items-center gap-2 ${!sidebarOpen && 'hidden'} hover:opacity-80 transition`}
          >
            <div className="w-10 h-10 rounded flex items-center justify-center font-bold">
              <img
                src="/erp/logo.png"
                alt="Urban Club Logo"
                className="w-10 h-10 rounded object-contain bg-white p-1"
              />
            </div>
            <span className="font-bold text-sm">Urban Club pvt. ltd.</span>
          </Link>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-700 rounded"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-2 space-y-1 flex-grow">
          {Object.entries(menuItems).map(([key, menu]) => (
            <div key={key}>
              {menu.path ? (
                <Link
                  to={menu.path}
                  className="w-full flex items-center justify-between p-3 rounded hover:bg-purple-600 transition-colors text-left text-sm font-medium group"
                >
                  <span className={`flex items-center gap-2 ${!sidebarOpen && 'justify-center w-full'}`}>
                    {sidebarOpen && menu.label}
                    {!sidebarOpen && <span className="text-lg">{menu.label.split(' ')[0]}</span>}
                  </span>
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => toggleMenu(key)}
                    className="w-full flex items-center justify-between p-3 rounded hover:bg-gray-700 transition-colors text-left text-sm font-medium group"
                  >
                    <span className={`flex items-center gap-2 ${!sidebarOpen && 'justify-center w-full'}`}>
                      {sidebarOpen && menu.label}
                      {!sidebarOpen && <span className="text-lg">{menu.label.split(' ')[0]}</span>}
                    </span>
                    {sidebarOpen && (expandedMenus[key] ? <ChevronDown size={18} /> : <ChevronRight size={18} />)}
                  </button>

                  {expandedMenus[key] && sidebarOpen && menu.items.length > 0 && (
                    <div className="ml-4 space-y-1 mt-1">
                      {menu.items.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleMenuItemClick(item)}
                          disabled={!item.path}
                          className={`
                            w-full text-left p-2 rounded transition-colors text-xs border-l border-gray-600 pl-3 flex items-center justify-between
                            ${item.path 
                              ? 'text-gray-400 hover:text-white hover:bg-purple-600 cursor-pointer' 
                              : 'text-gray-600 cursor-not-allowed'
                            }
                          `}
                        >
                          <span>{item.name}</span>
                          {item.adminOnly && (
                            <Lock size={12} className="text-yellow-500" title="Admin Only" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </nav>

        {/* ✅ NEW: Delivery Tracker Popup Badge — sits above logout, z-index higher than menu */}
        {showDeliveryBadge && (
          <div className="px-2 pb-2 relative z-50">
            <button
              onClick={() => navigate('/delivery-tracker')}
              className={`
                w-full rounded-lg border border-orange-500/40 bg-gradient-to-br from-gray-700 to-gray-800
                hover:from-orange-900/60 hover:to-gray-800
                transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-900/30
                relative overflow-hidden group
                ${sidebarOpen ? 'p-3' : 'p-2'}
              `}
              title="View Delivery Tracker"
            >
              {/* Pulse glow effect on the border */}
              <div className="absolute inset-0 rounded-lg border border-orange-400/20 animate-pulse pointer-events-none" />

              {sidebarOpen ? (
                // ✅ Expanded sidebar view
                <div className="flex items-center gap-3">
                  {/* Truck icon with pulsing dot */}
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center">
                      <Truck size={18} className="text-orange-400" />
                    </div>
                    {overdueCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                    )}
                    {overdueCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                    )}
                  </div>

                  {/* Text content */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-xs font-semibold text-gray-300 group-hover:text-white transition-colors truncate">
                      Delivery Tracker
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {deliveringSoonCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-yellow-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
                          {deliveringSoonCount} Soon
                        </span>
                      )}
                      {overdueCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                          {overdueCount} Overdue
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight size={14} className="text-gray-500 group-hover:text-orange-400 transition-colors flex-shrink-0" />
                </div>
              ) : (
                // ✅ Collapsed sidebar view — just icon + count badge
                <div className="flex flex-col items-center gap-1 relative">
                  <div className="relative">
                    <Truck size={20} className="text-orange-400" />
                    {overdueCount > 0 && (
                      <>
                        <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                        <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full" />
                      </>
                    )}
                  </div>
                  {deliveringSoonCount > 0 && (
                    <span className="text-xs font-bold text-yellow-400 leading-none">{deliveringSoonCount}</span>
                  )}
                </div>
              )}
            </button>
          </div>
        )}

        {/* Logout Button at Bottom */}
        <div className="p-2 border-t border-gray-700">
          {sidebarOpen ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded hover:bg-red-600 transition-colors text-left text-sm font-medium text-gray-300 hover:text-white group"
            >
              <LogOut size={18} className="group-hover:animate-pulse" />
              <span>Logout</span>
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-3 rounded hover:bg-red-600 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          )}
          
          {/* User info */}
          {sidebarOpen && user && (
            <div className="mt-2 p-2 bg-gray-700 rounded text-xs text-gray-300">
              <p className="font-semibold truncate">{user.username || user.name}</p>
              <p className="text-gray-400 truncate">{user.email}</p>
              {isAdmin() && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-green-600 text-white text-xs rounded">
                  ADMIN
                </span>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-gray-50">
        {/* This will be populated by page content through routing */}
      </main>
    </div>
  );
}