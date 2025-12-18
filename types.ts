
export interface BirdSpecies {
  id: string;
  name: string;
  latinName: string;
  taxonomy: {
    order: string;
    family: string;
    genus: string;
  };
  distribution: string[]; // List of provinces
  description?: string;
  createdAt: number;
}

export interface Observation {
  id: string;
  speciesId: string;
  date: string;
  province: string;
  location: string;
  count: number;
  notes: string;
  photo?: string; // base64
  audio?: string; // base64
  coords?: {
    lat: number;
    lng: number;
  };
  createdAt: number;
}

export type AppView = 'dashboard' | 'species' | 'observations' | 'regions' | 'admin';
