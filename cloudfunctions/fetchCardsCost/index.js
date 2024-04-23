'use strict';

const axios = require('axios');

exports.main = async ({ cards }, context, callback) => {
  const fetch = ({ url, body }) =>
    axios({
      method: 'post',
      url: `https://game.metalist.io/${url}`,
      headers: {
        'client-app-id': 'tbodfpihnlvhcaae',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'content-type': 'application/json',
      },
      data: JSON.stringify(body),
    });

  const result = await Promise.all(
    cards.map((card) =>
      fetch({
        url: 'api/marketQuery/queryMarketHome',
        body: {
          sortType: 4,
          pageNumber: 1,
          pageSize: 1,
          firstCategoryId: 12,
          secondCategoryId: card,
          discreteList: [],
          continuityList: [],
          coinId: 1,
        },
      }),
    ),
  );

  const costs = result.map((item) => {
    const { salePrice, accumulateTrait } = item.data.data.list[0];
    return Number(salePrice) / accumulateTrait.value;
  });

  callback(null, costs);
};
