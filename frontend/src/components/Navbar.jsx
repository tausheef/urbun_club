import React, { useState } from 'react';
import { Menu, X, LogOut, User, Bell, Search } from 'lucide-react';
import { useSearchStore } from '../stores/searchStore';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  const { searchType, searchQuery, setSearchType, setSearchQuery, executeSearch } = useSearchStore();
  const { user, logout, isAdmin } = useAuth();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  // ✅ NEW: Only update input value (no automatic search)
  const handleInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  // ✅ NEW: Trigger search on button click
  const handleSearchClick = () => {
    executeSearch();
  };

  // ✅ NEW: Trigger search on Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  };

  const handleSearchTypeChange = (type) => {
    setSearchType(type);
    setShowSearchDropdown(false);
  };

  // ✅ Clear search instantly
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-full mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo/Brand */}
          <Link to="/">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                <img
                  src="/logo.png"
                  alt="Urban Club Logo"
                  className="w-10 h-10 rounded object-contain bg-white p-1"
                />
              </div>
              <span className="font-bold text-gray-800 text-lg hidden sm:inline">URBAN CLUB</span> 
            </div>
          </Link>

          {/* Search Bar with Toggle - Desktop */}
          <div className="hidden md:flex items-center gap-2 flex-1 mx-8">
            {/* Search Type Dropdown Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowSearchDropdown(!showSearchDropdown)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 transition"
              >
                {searchType}
                <svg
                  className={`w-4 h-4 transition-transform ${showSearchDropdown ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showSearchDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => handleSearchTypeChange('DOCKET')}
                    className={`block w-full text-left px-4 py-2 text-sm transition ${
                      searchType === 'DOCKET'
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    DOCKET
                  </button>
                  <button
                    onClick={() => handleSearchTypeChange('E-WAY BILL')}
                    className={`block w-full text-left px-4 py-2 text-sm transition ${
                      searchType === 'E-WAY BILL'
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    E-WAY BILL
                  </button>
                </div>
              )}
            </div>

            {/* ✅ UPDATED: Search Input with Search Button */}
            <div className="relative flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={`Search by Docket Number, Consignor, or Consignee...`}
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {/* ✅ DYNAMIC ICON ON LEFT: Search icon → X icon when typing */}
                {searchQuery ? (
                  // Show X icon when there's text - CLICKABLE to clear
                  <button
                    onClick={handleClearSearch}
                    className="absolute left-3 top-2.5 text-gray-500 hover:text-gray-700 transition cursor-pointer"
                    title="Clear search"
                    type="button"
                  >
                    <X size={18} />
                  </button>
                ) : (
                  // Show Search icon when empty
                  <Search className="absolute left-3 top-2.5 w-[18px] h-[18px] text-gray-400 pointer-events-none" />
                )}
              </div>

              {/* ✅ NEW: Search Button */}
              <button
                onClick={handleSearchClick}
                className="px-6 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition flex items-center gap-2 whitespace-nowrap"
              >
                <Search size={18} />
                Search
              </button>
            </div>
          </div>

          {/* Right Side - Notifications & Profile */}
          <div className="flex items-center gap-4">
            
            {/* Notifications */}
            <button className="relative text-gray-600 hover:text-blue-600 transition">
              <Bell size={20} />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </button>

            {/* ✅ UPDATED: User Menu - Desktop with Google Avatar Support */}
            {user && (
              <div className="hidden md:flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">
                    {user.username || user.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isAdmin() ? (
                      <span className="text-green-600 font-semibold">Administrator</span>
                    ) : (
                      <span className="text-blue-600">User</span>
                    )}
                  </p>
                </div>
                
                {/* ✅ NEW: Show Google Avatar or Initial */}
                {user.avatar || user.picture ? (
                  // Google avatar
                  <img
                    src={user.avatar || user.picture}
                    alt={user.username || user.name}
                    className="w-9 h-9 rounded-full object-cover border-2 border-blue-200"
                  />
                ) : (
                  // Default initial avatar
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {(user.username || user.name).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden text-gray-600 hover:text-blue-600"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-200 pb-4">
            <div className="space-y-3 pt-4">
              {/* Mobile Search Type Selector */}
              <div className="px-4">
                <label className="text-xs font-medium text-gray-600 block mb-2">Search Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSearchTypeChange('DOCKET')}
                    className={`flex-1 px-3 py-2 rounded text-xs font-medium transition ${
                      searchType === 'DOCKET'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    DOCKET
                  </button>
                  <button
                    onClick={() => handleSearchTypeChange('E-WAY BILL')}
                    className={`flex-1 px-3 py-2 rounded text-xs font-medium transition ${
                      searchType === 'E-WAY BILL'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    E-WAY BILL
                  </button>
                </div>
              </div>

              {/* ✅ UPDATED: Mobile Search with Search Button */}
              <div className="px-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={`Search by Docket Number, Consignor, or Consignee...`}
                    value={searchQuery}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  {/* ✅ DYNAMIC ICON ON LEFT: Search icon → X icon when typing (Mobile) */}
                  {searchQuery ? (
                    // Show X icon when there's text - CLICKABLE to clear
                    <button
                      onClick={handleClearSearch}
                      className="absolute left-3 top-2.5 text-gray-500 hover:text-gray-700 transition cursor-pointer"
                      title="Clear search"
                      type="button"
                    >
                      <X size={18} />
                    </button>
                  ) : (
                    // Show Search icon when empty
                    <Search className="absolute left-3 top-2.5 w-[18px] h-[18px] text-gray-400 pointer-events-none" />
                  )}
                </div>
                
                {/* ✅ NEW: Mobile Search Button */}
                <button
                  onClick={handleSearchClick}
                  className="w-full mt-2 px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <Search size={18} />
                  Search
                </button>
              </div>
              
              {/* ✅ UPDATED: Mobile Menu User Info with Google Avatar Support */}
              {user && (
                <div className="border-t border-gray-200 pt-3 mt-3">
                  {/* User Info Card */}
                  <div className="px-4 pb-3 mb-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      {/* ✅ NEW: Show Google Avatar or Initial */}
                      {user.avatar || user.picture ? (
                        // Google avatar
                        <img
                          src={user.avatar || user.picture}
                          alt={user.username || user.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
                        />
                      ) : (
                        // Default initial avatar
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {(user.username || user.name).charAt(0).toUpperCase()}
                        </div>
                      )}
                      
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {user.username || user.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {isAdmin() ? (
                            <span className="text-green-600 font-semibold">Administrator</span>
                          ) : (
                            <span className="text-blue-600">User</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 rounded transition flex items-center gap-2 font-medium">
                    <User size={18} />
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded transition flex items-center gap-2 font-medium"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}