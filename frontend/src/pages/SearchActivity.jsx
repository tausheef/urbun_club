import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, Package } from 'lucide-react';
import { docketAPI } from '../utils/api';
import Navbar from '../components/Navbar';

export default function SearchActivity() {
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [allDockets, setAllDockets] = useState([]);
  const [filteredDockets, setFilteredDockets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch all dockets on component mount
  useEffect(() => {
    fetchAllDockets();
  }, []);

  const fetchAllDockets = async () => {
    setLoading(true);
    try {
      const result = await docketAPI.getAll();
      
      if (result.success && result.data) {
        setAllDockets(result.data);
      }
    } catch (error) {
      console.error('Error fetching dockets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Execute search
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredDockets([]);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    
    const searchLower = searchQuery.toLowerCase();
    const filtered = allDockets.filter(item => {
      const docketNo = item.docket?.docketNo || '';
      const originCity = item.bookingInfo?.originCity || '';
      const destinationCity = item.docket?.destinationCity || '';
      const consignorName = item.docket?.consignor?.consignorName || '';
      const consigneeName = item.docket?.consignee?.consigneeName || '';

      return (
        docketNo.toLowerCase().includes(searchLower) ||
        originCity.toLowerCase().includes(searchLower) ||
        destinationCity.toLowerCase().includes(searchLower) ||
        consignorName.toLowerCase().includes(searchLower) ||
        consigneeName.toLowerCase().includes(searchLower)
      );
    });

    setFilteredDockets(filtered);
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setFilteredDockets([]);
    setHasSearched(false);
  };

  // Navigate to update activity page
  const handleDocketClick = (docketId) => {
    navigate(`/update-activity/${docketId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Search Docket for Activity Update</h1>
          <p className="text-gray-600">Find a docket to update its activity status</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by Docket Number, Consignor, Consignee, Origin, or Destination..."
                value={searchQuery}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 pl-12 pr-4 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              {/* Dynamic icon on left */}
              {searchQuery ? (
                <button
                  onClick={handleClearSearch}
                  className="absolute left-4 top-3.5 text-gray-500 hover:text-gray-700 transition cursor-pointer"
                  title="Clear search"
                  type="button"
                >
                  <X size={20} />
                </button>
              ) : (
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
              )}
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="px-8 py-3 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 transition flex items-center gap-2 whitespace-nowrap shadow-md hover:shadow-lg"
            >
              <Search size={18} />
              Search
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            💡 Tip: Search by docket number, consignor/consignee name, or city
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading dockets...</p>
          </div>
        )}

        {/* Search Results */}
        {!loading && hasSearched && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Search Results
                {filteredDockets.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({filteredDockets.length} docket{filteredDockets.length !== 1 ? 's' : ''} found)
                  </span>
                )}
              </h2>
            </div>

            {/* No Results */}
            {filteredDockets.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-3">
                  <Package className="w-16 h-16 mx-auto" />
                </div>
                <p className="text-gray-600 font-medium">No dockets found</p>
                <p className="text-gray-500 text-sm mt-1">
                  Try searching with different keywords for "{searchQuery}"
                </p>
              </div>
            )}

            {/* Results List */}
            {filteredDockets.length > 0 && (
              <div className="space-y-3">
                {filteredDockets.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleDocketClick(item.docket._id)}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-blue-600 group-hover:text-blue-700">
                            {item.docket?.docketNo || '-'}
                          </h3>
                          {item.docket?.rto && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded">
                              RTO
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                          <div>
                            <span className="text-gray-500">Booking Date:</span>
                            <p className="font-medium text-gray-700">
                              {item.docket?.bookingDate
                                ? new Date(item.docket.bookingDate).toLocaleDateString('en-IN')
                                : '-'}
                            </p>
                          </div>

                          <div>
                            <span className="text-gray-500">Origin:</span>
                            <p className="font-medium text-gray-700">
                              {item.bookingInfo?.originCity || '-'}
                            </p>
                          </div>

                          <div>
                            <span className="text-gray-500">Destination:</span>
                            <p className="font-medium text-gray-700">
                              {item.docket?.destinationCity || '-'}
                            </p>
                          </div>

                          <div>
                            <span className="text-gray-500">Consignor:</span>
                            <p className="font-medium text-gray-700">
                              {item.docket?.consignor?.consignorName || '-'}
                            </p>
                          </div>

                          <div>
                            <span className="text-gray-500">Consignee:</span>
                            <p className="font-medium text-gray-700">
                              {item.docket?.consignee?.consigneeName || '-'}
                            </p>
                          </div>

                          <div>
                            <span className="text-gray-500">Weight:</span>
                            <p className="font-medium text-gray-700">
                              {item.bookingInfo?.actualWeight || 0} kg
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                          <ArrowRight className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Initial State - No Search Yet */}
        {!loading && !hasSearched && (
          <div className="bg-white rounded-lg shadow-md p-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Search for a Docket
              </h3>
              <p className="text-gray-600">
                Enter a docket number, consignor/consignee name, or city to find the docket you want to update
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}