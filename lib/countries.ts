export interface CountryOption {
  name: string
  code: string
  flag: string
}

export const COUNTRY_LIST: CountryOption[] = [
  // Caribbean & West Indies
  { name: 'Barbados', code: 'BB', flag: '🇧🇧' },
  { name: 'Jamaica', code: 'JM', flag: '🇯🇲' },
  { name: 'Trinidad & Tobago', code: 'TT', flag: '🇹🇹' },
  { name: 'Guyana', code: 'GY', flag: '🇬🇾' },
  { name: 'Grenada', code: 'GD', flag: '🇬🇩' },
  { name: 'Carriacou', code: 'CQ', flag: '🇬🇩' },
  { name: 'St. Vincent & Grenadines', code: 'VC', flag: '🇻🇨' },
  { name: 'St. Lucia', code: 'LC', flag: '🇱🇨' },
  { name: 'Antigua & Barbuda', code: 'AG', flag: '🇦🇬' },
  { name: 'Dominica', code: 'DM', flag: '🇩🇲' },
  { name: 'St. Kitts & Nevis', code: 'KN', flag: '🇰🇳' },
  { name: 'Bahamas', code: 'BS', flag: '🇧🇸' },
  { name: 'Belize', code: 'BZ', flag: '🇧🇿' },
  { name: 'Suriname', code: 'SR', flag: '🇸🇷' },
  { name: 'Haiti', code: 'HT', flag: '🇭🇹' },
  { name: 'Dominican Republic', code: 'DO', flag: '🇩🇴' },
  { name: 'Cuba', code: 'CU', flag: '🇨🇺' },
  { name: 'Puerto Rico', code: 'PR', flag: '🇵🇷' },
  { name: 'Cayman Islands', code: 'KY', flag: '🇰🇾' },
  { name: 'Bermuda', code: 'BM', flag: '🇧🇲' },
  { name: 'Curaçao', code: 'CW', flag: '🇨🇼' },
  { name: 'Aruba', code: 'AW', flag: '🇦🇼' },
  { name: 'Martinique', code: 'MQ', flag: '🇲🇶' },
  { name: 'Guadeloupe', code: 'GP', flag: '🇬🇵' },
  { name: 'Sint Maarten', code: 'SX', flag: '🇸🇽' },
  { name: 'Turks & Caicos', code: 'TC', flag: '🇹🇨' },
  { name: 'Anguilla', code: 'AI', flag: '🇦🇮' },
  { name: 'Montserrat', code: 'MS', flag: '🇲🇸' },
  { name: 'British Virgin Islands', code: 'VG', flag: '🇻🇬' },
  { name: 'US Virgin Islands', code: 'VI', flag: '🇻🇮' },

  // Americas
  { name: 'United States', code: 'US', flag: '🇺🇸' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦' },
  { name: 'Mexico', code: 'MX', flag: '🇲🇽' },
  { name: 'Brazil', code: 'BR', flag: '🇧🇷' },
  { name: 'Argentina', code: 'AR', flag: '🇦🇷' },
  { name: 'Colombia', code: 'CO', flag: '🇨🇴' },
  { name: 'Chile', code: 'CL', flag: '🇨🇱' },
  { name: 'Peru', code: 'PE', flag: '🇵🇪' },
  { name: 'Uruguay', code: 'UY', flag: '🇺🇾' },
  { name: 'Venezuela', code: 'VE', flag: '🇻🇪' },
  { name: 'Ecuador', code: 'EC', flag: '🇪🇨' },
  { name: 'Costa Rica', code: 'CR', flag: '🇨🇷' },
  { name: 'Panama', code: 'PA', flag: '🇵🇦' },
  { name: 'Honduras', code: 'HN', flag: '🇭🇳' },
  { name: 'Guatemala', code: 'GT', flag: '🇬🇹' },
  { name: 'Paraguay', code: 'PY', flag: '🇵🇾' },
  { name: 'Bolivia', code: 'BO', flag: '🇧🇴' },

  // Europe
  { name: 'England', code: 'EN', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'Scotland', code: 'SC', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { name: 'Wales', code: 'WA', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { name: 'France', code: 'FR', flag: '🇫🇷' },
  { name: 'Spain', code: 'ES', flag: '🇪🇸' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪' },
  { name: 'Portugal', code: 'PT', flag: '🇵🇹' },
  { name: 'Italy', code: 'IT', flag: '🇮🇹' },
  { name: 'Netherlands', code: 'NL', flag: '🇳🇱' },
  { name: 'Belgium', code: 'BE', flag: '🇧🇪' },
  { name: 'Croatia', code: 'HR', flag: '🇭🇷' },
  { name: 'Serbia', code: 'RS', flag: '🇷🇸' },
  { name: 'Denmark', code: 'DK', flag: '🇩🇰' },
  { name: 'Sweden', code: 'SE', flag: '🇸🇪' },
  { name: 'Norway', code: 'NO', flag: '🇳🇴' },
  { name: 'Switzerland', code: 'CH', flag: '🇨🇭' },
  { name: 'Austria', code: 'AT', flag: '🇦🇹' },
  { name: 'Poland', code: 'PL', flag: '🇵🇱' },
  { name: 'Turkey', code: 'TR', flag: '🇹🇷' },
  { name: 'Greece', code: 'GR', flag: '🇬🇷' },
  { name: 'Ireland', code: 'IE', flag: '🇮🇪' },
  { name: 'Czech Republic', code: 'CZ', flag: '🇨🇿' },
  { name: 'Ukraine', code: 'UA', flag: '🇺🇦' },

  // Africa
  { name: 'Nigeria', code: 'NG', flag: '🇳🇬' },
  { name: 'Ghana', code: 'GH', flag: '🇬🇭' },
  { name: 'Cameroon', code: 'CM', flag: '🇨🇲' },
  { name: 'Senegal', code: 'SN', flag: '🇸🇳' },
  { name: 'Ivory Coast', code: 'CI', flag: '🇨🇮' },
  { name: 'Morocco', code: 'MA', flag: '🇲🇦' },
  { name: 'Egypt', code: 'EG', flag: '🇪🇬' },
  { name: 'South Africa', code: 'ZA', flag: '🇿🇦' },
  { name: 'Algeria', code: 'DZ', flag: '🇩🇿' },
  { name: 'Tunisia', code: 'TN', flag: '🇹🇳' },
  { name: 'Mali', code: 'ML', flag: '🇲🇱' },
  { name: 'Burkina Faso', code: 'BF', flag: '🇧🇫' },
  { name: 'Congo', code: 'CG', flag: '🇨🇬' },
  { name: 'DR Congo', code: 'CD', flag: '🇨🇩' },
  { name: 'Kenya', code: 'KE', flag: '🇰🇪' },
  { name: 'Uganda', code: 'UG', flag: '🇺🇬' },
  { name: 'Sierra Leone', code: 'SL', flag: '🇸🇱' },
  { name: 'Liberia', code: 'LR', flag: '🇱🇷' },

  // Asia & Oceania
  { name: 'Japan', code: 'JP', flag: '🇯🇵' },
  { name: 'South Korea', code: 'KR', flag: '🇰🇷' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺' },
  { name: 'New Zealand', code: 'NZ', flag: '🇳🇿' },
  { name: 'India', code: 'IN', flag: '🇮🇳' },
  { name: 'China', code: 'CN', flag: '🇨🇳' },
  { name: 'Philippines', code: 'PH', flag: '🇵🇭' },
  { name: 'Saudi Arabia', code: 'SA', flag: '🇸🇦' },
  { name: 'Qatar', code: 'QA', flag: '🇶🇦' },
  { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪' }
]

export function getCountryFlag(countryName?: string | null): string {
  if (!countryName) return '🇧🇧'
  const clean = countryName.trim().toLowerCase()
  const match = COUNTRY_LIST.find(
    c => c.name.toLowerCase() === clean || c.code.toLowerCase() === clean
  )
  return match ? match.flag : '🌐'
}
