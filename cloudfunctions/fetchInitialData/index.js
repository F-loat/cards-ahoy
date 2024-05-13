const http2 = require('http2');
const cloud = require('wx-server-sdk');

cloud.init({
  env: 'cards-ahoy-3g50hglqe5f630e4',
});

function get(host, path) {
  return new Promise((resolve, reject) => {
    const session = http2.connect(`https://${host}`, {
      minVersion: 'TLSv1.3',
      maxVersion: 'TLSv1.3',
    });
    session.on('error', (err) => {
      reject(err);
    });
    const req = session.request({
      [http2.constants.HTTP2_HEADER_AUTHORITY]: host,
      [http2.constants.HTTP2_HEADER_METHOD]: http2.constants.HTTP2_METHOD_GET,
      [http2.constants.HTTP2_HEADER_PATH]: path,
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36 Edg/100.0.1185.50',
    });
    req.setEncoding('utf8');
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      session.close();
      if (data) {
        try {
          resolve(data);
        } catch (e) {
          reject(e);
        }
      }
    });
    req.on('error', (err) => {
      reject(err);
    });
    req.end();
  });
}

exports.main = async (event, context, callback) => {
  const { OPENID } = cloud.getWXContext();

  try {
    const data = await get(
      'apespace.io',
      '/_api/token/data?chain=56&address=0xe0b1a112ee17ef376260ad347d0d9c38efdffe07',
    );
    callback(null, {
      openid: OPENID,
      notice: {
        text: `CAC 实时价格：$${Math.round((JSON.parse(data).price || 0) * 100000) / 100000} / 邀请码：881b0228`,
        copy: {
          content: '881b0228',
          message: '邀请码复制成功~',
        },
      },
      banners: [
        {
          img: 'cloud://cards-ahoy-3g50hglqe5f630e4.6361-cards-ahoy-3g50hglqe5f630e4-1325577246/banners/1.png',
          link: 'https://app.questn.com/quest/902449849208766663?invite_code=FGDENT',
        },
      ],
    });
  } catch (error) {
    console.log(error);
    callback(null, {
      openid: OPENID,
    });
  }
};
