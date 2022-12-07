import * as topojson from 'topojson';
import capitals from './data/country-capitals.json';
import worldCountries from './data/world_countries_neocarto.json';

/**
 * Several functions to retrieve geographic data
 */

/** Returns topojson feature of world countries (loaded from world_countries_neocarto.json)
 */
const getCountryMap = () => {
  return topojson.feature(
    worldCountries,
    worldCountries.objects.world_countries_data
  );
}

/** Returns mapping of country codes to coordinates (loaded from country-capitals.json)
 */
const getLocationMap = () => {
  return capitals.reduce((acc, loc) => {
    acc[loc.CountryCode] = [loc.CapitalLongitude, loc.CapitalLatitude];
    return acc;
  }, {});
}

/** Returns mapping of country codes to country name (loaded from country-capitals.json)
 */
const getLocationNames = () => {
  return capitals.reduce((acc, loc) => {
    acc[loc.CountryCode] = loc.CountryName;
    return acc;
  }, {});
}

export { getCountryMap, getLocationMap, getLocationNames };
