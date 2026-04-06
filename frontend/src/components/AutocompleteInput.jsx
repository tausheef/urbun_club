// src/components/AutocompleteInput.jsx
import React, { useState, useRef, useEffect } from 'react';

// ─── Indian States & UTs ──────────────────────────────────────────────────────
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  // Union Territories
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Lakshadweep', 'Puducherry',
];

// ─── Indian Cities ─────────────────────────────────────────────────────────────
export const INDIAN_CITIES = [
  // Maharashtra
  'Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur',
  'Amravati', 'Nanded', 'Sangli', 'Jalgaon', 'Akola', 'Latur', 'Dhule',
  // Delhi & NCR
  'Delhi', 'New Delhi', 'Noida', 'Gurgaon', 'Faridabad', 'Ghaziabad',
  // Uttar Pradesh
  'Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Allahabad', 'Meerut', 'Bareilly',
  'Aligarh', 'Moradabad', 'Gorakhpur', 'Saharanpur', 'Mathura', 'Prayagraj',
  // Karnataka
  'Bangalore', 'Bengaluru', 'Mysuru', 'Mysore', 'Hubli', 'Mangalore',
  'Belgaum', 'Belagavi', 'Gulbarga', 'Kalaburagi', 'Davangere', 'Shimoga',
  // Tamil Nadu
  'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli',
  'Tiruppur', 'Vellore', 'Erode', 'Thoothukudi',
  // Gujarat
  'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar',
  'Junagadh', 'Gandhinagar', 'Anand', 'Bharuch',
  // Rajasthan
  'Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Alwar',
  'Bharatpur', 'Sikar', 'Pali',
  // West Bengal
  'Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman',
  'Malda', 'Baharampur', 'Habra', 'Kharagpur',
  // Madhya Pradesh
  'Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Dewas',
  'Satna', 'Ratlam', 'Rewa',
  // Andhra Pradesh
  'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Kakinada',
  'Tirupati', 'Rajahmundry', 'Kadapa', 'Anantapur',
  // Telangana
  'Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar',
  // Kerala
  'Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam',
  'Kannur', 'Alappuzha', 'Palakkad',
  // Bihar
  'Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga' , 'Samastipur',
  // Punjab
  'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali',
  // Haryana
  'Chandigarh', 'Ambala', 'Rohtak', 'Panipat', 'Yamunanagar', 'Sonipat',
  // Himachal Pradesh
  'Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu',
  // Uttarakhand
  'Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Nainital', 'Rishikesh',
  // Jharkhand
  'Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh',
  // Chhattisgarh
  'Raipur', 'Bhilai', 'Bilaspur', 'Durg', 'Korba',
  // Odisha
  'Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur',
  // Assam
  'Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon',
  // Goa
  'Panaji', 'Margao', 'Vasco da Gama', 'Mapusa',
  // Jammu & Kashmir
  'Srinagar', 'Jammu', 'Anantnag', 'Sopore',
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function AutocompleteInput({
  name,
  value,
  onChange,
  onKeyDown,
  suggestions = [],
  placeholder = '',
  className = '',
  maxLength,
  'data-nav': dataNav,
}) {
  const [open, setOpen]         = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const wrapperRef              = useRef(null);
  const inputRef                = useRef(null);

  // Filter suggestions based on current value
  const filtered = value.trim().length > 0
    ? suggestions.filter(s =>
        s.toLowerCase().startsWith(value.trim().toLowerCase())
      ).slice(0, 8)   // max 8 suggestions
    : [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setHighlighted(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted when filtered list changes
  useEffect(() => {
    setHighlighted(-1);
  }, [value]);

  const handleChange = (e) => {
    onChange(e);
    setOpen(true);
  };

  const handleSelect = (suggestion) => {
    // Simulate a synthetic event so handleInputChange in DocketForm works normally
    onChange({ target: { name, value: suggestion, type: 'text' } });
    setOpen(false);
    setHighlighted(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (open && filtered.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation(); // Don't let handleKeyNav move to next field
        setHighlighted(prev => Math.min(prev + 1, filtered.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setHighlighted(prev => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter' && highlighted >= 0) {
        e.preventDefault();
        e.stopPropagation();
        handleSelect(filtered[highlighted]);
        return;
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setHighlighted(-1);
        return;
      }
    }
    // Fall through to DocketForm's handleKeyNav for other keys
    if (onKeyDown) onKeyDown(e);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => value.trim().length > 0 && setOpen(true)}
        data-nav={dataNav}
        placeholder={placeholder}
        maxLength={maxLength}
        className={className}
        autoComplete="off"
      />

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 top-full mt-0.5 bg-white border border-gray-300 rounded shadow-lg max-h-52 overflow-y-auto">
          {filtered.map((suggestion, idx) => {
            // Bold the matching part
            const lowerVal = value.trim().toLowerCase();
            const lowerSug = suggestion.toLowerCase();
            const matchStart = lowerSug.indexOf(lowerVal);
            const matchEnd   = matchStart + lowerVal.length;

            return (
              <li
                key={suggestion}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent input blur before select
                  handleSelect(suggestion);
                }}
                onMouseEnter={() => setHighlighted(idx)}
                className={`px-3 py-2 text-sm cursor-pointer select-none ${
                  idx === highlighted
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-800 hover:bg-blue-50'
                }`}
              >
                {matchStart >= 0 ? (
                  <>
                    {suggestion.slice(0, matchStart)}
                    <span className={`font-bold ${idx === highlighted ? 'text-white' : 'text-blue-600'}`}>
                      {suggestion.slice(matchStart, matchEnd)}
                    </span>
                    {suggestion.slice(matchEnd)}
                  </>
                ) : suggestion}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}