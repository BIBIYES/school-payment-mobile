<template>
  <view class="cashier-page">
    <view class="loading-state" v-if="loading">
      <text class="loading-text">订单加载中...</text>
    </view>

    <view class="empty-state" v-else-if="!order">
      <text class="empty-title">无法找到订单</text>
      <text class="empty-desc">请返回重新发起缴费</text>
      <button class="back-btn" @click="goHome">返回首页</button>
    </view>

    <view v-else class="content">
      <view class="summary-card">
        <view class="summary-header">
          <text class="summary-title">{{ order.jobName || '缴费订单' }}</text>
          <text
            class="countdown"
            :class="{
              danger: !canPay || countdownDanger,
              expired: statusCode === 3
            }"
          >
            {{ countdownText }}
          </text>
        </view>
        <view class="amount-row">
          <text class="amount-symbol">¥</text>
          <text class="amount-value">{{ formatAmount(order) }}</text>
        </view>
        <view class="status-tag" :class="statusClass">
          {{ statusText }}
        </view>
      </view>

      <view class="info-card">
        <view class="info-row">
          <text class="info-label">订单号</text>
          <text class="info-value">{{ order.orderNo }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">学期</text>
          <text class="info-value">{{ order.termName || '-' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">创建时间</text>
          <text class="info-value">{{ formatDate(order.createdAt) }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">失效时间</text>
          <text class="info-value">
            {{ order.expireAt ? formatDate(order.expireAt) : '未设置' }}
          </text>
        </view>
      </view>

      <view class="pay-card">
        <view class="pay-info">
          <text class="pay-label">应付金额</text>
          <view class="pay-amount">
            <text class="amount-symbol">¥</text>
            <text class="amount-value">{{ formatAmount(order) }}</text>
          </view>
        </view>
        <button
          class="pay-btn"
          :disabled="!canPay || paying"
          @click="handlePay"
        >
          {{ payButtonText }}
        </button>
        <text class="pay-tips">
          请在
          <text class="highlight">{{ countdownText }}</text>
          内完成支付，逾期需重新下单
        </text>
      </view>

      <view v-if="statusCode === 1 && groupImageUrl" class="group-card">
        <view class="group-header">
          <text class="group-title">加入官方QQ群</text>
          <text class="group-subtitle">扫码加群，获取课程通知与学习资料</text>
        </view>
        <image
          class="group-qr"
          :src="groupImageUrl"
          mode="aspectFit"
          @click="previewImage(groupImageUrl)"
        />
        <button class="save-btn" @click="previewImage(groupImageUrl)">查看大图/保存</button>
      </view>
    </view>
  </view>
</template>

<script>
import { getOrderDetail, createOrderPayParams } from '@/services/order.js'

export default {
  data() {
    return {
      orderNo: '',
      order: null,
      loading: false,
      paying: false,
      countdownText: '--:--',
      countdownDanger: false,
      timer: null,
    }
  },
  onLoad(options) {
    this.orderNo = options?.orderNo || ''
    if (!this.orderNo) {
      uni.showToast({ title: '缺少订单号', icon: 'none' })
      setTimeout(this.goHome, 1200)
      return
    }
    this.fetchOrder()
  },
  onUnload() {
    this.stopCountdown()
  },
  onHide() {
    this.stopCountdown()
  },
  computed: {
    statusCode() {
      if (!this.order || this.order.payStatus === undefined) return -1
      return this.order.payStatus
    },
    statusText() {
      const map = {
        0: '待支付',
        1: '已支付',
        2: '支付失败',
        3: '已过期',
      }
      return map[this.statusCode] || '未知状态'
    },
    statusClass() {
      return {
        pending: this.statusCode === 0,
        success: this.statusCode === 1,
        failed: this.statusCode === 2,
        expired: this.statusCode === 3,
      }
    },
    canPay() {
      return this.statusCode === 0 && !this.isExpired()
    },
    payButtonText() {
      if (this.statusCode === 1) return '订单已支付'
      if (this.statusCode === 2) return '支付失败，请重试'
      if (this.statusCode === 3) return '订单已过期'
      return this.paying ? '调起支付中...' : '立即支付'
    },
    groupImageUrl() {
      const url = this.order?.qqGroupImagePath
      if (!url) return ''
      if (/^https?:\/\//i.test(url)) return url
      const base = import.meta.env?.VITE_API_BASE_URL || ''
      if (!base) return url
      return url.startsWith('/') ? `${base}${url}` : `${base.replace(/\/$/, '')}/${url}`
    },
  },
  methods: {
    async fetchOrder() {
      try {
        this.loading = true
        const data = await getOrderDetail(this.orderNo)
        this.order = data
        this.startCountdown()
      } catch (err) {
        const message = err?.message || '获取订单失败'
        uni.showToast({ title: message, icon: 'none', duration: 2000 })
        this.order = null
      } finally {
        this.loading = false
      }
    },
    startCountdown() {
      this.stopCountdown()
      if (!this.order || !this.order.expireAt) {
        this.countdownText = '--:--'
        return
      }
      this.updateCountdown()
      this.timer = setInterval(this.updateCountdown, 1000)
    },
    stopCountdown() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },
    updateCountdown() {
      if (!this.order || !this.order.expireAt) return
      const expireTs = new Date(this.order.expireAt).getTime()
      const diff = expireTs - Date.now()
      if (diff <= 0) {
        this.countdownText = '00:00'
        this.countdownDanger = true
        if (this.order.payStatus === 0) {
          this.order.payStatus = 3
        }
        this.stopCountdown()
        return
      }
      const minutes = Math.floor(diff / 1000 / 60)
      const seconds = Math.floor((diff / 1000) % 60)
      this.countdownText = `${String(minutes).padStart(2, '0')}:${String(
        seconds
      ).padStart(2, '0')}`
      this.countdownDanger = minutes < 1
    },
    isExpired() {
      if (!this.order || !this.order.expireAt) return false
      return new Date(this.order.expireAt).getTime() <= Date.now()
    },
    formatAmount(order) {
      const value = order?.payAmount ?? order?.amount
      if (!value && value !== 0) return '0.00'
      const num = Number(value)
      if (Number.isNaN(num)) return '0.00'
      return num.toFixed(2)
    },
    formatDate(timestamp) {
      if (!timestamp) return '-'
      const date = new Date(timestamp)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hour = String(date.getHours()).padStart(2, '0')
      const minute = String(date.getMinutes()).padStart(2, '0')
      const second = String(date.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`
    },
    goHome() {
      uni.switchTab({ url: '/pages/index/index' })
    },
    async handlePay() {
      if (!this.canPay) {
        uni.showToast({ title: '订单无法支付', icon: 'none' })
        return
      }
      try {
        this.paying = true
        uni.showLoading({ title: '正在调起支付...' })
        const payParams = await createOrderPayParams(this.order.orderNo)
        await this.invokeWxPayment(payParams)
        uni.showToast({ title: '支付成功', icon: 'success' })
        this.order.payStatus = 1
        this.stopCountdown()
      } catch (err) {
        const message = err?.message || '支付失败'
        uni.showToast({ title: message, icon: 'none' })
      } finally {
        this.paying = false
        uni.hideLoading()
      }
    },
    invokeWxPayment(params) {
      return new Promise((resolve, reject) => {
        if (uni.requestPayment) {
          uni.requestPayment({
            provider: 'wxpay',
            timeStamp: params.timeStamp,
            nonceStr: params.nonceStr,
            package: params.package,
            signType: params.signType || 'RSA',
            paySign: params.paySign,
            success: resolve,
            fail: (err) => {
              if (err.errMsg === 'requestPayment:fail cancel') {
                reject(new Error('支付已取消'))
              } else {
                reject(new Error(err.errMsg || '支付失败'))
              }
            },
          })
        } else if (typeof WeixinJSBridge !== 'undefined') {
          WeixinJSBridge.invoke(
            'getBrandWCPayRequest',
            {
              appId: params.appId,
              timeStamp: params.timeStamp,
              nonceStr: params.nonceStr,
              package: params.package,
              signType: params.signType || 'RSA',
              paySign: params.paySign,
            },
            (res) => {
              const msg = res?.err_msg || ''
              if (msg === 'get_brand_wcpay_request:ok') {
                resolve(res)
              } else if (msg === 'get_brand_wcpay_request:cancel') {
                reject(new Error('支付已取消'))
              } else {
                reject(new Error(msg || '支付失败'))
              }
            }
          )
        } else {
          reject(new Error('当前环境不支持微信支付'))
        }
      })
    },
    previewImage(url) {
      if (!url) return
      uni.previewImage({ urls: [url] })
    },
  },
}
</script>

<style scoped>
.cashier-page {
  min-height: 100vh;
  background: #f6f7fb;
  padding: 32rpx;
  box-sizing: border-box;
}

.loading-state,
.empty-state {
  margin-top: 120rpx;
  text-align: center;
  color: #8a8ea3;
}

.empty-title {
  display: block;
  font-size: 32rpx;
  margin-bottom: 12rpx;
}

.empty-desc {
  display: block;
  font-size: 26rpx;
  margin-bottom: 24rpx;
}

.back-btn {
  padding: 0 48rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 36rpx;
  background: linear-gradient(90deg, #1b57ff, #0f62fe);
  color: #fff;
  font-size: 28rpx;
  border: none;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.summary-card {
  background: linear-gradient(135deg, #0f62fe 0%, #1b57ff 100%);
  border-radius: 24rpx;
  padding: 32rpx;
  color: #fff;
  box-shadow: 0 12rpx 32rpx rgba(15, 98, 254, 0.2);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-title {
  font-size: 32rpx;
  font-weight: 600;
}

.countdown {
  font-size: 28rpx;
  padding: 8rpx 20rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.2);
}

.countdown.danger {
  background: rgba(255, 173, 51, 0.25);
  color: #ffd666;
}

.countdown.expired {
  background: rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.6);
}

.amount-row {
  display: flex;
  align-items: baseline;
  margin: 24rpx 0 12rpx;
}

.amount-symbol {
  font-size: 32rpx;
  margin-right: 8rpx;
}

.amount-value {
  font-size: 60rpx;
  font-weight: 700;
}

.status-tag {
  display: inline-flex;
  padding: 8rpx 20rpx;
  border-radius: 32rpx;
  font-size: 24rpx;
  background: rgba(255, 255, 255, 0.2);
}

.status-tag.pending {
  background: rgba(255, 255, 255, 0.2);
}

.status-tag.success {
  background: rgba(82, 196, 26, 0.25);
  color: #b7eb8f;
}

.status-tag.failed {
  background: rgba(255, 92, 92, 0.25);
  color: #ffccc7;
}

.status-tag.expired {
  background: rgba(0, 0, 0, 0.25);
  color: rgba(255, 255, 255, 0.6);
}

.info-card,
.pay-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 12rpx 30rpx rgba(15, 98, 254, 0.08);
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 26rpx;
  color: #8a8ea3;
}

.info-value {
  font-size: 26rpx;
  color: #1f2a44;
  text-align: right;
  word-break: break-all;
}

.pay-info {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 24rpx;
}

.pay-label {
  font-size: 26rpx;
  color: #8a8ea3;
}

.pay-amount {
  display: flex;
  align-items: baseline;
}

.pay-btn {
  width: 100%;
  height: 88rpx;
  border-radius: 44rpx;
  background: linear-gradient(90deg, #ffc371, #ff5f6d);
  color: #fff;
  font-size: 30rpx;
  border: none;
  font-weight: 600;
}

.pay-btn:disabled {
  opacity: 0.6;
}

.pay-tips {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #8a8ea3;
  text-align: center;
}

.highlight {
  color: #ff7875;
  margin: 0 4rpx;
}

.group-card {
  background: linear-gradient(135deg, #f7faff 0%, #eef3ff 100%);
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 12rpx 30rpx rgba(15, 98, 254, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.group-header {
  text-align: center;
}

.group-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2a44;
}

.group-subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #596074;
}

.group-qr {
  width: 360rpx;
  height: 360rpx;
  background: #fff;
  border-radius: 12rpx;
  border: 2rpx dashed #d6def8;
}

.save-btn {
  width: 100%;
  height: 80rpx;
  border-radius: 40rpx;
  background: linear-gradient(90deg, #1b57ff, #0f62fe);
  color: #fff;
  border: none;
  font-size: 28rpx;
  font-weight: 600;
}
</style>
