const cloud = require('wx-server-sdk');

cloud.init();

const db = cloud.database();
const _ = db.command;
const VOTES = 'votes';
const CARD_GROUPS = 'card_groups';

exports.main = async (event, context, callback) => {
  const { OPENID } = cloud.getWXContext();

  const t = new Date().setHours(0, 0, 0, 0);

  const doc = await db
    .collection(VOTES)
    .where({
      _openid: OPENID,
      type: event.type,
    })
    .get();

  if (
    doc.data.length &&
    doc.data[0].updateAt > Date.now() - 1000 * 60 * 60 * 24
  ) {
    return {
      code: 0,
      msg: event.type === 'up' ? '每人每天仅可点赞一次' : '每人每天仅可踩一次',
    };
  }

  if (!doc.data.length) {
    db.collection(VOTES).add({
      data: {
        _openid: OPENID,
        createAt: t,
        updateAt: t,
        type: event.type,
      },
    });
  } else {
    db.collection(VOTES)
      .doc(doc._id)
      .update({
        data: {
          updateAt: t,
        },
      });
  }

  const res = await db
    .collection(CARD_GROUPS)
    .doc(event.id)
    .update({
      data: {
        [event.type === 'up' ? 'up' : 'down']: _.inc(1),
      },
    });

  callback(null, {
    code: 200,
    data: res,
  });
};
