
export interface BirdSpecies {
  id: string;
  name: string;
  latinName: string;
  taxonomy: {
    class?: string;  // 纲
    order: string;   // 目
    family: string;  // 科
    genus: string;   // 属
    species?: string; // 种/亚种
  };
  distribution: string[]; // 理论分布省份
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
