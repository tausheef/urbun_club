// utils/distanceCalculator.js

/**
 * City coordinates database (major Indian cities)
 * Add more cities as needed
 */
const cityCoordinates = {
  // Metro Cities
  "delhi": { lat: 28.7041, lon: 77.1025 },
  "new delhi": { lat: 28.7041, lon: 77.1025 },
  "mumbai": { lat: 19.0760, lon: 72.8777 },
  "bombay": { lat: 19.0760, lon: 72.8777 },
  "bangalore": { lat: 12.9716, lon: 77.5946 },
  "bengaluru": { lat: 12.9716, lon: 77.5946 },
  "kolkata": { lat: 22.5726, lon: 88.3639 },
  "calcutta": { lat: 22.5726, lon: 88.3639 },
  "chennai": { lat: 13.0827, lon: 80.2707 },
  "madras": { lat: 13.0827, lon: 80.2707 },
  "hyderabad": { lat: 17.3850, lon: 78.4867 },
  
  // North India
  "jaipur": { lat: 26.9124, lon: 75.7873 },
  "lucknow": { lat: 26.8467, lon: 80.9462 },
  "kanpur": { lat: 26.4499, lon: 80.3319 },
  "agra": { lat: 27.1767, lon: 78.0081 },
  "chandigarh": { lat: 30.7333, lon: 76.7794 },
  "amritsar": { lat: 31.6340, lon: 74.8723 },
  "ludhiana": { lat: 30.9010, lon: 75.8573 },
  "jalandhar": { lat: 31.3260, lon: 75.5762 },
  "dehradun": { lat: 30.3165, lon: 78.0322 },
  "haridwar": { lat: 29.9457, lon: 78.1642 },
  "shimla": { lat: 31.1048, lon: 77.1734 },
  
  // NCR Region
  "noida": { lat: 28.5355, lon: 77.3910 },
  "gurgaon": { lat: 28.4595, lon: 77.0266 },
  "gurugram": { lat: 28.4595, lon: 77.0266 },
  "faridabad": { lat: 28.4089, lon: 77.3178 },
  "ghaziabad": { lat: 28.6692, lon: 77.4538 },
  
  // West India
  "pune": { lat: 18.5204, lon: 73.8567 },
  "ahmedabad": { lat: 23.0225, lon: 72.5714 },
  "surat": { lat: 21.1702, lon: 72.8311 },
  "vadodara": { lat: 22.3072, lon: 73.1812 },
  "rajkot": { lat: 22.3039, lon: 70.8022 },
  "nagpur": { lat: 21.1458, lon: 79.0882 },
  "nashik": { lat: 19.9975, lon: 73.7898 },
  "indore": { lat: 22.7196, lon: 75.8577 },
  "bhopal": { lat: 23.2599, lon: 77.4126 },
  "goa": { lat: 15.2993, lon: 74.1240 },
  "panaji": { lat: 15.4909, lon: 73.8278 },
  
  // South India
  "coimbatore": { lat: 11.0168, lon: 76.9558 },
  "kochi": { lat: 9.9312, lon: 76.2673 },
  "cochin": { lat: 9.9312, lon: 76.2673 },
  "thiruvananthapuram": { lat: 8.5241, lon: 76.9366 },
  "trivandrum": { lat: 8.5241, lon: 76.9366 },
  "mysore": { lat: 12.2958, lon: 76.6394 },
  "mangalore": { lat: 12.9141, lon: 74.8560 },
  "visakhapatnam": { lat: 17.6868, lon: 83.2185 },
  "vizag": { lat: 17.6868, lon: 83.2185 },
  "vijayawada": { lat: 16.5062, lon: 80.6480 },
  "guntur": { lat: 16.3067, lon: 80.4365 },
  
  // East India
  "patna": { lat: 25.5941, lon: 85.1376 },
  "ranchi": { lat: 23.3441, lon: 85.3096 },
  "bhubaneswar": { lat: 20.2961, lon: 85.8245 },
  "cuttack": { lat: 20.4625, lon: 85.8830 },
  "guwahati": { lat: 26.1445, lon: 91.7362 },
  "siliguri": { lat: 26.7271, lon: 88.3953 },
  
  // Central India
  "raipur": { lat: 21.2514, lon: 81.6296 },
  "jabalpur": { lat: 23.1815, lon: 79.9864 },
  "gwalior": { lat: 26.2183, lon: 78.1828 },
};

/**
 * Calculate distance using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} - Distance in kilometers
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  const distance = R * c; // Distance in km
  
  return Math.round(distance);
};

/**
 * Get coordinates for a city (normalize city name)
 * @param {string} cityName - City name
 * @returns {object|null} - Coordinates {lat, lon} or null
 */
const getCityCoordinates = (cityName) => {
  if (!cityName) return null;
  
  // Normalize: lowercase, trim, remove extra spaces
  const normalized = cityName.toLowerCase().trim().replace(/\s+/g, ' ');
  
  return cityCoordinates[normalized] || null;
};

/**
 * Calculate distance between two cities (100% FREE - No API)
 * @param {string} origin - Origin city name
 * @param {string} destination - Destination city name
 * @returns {Promise<number>} - Distance in kilometers
 */
export const calculateDistance = async (origin, destination) => {
  try {
    const originCoords = getCityCoordinates(origin);
    const destCoords = getCityCoordinates(destination);
    
    if (!originCoords || !destCoords) {
      console.warn(`City not found in database: ${!originCoords ? origin : destination}`);
      // Return default distance if cities not found (500 km)
      return 500;
    }
    
    const distance = haversineDistance(
      originCoords.lat,
      originCoords.lon,
      destCoords.lat,
      destCoords.lon
    );
    
    // Add 20% to approximate road distance (Haversine gives straight-line)
    const roadDistance = Math.round(distance * 1.2);
    
    console.log(`✅ Distance calculated: ${origin} to ${destination} = ${roadDistance} km`);
    
    return roadDistance;
  } catch (error) {
    console.error("Error calculating distance:", error.message);
    // Return default distance on error
    return 500;
  }
};

/**
 * Calculate E-way Bill validity based on distance (GST/CBIC rules)
 * @param {number} distance - Distance in kilometers
 * @returns {number} - Validity in days
 */
export const calculateEwayBillValidity = (distance) => {
  // GST Rule: 1 day for every 100 km (or part thereof)
  return Math.ceil(distance / 100);
};

/**
 * Calculate E-way Bill expiry date
 * @param {Date} creationDate - Docket creation date
 * @param {number} validityDays - Number of days validity
 * @returns {Date} - Expiry date
 */
export const calculateExpiryDate = (creationDate, validityDays) => {
  const startDate = new Date(creationDate);
  
  // Start date is creation date + 1 day
  startDate.setDate(startDate.getDate() + 1);
  
  // Add validity days
  startDate.setDate(startDate.getDate() + validityDays);
  
  return startDate;
};

/**
 * Add new city to database (for admin use)
 * @param {string} cityName - City name
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 */
export const addCity = (cityName, lat, lon) => {
  const normalized = cityName.toLowerCase().trim();
  cityCoordinates[normalized] = { lat, lon };
  console.log(`✅ Added city: ${cityName} (${lat}, ${lon})`);
};