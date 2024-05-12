'use strict';

const axios = require('axios');
const cloud = require('wx-server-sdk');

cloud.init();

const db = cloud.database();
const _ = db.command;
const Subscriptions = 'subscriptions';

const sendMessage = async (cardId, level, price) => {
  const docs = await db
    .collection(Subscriptions)
    .where({
      cardId,
      price: _.gte(price),
      level: _.eq(level),
    })
    .get();

  console.log(docs);

  const queue = docs.data.map(async (doc) => {
    const message = {
      name3: {
        value: '目标价已达成',
      },
      thing1: {
        value: `${doc.name || 'Cards Ahoy!'} - LV.${doc.level}`,
      },
      thing4: {
        value: `目标价格 $${doc.price}\n当前价格 $${price}`,
      },
    };
    console.log(message);
    await cloud.openapi.subscribeMessage.send({
      touser: doc._openid,
      page: `pages/detail/index?id=${cardId}`,
      lang: 'zh_CN',
      data: message,
      templateId: '7tACZmiQF0qnNR5v5PAUAF_i_bEEMNtQRbdbKZaPvJQ',
    });
    db.collection(Subscriptions).doc(doc._id).remove();
  });

  await Promise.all(queue).then(console.log).catch(console.error);
};

exports.main = async ({ cardId }, context, callback) => {
  const url = 'api/marketQuery/queryMarketHome';
  const response = await axios({
    method: 'post',
    url: `https://game.metalist.io/${url}`,
    headers: {
      'client-app-id': 'tbodfpihnlvhcaae',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'content-type': 'application/json',
    },
    data: JSON.stringify({
      sortType: 4,
      pageNumber: 1,
      pageSize: 10,
      firstCategoryId: 12,
      secondCategoryId: cardId,
      discreteList: [],
      continuityList: [],
      coinId: 1,
    }),
  });

  callback(null, response.data);

  const cards = response.data.data.list || [];

  const priceMap = cards.reduce((rst, cur) => {
    if (rst[cur.priorityTrait1]) return rst;
    const price = Number(cur.salePrice) / cur.accumulateTrait.value;
    return { ...rst, [cur.priorityTrait1]: price };
  }, {});

  console.log(priceMap);

  const queue = Object.keys(priceMap).map((key) => {
    const level = Number(key.match(/\d$/)[0]);
    return sendMessage(cardId, level, priceMap[key]);
  });

  await Promise.all(queue).then(console.log).catch(console.error);
};
