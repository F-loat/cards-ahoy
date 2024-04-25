const cloud = require('wx-server-sdk');

cloud.init();

const db = cloud.database();
const _ = db.command;
const CARD_GROUPS = 'card_groups';

exports.main = async ({ type, filters }, context, callback) => {
  let query = db
    .collection(CARD_GROUPS)
    .orderBy('createAt', 'desc')
    .skip(0)
    .limit(50);

  if (type === 'self') {
    const { OPENID } = cloud.getWXContext();
    query = query.where({
      _openid: _.eq(OPENID),
    });
  }
  if (filters.faction !== 'All') {
    query = query.where({
      faction: filters.faction,
    });
  }
  if (filters.factions?.length) {
    query = query.where({
      faction: _.in(filters.factions),
    });
  }
  if (filters.cost) {
    query = query.where({
      cost: _.gte(filters.cost[0]).and(_.lte(filters.cost[1])),
    });
  }
  if (filters.price) {
    query = query.where({
      price: _.gte(filters.price[0]).and(_.lte(filters.price[1])),
    });
  }
  if (filters.level) {
    query = query.where({
      'leader.level': _.gte(filters.level[0]).and(_.lte(filters.level[1])),
    });
  }

  const res = await query.get();

  callback(null, res);
};
