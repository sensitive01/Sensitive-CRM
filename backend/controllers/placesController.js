const axios = require('axios');

// Helper to delay execution (Google requires ~2 seconds before a next_page_token becomes valid)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance in km
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

const getNearbyPlaces = async (req, res) => {
  const { latitude, longitude, radius, type } = req.query;

  if (!latitude || !longitude || !radius || !type) {
    return res.status(400).json({ message: 'Missing required query parameters' });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  const searchQuery = encodeURIComponent(type.replace(/_/g, ' '));
  
  // We use radius (in meters) instead of rankby=distance so we can search further out.
  const radiusInMeters = parseFloat(radius) * 1000;
  const baseUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&keyword=${searchQuery}&radius=${radiusInMeters}&key=${apiKey}`;

  try {
    let allResults = [];
    let url = baseUrl;
    let hasNextPage = true;
    let pageCount = 0;
    
    let originalStatus = "ZERO_RESULTS";
    const targetRadius = parseFloat(radius);

    while (hasNextPage && pageCount < 3) {
      const response = await axios.get(url);
      
      if (response.data.status === 'OK') {
        originalStatus = 'OK';
        
        let exceededRadius = false;
        for (const place of response.data.results) {
          const placeLat = place.geometry?.location?.lat;
          const placeLng = place.geometry?.location?.lng;
          
          if (placeLat && placeLng) {
            const dist = getDistanceFromLatLonInKm(
              parseFloat(latitude), 
              parseFloat(longitude), 
              placeLat, 
              placeLng
            );
            
            if (dist <= targetRadius) {
              allResults.push(place);
            }
          }
        }
        
        // Since results are ordered by prominence (not distance), we don't break early.
        // We let it fetch all 3 pages if available to get as many results as possible within the radius.

      } else if (response.data.status !== 'ZERO_RESULTS' && response.data.status !== 'INVALID_REQUEST') {
        originalStatus = response.data.status;
        console.error("API Error Status:", response.data.status);
        break;
      }

      if (response.data.next_page_token) {
        await sleep(2000);
        url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${response.data.next_page_token}&key=${apiKey}`;
        pageCount++;
      } else {
        hasNextPage = false;
      }
    }

    res.json({
      status: originalStatus,
      results: allResults
    });
  } catch (error) {
    console.error('Error fetching nearby places:', error.message);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

const getPlacePhoto = async (req, res) => {
  const { photoreference } = req.query;
  if (!photoreference) return res.status(400).json({ error: 'Missing photoreference' });

  const apiKey = process.env.GOOGLE_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoreference}&key=${apiKey}`;

  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
    });
    // Pipe the image stream directly to the frontend
    response.data.pipe(res);
  } catch (error) {
    console.error('Error fetching place photo:', error.message);
    res.status(500).json({ error: 'Failed to fetch place photo' });
  }
};

module.exports = { getNearbyPlaces, getPlacePhoto };
