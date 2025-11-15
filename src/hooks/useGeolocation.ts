import { useState, useEffect } from 'react';

interface GeolocationData {
  country: string;
  countryCode: string;
  city: string;
  region: string;
  phonePrefix: string;
  loading: boolean;
  error: string | null;
}

const COUNTRY_PHONE_PREFIXES: Record<string, string> = {
  US: '+1',
  CA: '+1',
  GB: '+44',
  AU: '+61',
  NZ: '+64',
  DE: '+49',
  FR: '+33',
  ES: '+34',
  IT: '+39',
  NL: '+31',
  SE: '+46',
  NO: '+47',
  DK: '+45',
  FI: '+358',
  IE: '+353',
  BE: '+32',
  AT: '+43',
  CH: '+41',
  PL: '+48',
  PT: '+351',
  GR: '+30',
  CZ: '+420',
  IN: '+91',
  CN: '+86',
  JP: '+81',
  KR: '+82',
  SG: '+65',
  MY: '+60',
  TH: '+66',
  ID: '+62',
  PH: '+63',
  VN: '+84',
  BR: '+55',
  MX: '+52',
  AR: '+54',
  CL: '+56',
  CO: '+57',
  PE: '+51',
  ZA: '+27',
  NG: '+234',
  KE: '+254',
  EG: '+20',
  AE: '+971',
  SA: '+966',
  IL: '+972',
  TR: '+90',
  RU: '+7',
  UA: '+380',
  PK: '+92',
  BD: '+880',
  LK: '+94',
};

/**
 * Hook to detect user's geolocation using IP-based geolocation API
 * Falls back to browser geolocation if API fails
 */
export function useGeolocation() {
  const [geolocation, setGeolocation] = useState<GeolocationData>({
    country: '',
    countryCode: '',
    city: '',
    region: '',
    phonePrefix: '',
    loading: true,
    error: null,
  });

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    try {
      // Try IP-based geolocation first (free service)
      const response = await fetch('https://ipapi.co/json/');
      
      if (response.ok) {
        const data = await response.json();
        
        setGeolocation({
          country: data.country_name || '',
          countryCode: data.country_code || '',
          city: data.city || '',
          region: data.region || '',
          phonePrefix: COUNTRY_PHONE_PREFIXES[data.country_code] || '+1',
          loading: false,
          error: null,
        });
      } else {
        throw new Error('IP geolocation failed');
      }
    } catch (error) {
      // Fallback: use timezone to guess country
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const countryCode = guessCountryFromTimezone(timezone);
      
      setGeolocation({
        country: countryCode,
        countryCode: countryCode,
        city: '',
        region: '',
        phonePrefix: COUNTRY_PHONE_PREFIXES[countryCode] || '+1',
        loading: false,
        error: 'Using timezone-based detection',
      });
    }
  };

  return geolocation;
}

/**
 * Guess country code from timezone (fallback method)
 */
function guessCountryFromTimezone(timezone: string): string {
  const timezoneMap: Record<string, string> = {
    'America/New_York': 'US',
    'America/Chicago': 'US',
    'America/Denver': 'US',
    'America/Los_Angeles': 'US',
    'America/Toronto': 'CA',
    'America/Vancouver': 'CA',
    'Europe/London': 'GB',
    'Europe/Paris': 'FR',
    'Europe/Berlin': 'DE',
    'Europe/Madrid': 'ES',
    'Europe/Rome': 'IT',
    'Europe/Amsterdam': 'NL',
    'Europe/Stockholm': 'SE',
    'Europe/Oslo': 'NO',
    'Europe/Copenhagen': 'DK',
    'Europe/Helsinki': 'FI',
    'Europe/Dublin': 'IE',
    'Europe/Brussels': 'BE',
    'Europe/Vienna': 'AT',
    'Europe/Zurich': 'CH',
    'Europe/Warsaw': 'PL',
    'Europe/Lisbon': 'PT',
    'Europe/Athens': 'GR',
    'Europe/Prague': 'CZ',
    'Asia/Tokyo': 'JP',
    'Asia/Seoul': 'KR',
    'Asia/Shanghai': 'CN',
    'Asia/Hong_Kong': 'CN',
    'Asia/Singapore': 'SG',
    'Asia/Kolkata': 'IN',
    'Asia/Dubai': 'AE',
    'Asia/Bangkok': 'TH',
    'Asia/Jakarta': 'ID',
    'Asia/Manila': 'PH',
    'Australia/Sydney': 'AU',
    'Australia/Melbourne': 'AU',
    'Pacific/Auckland': 'NZ',
    'America/Sao_Paulo': 'BR',
    'America/Mexico_City': 'MX',
    'America/Buenos_Aires': 'AR',
    'America/Santiago': 'CL',
    'America/Bogota': 'CO',
    'Africa/Johannesburg': 'ZA',
    'Africa/Cairo': 'EG',
  };

  return timezoneMap[timezone] || 'US';
}
