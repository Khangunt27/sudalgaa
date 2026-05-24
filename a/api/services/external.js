import axios from 'axios';
import translate from '@vitalets/google-translate-api';

// Set global axios default timeout to 60 seconds
axios.defaults.timeout = 60000;

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '';
const OPENTRIPMAP_API_KEY = process.env.OPENTRIPMAP_API_KEY || '';
const OPENTRIPMAP_BASE = 'https://api.opentripmap.com/0.1';

export async function fetchUnsplashImages(query, count = 6, retries = 2) {
  if (!UNSPLASH_ACCESS_KEY) {
    throw new Error('UNSPLASH_ACCESS_KEY is missing');
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.get('https://api.unsplash.com/search/photos', {
        params: {
          query,
          per_page: count,
          orientation: 'landscape',
          content_filter: 'high',
        },
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          'Accept-Version': 'v1',
        },
        timeout: 60000, // Increased to 60000ms (60 seconds) for better reliability
      });

      const results = Array.isArray(response.data?.results) ? response.data.results : [];

      return results.map((photo) => ({
        id: photo.id,
        description: photo.description || photo.alt_description || '',
        urls: {
          raw: photo.urls?.raw,
          full: photo.urls?.full,
          regular: photo.urls?.regular,
          small: photo.urls?.small,
          thumb: photo.urls?.thumb,
        },
        photographer: {
          name: photo.user?.name,
          profileUrl: photo.user?.links?.html,
          username: photo.user?.username,
        },
        location: photo.location?.name,
        color: photo.color,
      }));
    } catch (error) {
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');

      if (attempt === retries) {
        // Last attempt failed, return empty array instead of throwing to prevent app crashes
        console.error(`Unsplash API failed after ${retries + 1} attempts:`, error.message);
        if (isTimeout) {
          console.error('Unsplash API timeout - returning empty results');
        }
        return []; // Return empty array instead of throwing
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      const errorType = isTimeout ? 'timeout' : 'error';
      console.warn(`Unsplash API attempt ${attempt + 1} failed (${errorType}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export async function fetchOpenTripMapRadius({ lat, lon, radius = 5000, limit = 10, lang = 'en' }) {
  if (!OPENTRIPMAP_API_KEY) {
    throw new Error('OPENTRIPMAP_API_KEY is missing');
  }

  try {
    const response = await axios.get(`${OPENTRIPMAP_BASE}/${lang}/places/radius`, {
      params: {
        lat,
        lon,
        radius,
        limit,
        apikey: OPENTRIPMAP_API_KEY,
        rate: 2,
        format: 'json',
        kinds: 'interesting_places,cultural,museums,historic,natural,foods',
      },
      timeout: 60000,
    });

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('OpenTripMap radius fetch error:', error.message);
    return [];
  }
}


export async function fetchOpenTripMapPlace(xid, lang = 'en') {
  if (!OPENTRIPMAP_API_KEY) {
    throw new Error('OPENTRIPMAP_API_KEY is missing');
  }

  if (!xid) {
    throw new Error('OpenTripMap XID is required');
  }

  const response = await axios.get(`${OPENTRIPMAP_BASE}/${lang}/places/xid/${xid}`, {
    params: { apikey: OPENTRIPMAP_API_KEY },
    timeout: 60000, // Increased to 60000ms (60 seconds) for better reliability
  });

  return response.data;
}

export async function fetchOpenTripMapGeo(name, country = 'MN') {
  if (!OPENTRIPMAP_API_KEY) {
    throw new Error('OPENTRIPMAP_API_KEY is missing');
  }

  const response = await axios.get(`${OPENTRIPMAP_BASE}/en/places/geoname`, {
    params: {
      name,
      country,
      apikey: OPENTRIPMAP_API_KEY,
    },
    timeout: 60000, // Increased to 60000ms (60 seconds) for better reliability
  });

  return response.data;
}

export async function fetchWikimediaGeoImages(lat, lon, limit = 6, radius = 10000) {
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) {
    return [];
  }

  try {
    const response = await axios.get('https://commons.wikimedia.org/w/api.php', {
      params: {
        action: 'query',
        generator: 'geosearch',
        ggscoord: `${lat}|${lon}`,
        ggsradius: radius,
        ggslimit: limit,
        prop: 'pageimages',
        piprop: 'thumbnail',
        pithumbsize: 1200,
        format: 'json',
        origin: '*',
      },
      timeout: 10000,
    });

    const pages = response.data?.query?.pages || {};
    return Object.values(pages)
      .map((page) => page.thumbnail?.source)
      .filter((url) => typeof url === 'string' && url.startsWith('http'))
      .slice(0, limit);
  } catch (error) {
    console.warn('Wikimedia geo image fetch failed:', error.message);
    return [];
  }
}

export async function resolvePlaceImages({
  name,
  contextName = '',
  count = 3,
  country = 'MN',
}) {
  const safeCount = Math.max(1, Math.min(Number(count) || 3, 6));
  const cleanName = String(name || '').trim();
  const cleanContext = String(contextName || '').trim();
  const resolved = [];
  const seen = new Set();

  const pushUnique = (urls = []) => {
    for (const url of urls) {
      if (typeof url === 'string' && url.startsWith('http') && !seen.has(url)) {
        seen.add(url);
        resolved.push(url);
      }
      if (resolved.length >= safeCount) break;
    }
  };

  if (cleanName && OPENTRIPMAP_API_KEY) {
    try {
      const geo = await fetchOpenTripMapGeo(cleanName, country);
      if (geo?.lat && geo?.lon) {
        const nearbyImages = await fetchWikimediaGeoImages(geo.lat, geo.lon, safeCount);
        pushUnique(nearbyImages);
      }
    } catch (error) {
      console.warn('OpenTripMap geoname failed while resolving images:', error.message);
    }
  }

  if (resolved.length < safeCount && cleanName && UNSPLASH_ACCESS_KEY) {
    const queries = [
      `${cleanName} Mongolia`,
      cleanContext ? `${cleanName} ${cleanContext} Mongolia` : '',
      `${cleanName} landmark Mongolia`,
    ].filter(Boolean);

    for (const query of queries) {
      const images = await fetchUnsplashImages(query, safeCount, 1);
      pushUnique(
        images.map((img) => img.urls?.regular || img.urls?.full || img.urls?.small)
      );
      if (resolved.length >= safeCount) break;
    }
  }

  return resolved.slice(0, safeCount);
}

export async function translateIfNeeded(text, targetLang = 'mn') {
  if (!text || targetLang === 'en') {
    return text;
  }

  try {
    const { text: translated } = await translate(text, { to: targetLang });
    return translated;
  } catch (error) {
    console.warn('Translation failed, returning original text:', error.message);
    return text;
  }
}

