<template>
  <view class="page">
    <view class="card">
      <view class="card-header">学院缴费调试</view>
      <view class="price-wrapper">
        <text class="price-symbol">￥</text>
        <text class="price-value">{{ amountYuan }}</text>
      </view>
      <view class="tips">点击下方按钮发起一笔 1 元的微信 JSAPI 支付</view>
      <button
        class="pay-btn"
        type="primary"
        :loading="paying"
        :disabled="paying"
        @click="handlePay"
      >
        {{ paying ? '支付中...' : '立即支付 1.00 元' }}
      </button>
    </view>

    <view class="auth-info" v-if="openId">
      <text class="auth-label">当前 OpenID：</text>
      <text class="auth-value">{{ openId }}</text>
    </view>

    <view class="result" v-if="lastResult">
      <text class="result-label">最新状态：</text>
      <text class="result-text">{{ lastResult }}</text>
    </view>
  </view>
</template>

<script>
import { createJsapiOrder } from '@/services/pay.js'
import { miniLogin } from '@/services/auth.js'

export default {
  data() {
    return {
      amountYuan: '1.00',
      paying: false,
      lastResult: '',
      openId: '',
    }
  },
  onLoad() {
    this.ensureLogin().catch((err) => {
      const message = err?.message || '登录失败，请稍后重试'
      this.lastResult = message
      uni.showToast({ title: message, icon: 'none' })
    })
  },
  methods: {
    async handlePay() {
      if (this.paying) return
      await this.ensureLogin()
      this.paying = true
      this.lastResult = ''

      try {
        const orderNo = `TEST${Date.now()}`
        const payParams = await createJsapiOrder({ out_trade_no: orderNo })
        await this.invokeRequestPayment(payParams)
        this.lastResult = `支付成功，订单号：${orderNo}`
        uni.showToast({ title: '支付成功' })
      } catch (err) {
        if (err?.code === '401') {
          this.resetToken()
          uni.showToast({ title: '登录已过期，请重新尝试', icon: 'none' })
          await this.ensureLogin(true)
        }
        this.lastResult = err?.message || '支付失败，请重试'
        uni.showToast({ title: this.lastResult, icon: 'none' })
      } finally {
        this.paying = false
      }
    },
    async ensureLogin(force = false) {
      const cachedToken = uni.getStorageSync('token')
      const cachedOpenId = uni.getStorageSync('openId')
      if (!force && cachedToken && cachedOpenId) {
        this.openId = cachedOpenId
        return cachedToken
      }
      try {
        const loginRes = await this.wxLogin()
        const authInfo = await miniLogin(loginRes.code)
        uni.setStorageSync('token', authInfo.token)
        uni.setStorageSync('openId', authInfo.openId)
        this.openId = authInfo.openId
        return authInfo.token
      } catch (err) {
        this.resetToken()
        throw err
      }
    },
    resetToken() {
      uni.removeStorageSync('token')
      uni.removeStorageSync('openId')
      this.openId = ''
    },
    wxLogin() {
      return new Promise((resolve, reject) => {
        uni.login({
          provider: 'weixin',
          success: resolve,
          fail: (err) => reject(new Error(err?.errMsg || '获取微信登录态失败')),
        })
      })
    },
    invokeRequestPayment(params) {
      return new Promise((resolve, reject) => {
        if (!params) {
          reject(new Error('后端未返回支付参数'))
          return
        }
        const paymentPayload = {
          provider: 'wxpay',
          timeStamp: params.timeStamp,
          nonceStr: params.nonceStr,
          package: params.package,
          signType: params.signType || 'RSA',
          paySign: params.paySign,
        }
        if (!paymentPayload.timeStamp || !paymentPayload.paySign) {
          reject(new Error('支付参数不完整'))
          return
        }
        uni.requestPayment({
          ...paymentPayload,
          success: resolve,
          fail: (err) => reject(new Error(err?.errMsg || '支付已取消')),
        })
      })
    },
  },
}
</script>

<style>
.page {
  min-height: 100vh;
  padding: 64rpx 40rpx 120rpx;
  background: #f6f7fb;
  box-sizing: border-box;
}

.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx 40rpx 64rpx;
  box-shadow: 0 12rpx 32rpx rgba(17, 33, 74, 0.08);
}

.card-header {
  font-size: 32rpx;
  font-weight: 600;
  color: #1e2330;
  margin-bottom: 32rpx;
}

.price-wrapper {
  display: flex;
  align-items: flex-end;
  margin-bottom: 16rpx;
}

.price-symbol {
  font-size: 40rpx;
  color: #1e2330;
  margin-right: 4rpx;
}

.price-value {
  font-size: 72rpx;
  font-weight: 600;
  color: #1e2330;
}

.tips {
  font-size: 26rpx;
  color: #8a8ea3;
  margin-bottom: 48rpx;
}

.pay-btn {
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  background-image: linear-gradient(90deg, #2879ff, #0f62fe);
}

.result {
  margin-top: 40rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx 32rpx;
  font-size: 26rpx;
  color: #1e2330;
  display: flex;
}

.result-label {
  color: #8a8ea3;
  margin-right: 12rpx;
}

.result-text {
  flex: 1;
}

.auth-info {
  margin-top: 32rpx;
  font-size: 24rpx;
  color: #4f566b;
  word-break: break-all;
}

.auth-label {
  color: #8a8ea3;
  margin-right: 8rpx;
}

.auth-value {
  color: #1e2330;
}
</style>
