import {
  Card,
  CardFaction,
  CardFoil,
  CardRarity,
  CardSkills,
} from '../assets/cards';

const pointsMap = {
  [`${CardFoil.Gold}_${CardRarity.Common}`]: [
    1, 4, 9, 16, 26, 40, 58, 80, 106, 136,
  ],
  [`${CardFoil.Gold}_${CardRarity.Rare}`]: [
    1, 3, 6, 10, 15, 21, 28, 36, 46, 64,
  ],
  [`${CardFoil.Gold}_${CardRarity.Epic}`]: [1, 2, 4, 7, 11, 15, 20, 25, 30, 36],
  [`${CardFoil.Gold}_${CardRarity.Legendary}`]: [
    1, 2, 3, 5, 7, 9, 11, 13, 15, 18,
  ],
  [`${CardFoil.Regular}_${CardRarity.Common}`]: [
    1, 5, 15, 30, 60, 100, 150, 220, 300, 400,
  ],
  [`${CardFoil.Regular}_${CardRarity.Rare}`]: [
    1, 4, 10, 20, 35, 55, 80, 110, 140, 170,
  ],
  [`${CardFoil.Regular}_${CardRarity.Epic}`]: [
    1, 3, 6, 10, 16, 23, 31, 40, 50, 60,
  ],
  [`${CardFoil.Regular}_${CardRarity.Legendary}`]: [
    1, 2, 4, 6, 8, 11, 14, 17, 21, 26,
  ],
};

export const getPointsForCard = (card: Card, level: number = 1): number => {
  if (!card) return 0;
  return pointsMap[`${card.foil}_${card.rarity}`]?.[level - 1] || 0;
};

const honorPointsMap = {
  [`${CardFoil.Gold}_${CardRarity.Common}`]: [
    50, 200, 450, 800, 1300, 2000, 2900, 4000, 5300, 7140,
  ],
  [`${CardFoil.Gold}_${CardRarity.Rare}`]: [
    200, 600, 1200, 2000, 3000, 4200, 5600, 7200, 9200, 13440,
  ],
  [`${CardFoil.Gold}_${CardRarity.Epic}`]: [
    1000, 2000, 4000, 7000, 11000, 15000, 20000, 25000, 30000, 37800,
  ],
  [`${CardFoil.Gold}_${CardRarity.Legendary}`]: [
    5000, 10000, 15000, 25000, 35000, 45000, 55000, 65000, 75000, 94500,
  ],
  [`${CardFoil.Regular}_${CardRarity.Common}`]: [
    5, 25, 75, 150, 300, 500, 750, 1100, 1500, 2100,
  ],
  [`${CardFoil.Regular}_${CardRarity.Rare}`]: [
    20, 80, 200, 400, 700, 1100, 1600, 2200, 2800, 3570,
  ],
  [`${CardFoil.Regular}_${CardRarity.Epic}`]: [
    100, 300, 600, 1000, 1600, 2300, 3100, 4000, 5000, 6300,
  ],
  [`${CardFoil.Regular}_${CardRarity.Legendary}`]: [
    500, 1000, 2000, 3000, 4000, 5500, 7000, 8500, 10500, 13650,
  ],
};

export const getHonorPointsForCard = (
  card: Card,
  level: number = 1,
): number => {
  if (!card) return 0;
  return honorPointsMap[`${card.foil}_${card.rarity}`]?.[level - 1] || 0;
};

export const samrtCeil = (num: number) => {
  if (num > 1) {
    return Math.ceil(num * 100) / 100;
  }
  return Math.ceil(num * 1000) / 1000;
};

export const formatSkills = (skills?: CardSkills, level: number = 1) => {
  if (skills === undefined) return null;
  if (skills === null) {
    return '这个家伙很笨，什么都不会';
  }
  if (typeof skills === 'string') {
    return skills;
  }
  return skills.nums[level - 1].reduce((rst, cur, idx) => {
    return rst.replace(`{{${idx}}}`, String(cur));
  }, skills.text);
};

export const getLabelForFaction = (faction?: Card['faction']) => {
  switch (faction) {
    case CardFaction.Animal:
      return '动物';
    case CardFaction.Plant:
      return '植物';
    case CardFaction.Zombie:
      return '僵尸';
    case CardFaction.Mech:
      return '机器人';
    case CardFaction.Dragon:
      return '龙族';
    case CardFaction.Neutral:
      return '中立';
    default:
      return '未知';
  }
};
