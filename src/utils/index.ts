import { CardGroup } from '../pages/group/detail';
import { cardsMap, honorPointsMap, pointsMap } from '../assets/cards';
import { Card, CardFaction, CardFoil, CardSkills } from '../types';

export const noop = () => {};

export const getCard = (id: number) => cardsMap.get(Number(id)) || ({} as Card);

export const getPointsForCard = (card: Card, level: number = 1): number => {
  if (!card) return 0;
  return pointsMap[`${card.foil}_${card.rarity}`]?.[level - 1] || 0;
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
  if (!skills.nums.length) return skills.text;
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
      return null;
  }
};

export const getBonusesForGroup = (group: CardGroup) => {
  return group.members.reduce(
    (acc, member) =>
      acc + (getCard(member.id)?.foil === CardFoil.Gold ? 10 : 0),
    getCard(group.leader.id)?.foil === CardFoil.Gold ? 10 : 0,
  );
};
