const cloud = require('wx-server-sdk');

cloud.init();

exports.main = async (event, context, callback) => {
  const { OPENID } = cloud.getWXContext();

  callback(null, {
    openid: OPENID,
    notice: {
      text: '邀请码 881b0228 领取 1000 游戏点券，点击复制',
      copy: {
        content: '881b0228',
        message: '复制成功',
      },
    },
  });
};
