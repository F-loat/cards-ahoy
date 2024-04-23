'use strict';

const axios = require('axios');

exports.main = async (
  { url, method, headers, body, ...params },
  context,
  callback,
) => {
  const response = await axios({
    method,
    url: `https://game.metalist.io/${url}`,
    headers: {
      'client-app-id': 'tbodfpihnlvhcaae',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'content-type': 'application/json',
      ...headers,
    },
    data: JSON.stringify(body),
    ...params,
  });

  callback(null, response.data);
};
