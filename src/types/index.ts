export enum CardType {
  Leaders = 'Leaders',
  Members = 'Members',
}

export enum CardFoil {
  Regular = 'Regular',
  Gold = 'Gold',
}

export enum CardRarity {
  Common = 'Common',
  Rare = 'Rare',
  Epic = 'Epic',
  Legendary = 'Legendary',
  Mythic = 'Mythic',
}

export enum CardFaction {
  Neutral = 'Neutral',
  Animal = 'Animal',
  Plant = 'Plant',
  Zombie = 'Zombie',
  Mech = 'Mech',
  Dragon = 'Dragon',
}

export type CardSkills =
  | null
  | string
  | {
      text: string;
      nums: number[][];
    };

export interface Card {
  id: number;
  image: string;
  name: string;
  nameEn: string;
  type: keyof typeof CardType;
  faction: keyof typeof CardFaction;
  rarity?: keyof typeof CardRarity;
  foil: keyof typeof CardFoil;
  cost: number;
  skills?: CardSkills;
  props?: [number, number?][];
}
