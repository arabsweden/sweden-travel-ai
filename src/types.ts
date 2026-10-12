export type Language = 'en' | 'ar' | 'sv';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export interface TravelPreferences {
  departureCountry: string;
  startDate: string;
  endDate: string;
  budget: 'Budget' | 'Comfort' | 'Luxury';
  travelers: {
    adults: number;
    children: number;
  };
  travelStyle: string;
  preferredCities: string[];
  transportation: string;
  hotelRating: number;
  dietaryPreferences: string;
  languagesSpoken: string;
}

export interface ItineraryActivity {
  time: string;
  title: string;
  description: string;
  location?: string;
  cost?: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  activities: ItineraryActivity[];
}

export interface SavedItinerary {
  id: string;
  userId: string;
  title: string;
  departureCountry: string;
  startDate: string;
  endDate: string;
  budget: string;
  travelStyle: string;
  preferredCities: string[];
  itineraryDays: ItineraryDay[];
  estimatedCosts: {
    accommodation: number;
    flights: number;
    food: number;
    transport: number;
    activities: number;
    shopping: number;
    insurance: number;
    emergency: number;
    total: number;
  };
  createdAt: string;
}

export interface FavoriteItem {
  id: string;
  userId: string;
  itemType: 'city' | 'attraction' | 'hotel' | 'restaurant';
  itemId: string;
  itemName: string;
  itemImage: string;
  savedAt: string;
}

export interface CityGuide {
  id: string;
  name: string;
  description: string;
  image: string;
  topAttractions: string[];
  museums: string[];
  nature: string[];
  shopping: string[];
  restaurants: string[];
  transportation: string[];
  bestHotels: string[];
  nightlife: string[];
  localFood: string[];
  walkingRoutes: string[];
  familyActivities: string[];
}

export interface Attraction {
  id: string;
  name: string;
  image: string;
  description: string;
  openingHours: string;
  ticketPrice: string;
  bestTime: string;
  duration: string;
  accessibility: string;
  familySuitability: string;
  photographyTips: string;
  history: string;
  interestingFacts: string;
  nearbyRestaurants: string[];
  nearbyHotels: string[];
}

export interface Hotel {
  id: string;
  city: string;
  name: string;
  stars: number;
  pricePerNight: number; // SEK
  image: string;
  rating: number;
  amenities: string[];
  bookingUrl: string;
  price?: number;
  desc?: string;
  location?: string;
  kidFriendly?: boolean;
  accessible?: boolean;
  sauna?: boolean;
  spa?: boolean;
}

export interface Restaurant {
  id: string;
  city: string;
  name: string;
  cuisine: string;
  isHalal: boolean;
  isVegetarian: boolean;
  priceRange: string; // 'Budget' | 'Moderate' | 'Luxury'
  rating: number;
  image: string;
  address: string;
  bookingUrl: string;
}

export interface TravelArticle {
  id: string;
  title: string;
  content: string;
  author: string;
  image: string;
  category: string;
  publishedAt: string;
}

export interface GoogleChatSpace {
  name: string;
  displayName: string;
  type: string;
}

export interface SearchResult {
  id: string;
  name: string;
  type: 'city' | 'attraction' | 'hotel' | 'restaurant';
  description: string;
  image: string;
}
