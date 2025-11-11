<template>
  <view class="mine-page">
    <view class="profile-card">
      <view class="avatar">{{ initials }}</view>
      <view class="info">
        <text class="name">重庆机电缴费助手</text>
        <text class="desc">公众号授权登录</text>
      </view>
    </view>

    <view class="section">
      <view class="section-title">当前登录态</view>
      <view class="field">
        <text class="field-label">OpenID</text>
        <text class="field-value">{{ openId || '未登录' }}</text>
      </view>
      <view class="field">
        <text class="field-label">Token</text>
        <text class="field-value">{{ tokenPreview }}</text>
      </view>
    </view>

    <view class="section">
      <button class="action-btn primary" @click="navigateHome">返回首页缴费</button>
      <button class="action-btn ghost" @click="redirectToOAuth">重新获取登录态</button>
      <button class="action-btn danger" @click="clearAuth">退出登录</button>
    </view>
  </view>
</template>

<script>
import { buildOAuthUrl } from '@/utils/oauth.js'

export default {
  data() {
    return {
      openId: '',
      token: '',
    }
  },
  computed: {
    tokenPreview() {
      if (!this.token) return '未生成'
      return `${this.token.slice(0, 12)}...`
    },
    initials() {
      return this.openId ? this.openId.slice(-2).toUpperCase() : '机电'
    },
  },
  onShow() {
    this.syncAuth()
  },
  methods: {
    syncAuth() {
      this.openId = uni.getStorageSync('openId') || ''
      this.token = uni.getStorageSync('token') || ''
    },
    clearAuth() {
      uni.removeStorageSync('token')
      uni.removeStorageSync('openId')
      this.syncAuth()
      uni.showToast({ title: '已退出' })
    },
    navigateHome() {
      uni.switchTab({ url: '/pages/index/index' })
    },
    redirectToOAuth() {
      if (typeof window === 'undefined') return
      this.clearAuth()
      window.location.href = buildOAuthUrl()
    },
  },
}
</script>

<style>
.mine-page {
  min-height: 100vh;
  padding: 48rpx 32rpx 120rpx;
  background: linear-gradient(180deg, #0f62fe 0%, #f2f5fa 30%);
  box-sizing: border-box;
}

.profile-card {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  padding: 32rpx;
  color: #fff;
  margin-bottom: 32rpx;
  backdrop-filter: blur(6px);
}

.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 48rpx;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 30rpx;
  margin-right: 24rpx;
}

.info .name {
  font-size: 32rpx;
  font-weight: 600;
}

.info .desc {
  font-size: 24rpx;
  opacity: 0.8;
}

.section {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 12rpx 32rpx rgba(15, 98, 254, 0.08);
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2a44;
  margin-bottom: 24rpx;
}

.field {
  margin-bottom: 20rpx;
}

.field-label {
  font-size: 24rpx;
  color: #8a8ea3;
}

.field-value {
  display: block;
  margin-top: 8rpx;
  font-size: 28rpx;
  color: #1f2a44;
  word-break: break-all;
}

.action-btn {
  width: 100%;
  margin-bottom: 20rpx;
  border-radius: 44rpx;
  height: 88rpx;
  line-height: 88rpx;
  font-size: 30rpx;
}

.action-btn.primary {
  color: #fff;
  background-image: linear-gradient(90deg, #1b57ff, #0f62fe);
  border: none;
}

.action-btn.ghost {
  color: #0f62fe;
  border: 2rpx solid rgba(15, 98, 254, 0.3);
  background: #f6f8ff;
}

.action-btn.danger {
  color: #ff5c5c;
  border: 2rpx solid rgba(255, 92, 92, 0.4);
  background: #fff5f5;
}
</style>
