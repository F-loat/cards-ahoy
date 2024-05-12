const cloud = require('wx-server-sdk');

cloud.init({
  env: 'cards-ahoy-3g50hglqe5f630e4',
});

const db = cloud.database();
const _ = db.command;
const CARD_GROUPS = 'card_groups';

exports.main = async (event, context, callback) => {
  const { OPENID } = cloud.getWXContext();

  const t = new Date().setHours(0, 0, 0, 0);

  const doc = await db
    .collection(CARD_GROUPS)
    .where({
      _openid: OPENID,
      createAt: _.gt(t).and(_.lte(t + 86400000)),
    })
    .get();

  const data = {
    _openid: OPENID,
    leader: event.leader,
    members: event.members,
    cost: event.cost,
    honorPoints: event.honorPoints,
    price: Math.ceil(event.price * 100) / 100,
    faction: event.faction,
    createAt: Date.now(),
  };

  const res = doc.data.length
    ? await db.collection(CARD_GROUPS).doc(doc.data[0]._id).set({
        data,
      })
    : await db.collection(CARD_GROUPS).add({
        data,
      });

  callback(null, res);
};
