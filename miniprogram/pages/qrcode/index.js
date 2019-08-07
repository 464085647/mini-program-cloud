//index.js
const app = getApp()

Page({
  data: {
    CustomBar: app.globalData.CustomBar,
    avatarUrl: './user-unlogin.png',
    userInfo: {},
    logged: false,
    memo: '',
    qrcodeUrl: ''
  },

  onLoad: function() {

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              this.setData({
                logged: true,
                avatarUrl: res.userInfo.avatarUrl,
                userInfo: res.userInfo
              })
            }
          })
        }
      }
    }),

    this.onGetOpenid()
  },

  onGetOpenid: function () {
    if (!app.globalData.openid) {
      wx.cloud.callFunction({
        name: 'login',
      }).then(res => {
        app.globalData.openid = res.result.OPENID
        this.onQuery()
      }).catch(err => {
        console.error('[云函数] [login] 调用失败', err)
      })
    }
    else {
      this.onQuery()
    }
  },

  onGetUserInfo: function(e) {
    if (!this.logged && e.detail.userInfo) {
      this.setData({
        logged: true,
        avatarUrl: e.detail.userInfo.avatarUrl,
        userInfo: e.detail.userInfo
      })
    }
  },

  onQuery: function() {
    const db = wx.cloud.database();
    db.collection('car').where({
      _openid: app.globalData.openid
    }).get({
      success: res => {
        this.setData({
          counterId: res.data[0]._id,
          memo: res.data[0].memo
        })

        this.qrCode()
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '查询记录失败'
        })
      }
    });
  },

  qrCode: function() {
    let fileID = 'cloud://car-qsdna.6361-car-qsdna-1259468298/qrcode_' + app.globalData.openid + '.png'
    wx.cloud.downloadFile({
      fileID: fileID,
      success: res => {
        console.log(1)
        this.setData({
          qrcodeUrl: res.tempFilePath
        })
      },
      fail: err => {
        console.log(2)
        wx.cloud.callFunction({
          name: 'qrcode',
          data: {
            page: 'pages/show/index',
            scene: app.globalData.openid
          },
          success: res => {
            this.setData({
              qrcodeUrl: res.result.wxacodefileID
            })
          },
          fail: err => {
            wx.showToast({
              icon: 'none',
              title: '生成二维码失败，请重试'
            })
          }
        })
      }
    })
  }
})
