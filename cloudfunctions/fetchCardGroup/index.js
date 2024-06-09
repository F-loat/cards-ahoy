const cloud = require('wx-server-sdk');

cloud.init({
  env: 'cards-ahoy-3g50hglqe5f630e4',
});

const db = cloud.database();
const _ = db.command;
const CARD_GROUPS = 'card_groups';

exports.main = async (
  { type, filters, pageNumber = 1, pageSize = 20 },
  context,
  callback,
) => {
  const params = {};

  if (type === 'self') {
    const { OPENID } = cloud.getWXContext();
    params._openid = _.eq(OPENID);
  }
  if (filters.factions?.length) {
    params.faction = _.in(filters.factions);
  }
  if (filters.cost) {
    params.cost = _.gte(filters.cost[0]).and(_.lte(filters.cost[1]));
  }
  if (filters.price) {
    params.price = _.gte(filters.price[0]).and(_.lte(filters.price[1]));
  }
  if (filters.level) {
    params['leader.level'] = _.gte(filters.level[0]).and(
      _.lte(filters.level[1]),
    );
  }
  if (filters.createAt) {
    params.createAt = _.gte(filters.createAt);
  }

  let query = db.collection(CARD_GROUPS);

  if (filters.sort) {
    query = query.orderBy('up', 'desc');
  }

  const res = await query
    .orderBy('createAt', 'desc')
    .skip(pageNumber - 1)
    .limit(pageSize)
    .where(params)
    .get();

  callback(null, res);
};
