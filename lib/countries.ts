export interface CountryOption {
  name: string
  code: string
  flag: string
}

export const COUNTRY_LIST: CountryOption[] = [
  { name: 'Barbados', code: 'BB', flag: '🇧🇧' },
  { name: 'Jamaica', code: 'JM', flag: '🇯🇲' },
  { name: 'Trinidad & Tobago', code: 'TT', flag: '🇹🇹' },
  { name: 'Guyana', code: 'GY', flag: '🇬🇾' },
  { name: 'Grenada', code: 'GD', flag: '🇬🇩' },
  { name: 'St. Vincent & Grenadines', code: 'VC', flag: '🇻🇨' },
  { name: 'St. Lucia', code: 'LC', flag: '🇱🇨' },
  { name: 'Antigua & Barbuda', code: 'AG', flag: '🇦🇬' },
  { name: 'Dominica', code: 'DM', flag: '🇩🇲' },
  { name: 'St. Kitts & Nevis', code: 'KN', flag: '🇰🇳' },
  { name: 'France', code: 'FR', flag: '🇫🇷' },
  { name: 'England', code: 'GB', flag: '🇬🇧' },
  { name: 'United States', code: 'US', flag: '🇺🇸' },
  { name: 'Brazil', code: 'BR', flag: '🇧🇷' },
  { name: 'Argentina', code: 'AR', flag: '🇦🇷' },
  { name: 'Nigeria', code: 'NG', flag: '🇳🇬' },
  { name: 'Ghana', code: 'GH', flag: '🇬🇭' },
  { name: 'Portugal', code: 'PT', flag: '🇵🇹' },
  { name: 'Spain', code: 'ES', flag: '🇪🇸' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦' },
  { name: 'Netherlands', code: 'NL', flag: '🇳🇱' },
  { name: 'Japan', code: 'JP', flag: '🇯🇵' },
  { name: 'Colombia', code: 'CO', flag: '🇨🇴' }
]

export function getCountryFlag(countryName?: string | null): string {
  if (!countryName) return '🇧🇧'
  const match = COUNTRY_LIST.find(
    c => c.name.toLowerCase() === countryName.trim().toLowerCase() || c.code.toLowerCase() === countryName.trim().toLowerCase()
  )
  return match ? match.flag : '🇧🇧'
}
