//index.js
const app = getApp()

Page({
  data: {
    CustomBar: app.globalData.CustomBar,
    avatarUrl: './user-unlogin.png',
    userInfo: {},
    logged: false,
    submited: false,
    showNumber: true,
    phone: '',
    memo: '临时停车，请多关照，扫码联系我'
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

    this.onGetOpenid();
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

  onGetOpenid: function() {
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

  setShow: function(e) {
    this.setData({
      showNumber: e.detail.value
    })
    this.counter({
      showNumber: this.data.showNumber
    });
  },

  onQuery: function() {
    const db = wx.cloud.database();
    db.collection('car').where({
      _openid: app.globalData.openid
    }).get({
      success: res => {
        this.setData({
          counterId: res.data[0]._id,
          phone: res.data[0].phone,
          memo: res.data[0].memo,
          showNumber: res.data[0].showNumber
        })
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '查询记录失败'
        })
      }
    });
  },

  formSubmit: function(e) {
    
    let data = {
      phone: e.detail.value.phone,
      memo: e.detail.value.memo
    }

    if (data.phone == '') {
      wx.showToast({
        title: '手机号码不能为空',
        icon: 'none'
      });
      return;
    }

    if(data.phone == this.data.phone && data.memo == this.data.memo) {
      wx.navigateTo({
        url: '/pages/qrcode/index'
      });
      return;
    }

    this.setData({
      submited: true
    })

    const db = wx.cloud.database();
    db.collection('car').where({
      _openid: app.globalData.openid
    }).get({
      success: res => {
        if (res.data.length > 0) {
          this.counter(data);
        }
        else {
          data.showNumber = true;
          this.add(data);
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

  add: function (data) {
    const db = wx.cloud.database();
    db.collection('car').add({
      data,
      success: res => {
        // 在返回结果中会包含新创建的记录的 _id
        this.setData({
          counterId: res._id,
          phone: data.phone,
          memo: data.memo,
          submited: false
        })
        wx.navigateTo({
          url: '/pages/qrcode/index'
        });
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '新增记录失败'
        })
      }
    })
  },

  counter: function (data) {
    const db = wx.cloud.database();
    db.collection('car').doc(this.data.counterId).update({
      data,
      success: res => {
        if(data.phone) {
          this.setData({
            phone: data.phone,
            memo: data.memo,
            submited: false
          })

          wx.navigateTo({
            url: '/pages/qrcode/index'
          });
        }
        else {
          let toastTitle = this.data.showNumber ? '手机号码已显示' : '手机号码已隐藏';
          wx.showToast({
            title: toastTitle,
          });
        }
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '保存记录失败'
        })
      }
    })
  }
})
