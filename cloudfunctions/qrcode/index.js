const cloud = require('wx-server-sdk')
const rp = require('request-promise')

cloud.init()

exports.main = async (event, context) => {
  const page = event.page
  const scene = event.scene

  //appid和秘钥
  const appid = 'wx56119e0fb60313a4',
    secret = '1b88bd5af96c913cf9ee56ca264cc602';

  const AccessToken_options = {
    method: 'GET',
    url: 'https://api.weixin.qq.com/cgi-bin/token',
    qs: {
      appid,
      secret,
      grant_type: 'client_credential'
    },
    json: true
  };

  //获取AccessToken
  const resultValue = await rp(AccessToken_options);
  const token = resultValue.access_token;

  //获取小程序码配置
  const code_options = {
    method: 'POST',
    url: 'https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=' + token,
    body: {
      page: page,
      width: 285,
      scene: scene,
      auto_color: true
    },
    json: true,
    encoding: null
  };

  //获取二进制图片
  const buffer = await rp(code_options);

  const upload = await cloud.uploadFile({
    cloudPath: 'qrcode_'+scene+'.png',
    fileContent: buffer,
  })
  return {
    wxacodefileID: upload.fileID
  }
}
