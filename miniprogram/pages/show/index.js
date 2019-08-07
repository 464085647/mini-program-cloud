//index.js
const app = getApp()

Page({
  data: {
    CustomBar: app.globalData.CustomBar,
    phone: '',
    memo: ''
  },

  onLoad: function (query) {
    if (query) {
      this.onQuery(query.scene)
    }
  },

  onQuery: function (id) {
    const db = wx.cloud.database();
    db.collection('car').where({
      _openid: id,
      showNumber: true

    }).get({
      success: res => {
        if(res.data.length > 0) {
          this.setData({
            phone: res.data[0].phone,
            memo: res.data[0].memo
          })
        }
        else {
          this.setData({
            memo: '车主目前已经隐藏号码显示'
          })
        }
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '查询记录失败'
        })
      }
    });
  },

  callCar: function() {
    wx.makePhoneCall({
      phoneNumber: this.data.phone
    })
  }
})
