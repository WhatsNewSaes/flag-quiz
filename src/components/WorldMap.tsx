import { memo, useEffect, useState, useCallback } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';

const DEFAULT_CENTER: [number, number] = [10, 25];
const DEFAULT_ZOOM = 1;

// Using Natural Earth 110m resolution for good performance
const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Mapping from Natural Earth numeric codes to ISO alpha-2
// This is a subset - we'll need to map the codes properly
const numericToAlpha2: Record<string, string> = {
  '004': 'AF', '008': 'AL', '012': 'DZ', '020': 'AD', '024': 'AO',
  '028': 'AG', '032': 'AR', '051': 'AM', '036': 'AU', '040': 'AT',
  '031': 'AZ', '044': 'BS', '048': 'BH', '050': 'BD', '052': 'BB',
  '112': 'BY', '056': 'BE', '084': 'BZ', '204': 'BJ', '064': 'BT',
  '068': 'BO', '070': 'BA', '072': 'BW', '076': 'BR', '096': 'BN',
  '100': 'BG', '854': 'BF', '108': 'BI', '132': 'CV', '116': 'KH',
  '120': 'CM', '124': 'CA', '140': 'CF', '148': 'TD', '152': 'CL',
  '156': 'CN', '170': 'CO', '174': 'KM', '178': 'CG', '180': 'CD',
  '188': 'CR', '384': 'CI', '191': 'HR', '192': 'CU', '196': 'CY',
  '203': 'CZ', '208': 'DK', '262': 'DJ', '212': 'DM', '214': 'DO',
  '218': 'EC', '818': 'EG', '222': 'SV', '226': 'GQ', '232': 'ER',
  '233': 'EE', '748': 'SZ', '231': 'ET', '242': 'FJ', '246': 'FI',
  '250': 'FR', '266': 'GA', '270': 'GM', '268': 'GE', '276': 'DE',
  '288': 'GH', '300': 'GR', '308': 'GD', '320': 'GT', '324': 'GN',
  '624': 'GW', '328': 'GY', '332': 'HT', '340': 'HN', '348': 'HU',
  '352': 'IS', '356': 'IN', '360': 'ID', '364': 'IR', '368': 'IQ',
  '372': 'IE', '376': 'IL', '380': 'IT', '388': 'JM', '392': 'JP',
  '400': 'JO', '398': 'KZ', '404': 'KE', '296': 'KI', '408': 'KP',
  '410': 'KR', '414': 'KW', '417': 'KG', '418': 'LA', '428': 'LV',
  '422': 'LB', '426': 'LS', '430': 'LR', '434': 'LY', '438': 'LI',
  '440': 'LT', '442': 'LU', '450': 'MG', '454': 'MW', '458': 'MY',
  '462': 'MV', '466': 'ML', '470': 'MT', '584': 'MH', '478': 'MR',
  '480': 'MU', '484': 'MX', '583': 'FM', '498': 'MD', '492': 'MC',
  '496': 'MN', '499': 'ME', '504': 'MA', '508': 'MZ', '104': 'MM',
  '516': 'NA', '520': 'NR', '524': 'NP', '528': 'NL', '554': 'NZ',
  '558': 'NI', '562': 'NE', '566': 'NG', '807': 'MK', '578': 'NO',
  '512': 'OM', '586': 'PK', '585': 'PW', '275': 'PS', '591': 'PA',
  '598': 'PG', '600': 'PY', '604': 'PE', '608': 'PH', '616': 'PL',
  '620': 'PT', '634': 'QA', '642': 'RO', '643': 'RU', '646': 'RW',
  '659': 'KN', '662': 'LC', '670': 'VC', '882': 'WS', '674': 'SM',
  '678': 'ST', '682': 'SA', '686': 'SN', '688': 'RS', '690': 'SC',
  '694': 'SL', '702': 'SG', '703': 'SK', '705': 'SI', '090': 'SB',
  '706': 'SO', '710': 'ZA', '728': 'SS', '724': 'ES', '144': 'LK',
  '736': 'SD', '740': 'SR', '752': 'SE', '756': 'CH', '760': 'SY',
  '158': 'TW', '762': 'TJ', '834': 'TZ', '764': 'TH', '626': 'TL',
  '768': 'TG', '776': 'TO', '780': 'TT', '788': 'TN', '792': 'TR',
  '795': 'TM', '798': 'TV', '800': 'UG', '804': 'UA', '784': 'AE',
  '826': 'GB', '840': 'US', '858': 'UY', '860': 'UZ', '548': 'VU',
  '336': 'VA', '862': 'VE', '704': 'VN', '887': 'YE', '894': 'ZM',
  '716': 'ZW', '-99': 'XK', // Kosovo
};

interface WorldMapProps {
  highlightedCountry: string; // ISO alpha-2 code
  answeredCountries: Map<string, boolean>; // code -> correct/incorrect
}

function WorldMapComponent({ highlightedCountry, answeredCountries }: WorldMapProps) {
  const [geoData, setGeoData] = useState<any>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);

  useEffect(() => {
    fetch(geoUrl)
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error('Failed to load map data:', err));
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.5, 8));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.5, 1));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(DEFAULT_ZOOM);
    setCenter(DEFAULT_CENTER);
  }, []);

  const handleMoveEnd = useCallback((position: { coordinates: [number, number]; zoom: number }) => {
    setCenter(position.coordinates);
    setZoom(position.zoom);
  }, []);

  if (!geoData) {
    return (
      <div className="w-full aspect-[2/1] bg-gray-100 rounded-xl flex items-center justify-center">
        <span className="text-gray-400">Loading map...</span>
      </div>
    );
  }

  const getCountryColor = (geo: any) => {
    const numericCode = geo.id || geo.properties?.id;
    const alpha2 = numericToAlpha2[numericCode] || geo.properties?.ISO_A2;

    if (!alpha2) return '#E5E7EB'; // gray-200

    // Current country to identify
    if (alpha2 === highlightedCountry) {
      return '#FCD34D'; // yellow-300
    }

    // Already answered
    if (answeredCountries.has(alpha2)) {
      return answeredCountries.get(alpha2) ? '#4ADE80' : '#F87171'; // green-400 / red-400
    }

    return '#E5E7EB'; // gray-200 (unanswered)
  };

  const getStrokeColor = (geo: any) => {
    const numericCode = geo.id || geo.properties?.id;
    const alpha2 = numericToAlpha2[numericCode] || geo.properties?.ISO_A2;

    if (alpha2 === highlightedCountry) {
      return '#F59E0B'; // amber-500
    }

    return '#9CA3AF'; // gray-400
  };

  const getStrokeWidth = (geo: any) => {
    const numericCode = geo.id || geo.properties?.id;
    const alpha2 = numericToAlpha2[numericCode] || geo.properties?.ISO_A2;

    if (alpha2 === highlightedCountry) {
      return 2;
    }

    return 0.5;
  };

  return (
    <div className="relative w-full bg-sky-100 rounded-xl overflow-hidden border border-retro-border/20">
      {/* Zoom Controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors font-bold text-lg"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors font-bold text-lg"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          onClick={handleReset}
          className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors font-bold text-lg"
          aria-label="Reset view"
        >
          ↺
        </button>
      </div>

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 140,
          center: [10, 25],
        }}
        style={{ width: '100%', height: 'auto' }}
        viewBox="0 -50 800 580"
      >
        <ZoomableGroup
          zoom={zoom}
          center={center}
          onMoveEnd={handleMoveEnd}
        >
          <Geographies geography={geoData}>
            {({ geographies }) =>
              geographies.map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getCountryColor(geo)}
                  stroke={getStrokeColor(geo)}
                  strokeWidth={getStrokeWidth(geo)}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}

export const WorldMap = memo(WorldMapComponent);
