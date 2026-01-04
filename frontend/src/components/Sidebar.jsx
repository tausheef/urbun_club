import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Sidebar() {
  const [expandedMenus, setExpandedMenus] = useState({
    docket: true,
    dispatch: false,
    inward: false,
    delivery: false,
    local: false,
    pod: false,
    master: false,
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);

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
        { label: 'DOCKET WISE', subItems: ['DOCKET ENTRY', 'DOCKET VIEW / MODIFY', 'DOCKET CANCEL', 'PARENT DOCKET ENTRY'] },
        { label: 'DOCKET UPLOAD', subItems: [] },
      ]
    },
    // dispatch: {
    //   label: '🚚 DISPATCH MODULE',
    //   icon: ChevronDown,
    //   items: []
    // },
    // inward: {
    //   label: '📥 INWARD MODULE',
    //   icon: ChevronDown,
    //   items: []
    // },
    // delivery: {
    //   label: '📦 DELIVERY MODULE',
    //   icon: ChevronDown,
    //   items: []
    // },
    // local: {
    //   label: '📍 LOCAL OPERATION',
    //   icon: ChevronDown,
    //   items: []
    // },
    pod: {
      label: '📄 POD MODULE',
      icon: ChevronDown,
      items: []
    },
    Reports: {
      label: 'ℹ️ Reports',
      icon: ChevronDown,
      items:[  { label: 'DOCKET UPLOAD', subItems: [] },]
    },
  };

  const [expandedSubmenus, setExpandedSubmenus] = useState({});

  const toggleSubmenu = (key) => {
    setExpandedSubmenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-800 text-gray-100 transition-all duration-300 overflow-y-auto border-r border-gray-700`}>
        {/* Header */}
<div className="p-4 border-b border-gray-700 flex items-center justify-between">
  {/* Wrap logo + text in Link */}
  <Link
    to="/"
    className={`flex items-center gap-2 ${!sidebarOpen && 'hidden'} hover:opacity-80 transition`}
  >
    <div className="w-10 h-10 rounded flex items-center justify-center font-bold">
      <img
        src="/logo.png"
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
        <nav className="p-2 space-y-1">
          {Object.entries(menuItems).map(([key, menu]) => (
            <div key={key}>
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

              {/* Submenu */}
              {expandedMenus[key] && sidebarOpen && menu.items.length > 0 && (
                <div className="ml-2 space-y-1 mt-1">
                  {menu.items.map((item, idx) => (
                    <div key={idx}>
                      <button
                        onClick={() => toggleSubmenu(`${key}-${idx}`)}
                        className="w-full flex items-center justify-between p-2 rounded hover:bg-gray-700 transition-colors text-left text-xs text-gray-300 ml-2 border-l border-gray-600"
                      >
                        <span>{item.label}</span>
                        {item.subItems.length > 0 && (expandedSubmenus[`${key}-${idx}`] ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                      </button>

                      {/* Sub-submenu */}
                      {expandedSubmenus[`${key}-${idx}`] && item.subItems.length > 0 && (
                        <div className="ml-4 space-y-1 mt-1">
                          {item.subItems.map((subItem, subIdx) => (
                            <Link
                              key={subIdx}
                              to={`/${key}/${subItem.toLowerCase().replace(/\s+/g, '-')}`}
                              className="block p-2 rounded hover:bg-purple-600 transition-colors text-left text-xs text-gray-400 hover:text-white border-l border-gray-600 pl-3"
                            >
                              {subItem}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-gray-50">
        {/* This will be populated by page content through routing */}
      </main>
    </div>
  );
}