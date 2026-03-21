export const ALL_CUISINES = 'All';

export type Restaurant = {
  name: string;
  url: string;
  blurb: string;
  lat: number;
  lon: number;
  googleMapsLink: string;
  cuisine: string;
};

export type CuisineCount = {
  cuisine: string;
  count: number;
};

export function getSortedRestaurants(restaurants: Restaurant[]) {
  return [...restaurants].sort((a, b) => a.name.localeCompare(b.name));
}

export function getCuisineCounts(restaurants: Restaurant[]): CuisineCount[] {
  const cuisineCounts = new Map<string, number>();

  restaurants.forEach((restaurant) => {
    cuisineCounts.set(restaurant.cuisine, (cuisineCounts.get(restaurant.cuisine) ?? 0) + 1);
  });

  return Array.from(cuisineCounts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([cuisine, count]) => ({ cuisine, count }));
}

export function filterRestaurants(restaurants: Restaurant[], selectedCuisine: string, nameQuery: string) {
  const normalizedNameQuery = nameQuery.trim().toLowerCase();

  return restaurants.filter((restaurant) => {
    const matchesCuisine = selectedCuisine === ALL_CUISINES || restaurant.cuisine === selectedCuisine;
    const matchesName = normalizedNameQuery === '' || restaurant.name.toLowerCase().includes(normalizedNameQuery);

    return matchesCuisine && matchesName;
  });
}
