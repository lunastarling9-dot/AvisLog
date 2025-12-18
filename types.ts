
export interface BirdSpecies {
  id: string;
  name: string;
  latinName: string;
  taxonomy: {
    class?: string;
    order: string;
    family: string;
    genus: string;
    species?: string;
  };
  distribution: string[];
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
  photo?: string;
  audio?: string;
  coords?: {
    lat: number;
    lng: number;
  };
  createdAt: number;
}

export type AuthLevel = 'none' | 'admin' | 'master';
export type AppView = 'dashboard' | 'species' | 'observations' | 'regions' | 'admin';
