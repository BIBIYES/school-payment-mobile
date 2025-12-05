<template>
  <view class="mine-page">
    <!-- 用户信息卡片 -->
    <view class="profile-card">
      <image
        class="avatar"
        :src="userInfo.avatarUrl || '/static/default-avatar.png'"
        mode="aspectFill"
      />
      <view class="user-info">
        <text class="nickname">{{ userInfo.nickname || '未登录' }}</text>
        <view class="profile-status">
          <view
            class="status-badge"
            :class="{ completed: profileCompleted }"
          >
            {{ profileCompleted ? '资料已完善' : '资料未完善' }}
          </view>
        </view>
      </view>
      <button class="edit-btn" @click="goToProfile">
        <text class="edit-icon">✎</text>
      </button>
    </view>

    <!-- 订单列表 -->
    <view class="orders-section">
      <view class="section-header">
        <text class="section-title">我的订单</text>
        <text class="order-count" v-if="orders.length > 0">共{{ orders.length }}条</text>
      </view>

      <view class="loading-state" v-if="loading">
        <text class="loading-text">加载中...</text>
      </view>

      <view class="empty-state" v-else-if="orders.length === 0">
        <text class="empty-icon">📝</text>
        <text class="empty-text">暂无订单记录</text>
        <button class="go-pay-btn" @click="goToHome">去缴费</button>
      </view>

      <view class="order-list" v-else>
        <view
          class="order-card"
          v-for="order in orders"
          :key="order.id"
        >
          <view class="order-header">
            <text class="order-no">订单号：{{ order.orderNo }}</text>
            <view
              class="order-status"
              :class="{
                pending: getStatusCode(order) === 0,
                success: getStatusCode(order) === 1,
                failed: getStatusCode(order) === 2,
                expired: getStatusCode(order) === 3
              }"
            >
              {{ getStatusText(order) }}
            </view>
          </view>

          <view class="order-body">
            <view class="order-info-row">
              <text class="info-label">工种名称</text>
              <text class="info-value">{{ order.jobName }}</text>
            </view>
            <view class="order-info-row">
              <text class="info-label">批次</text>
              <text class="info-value">{{ order.batchName }}</text>
            </view>
            <view class="order-info-row">
              <text class="info-label">学期</text>
              <text class="info-value">{{ order.semester }}</text>
            </view>
            <view class="order-info-row">
              <text class="info-label">创建时间</text>
              <text class="info-value">{{ formatDate(order.createdAt) }}</text>
            </view>
            <view
              class="group-row"
              v-if="getStatusCode(order) === 1 && resolveUrl(order.qqGroupImagePath)"
            >
              <view class="group-text">
                <text class="info-label">加群二维码</text>
                <text class="info-value">长按或点击保存，获取学习通知</text>
              </view>
              <image
                class="group-thumb"
                :src="resolveUrl(order.qqGroupImagePath)"
                mode="aspectFill"
                @click="previewImage(resolveUrl(order.qqGroupImagePath))"
              />
            </view>
          </view>

          <view class="order-footer">
            <view class="price-section">
              <text class="price-label">缴费金额</text>
              <view class="price-wrapper">
                <text class="price-symbol">¥</text>
                <text class="price-value">{{ formatAmount(order) }}</text>
              </view>
            </view>
            <button
              v-if="getStatusCode(order) === 0"
              class="continue-pay-btn"
              @click="handleContinuePay(order)"
            >
              继续支付
            </button>
          </view>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </view>
  </view>
</template>

<script>
import { getMyOrders } from '@/services/order.js'

export default {
  data() {
    return {
      userInfo: {
        nickname: '',
        avatarUrl: '',
      },
      profileCompleted: false,
      orders: [],
      loading: false,
    }
  },
  onShow() {
    this.loadUserInfo()
    this.loadOrders()
  },
  methods: {
    loadUserInfo() {
      const nickname = uni.getStorageSync('nickname')
      const avatarUrl = uni.getStorageSync('avatarUrl')
      const profileCompleted = uni.getStorageSync('profileCompleted')

      this.userInfo.nickname = nickname || '未登录'
      this.userInfo.avatarUrl = avatarUrl || ''
      this.profileCompleted = profileCompleted || false
    },
    async loadOrders() {
      try {
        this.loading = true
        const data = await getMyOrders()
        this.orders = data || []
      } catch (err) {
        const message = err?.message || '加载订单失败'
        console.error('加载订单失败:', err)
        uni.showToast({ title: message, icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    goToProfile() {
      uni.navigateTo({ url: '/pages/profile/profile' })
    },
    goToHome() {
      uni.switchTab({ url: '/pages/index/index' })
    },
    resolveUrl(url = '') {
      if (!url) return ''
      if (/^https?:\/\//i.test(url)) return url
      const base = import.meta.env?.VITE_API_BASE_URL || ''
      if (!base) return url
      return url.startsWith('/') ? `${base}${url}` : `${base.replace(/\/$/, '')}/${url}`
    },
    previewImage(url) {
      const finalUrl = this.resolveUrl(url)
      if (!finalUrl) return
      uni.previewImage({ urls: [finalUrl] })
    },
    getStatusCode(order) {
      if (!order) return -1
      if (order.payStatus !== undefined && order.payStatus !== null) {
        return order.payStatus
      }
      if (order.paymentStatus !== undefined && order.paymentStatus !== null) {
        return order.paymentStatus
      }
      return -1
    },
    getStatusText(order) {
      const status = this.getStatusCode(order)
      const statusMap = {
        0: '待支付',
        1: '已支付',
        2: '支付失败',
        3: '已过期'
      }
      return statusMap[status] || '未知'
    },
    formatAmount(order) {
      const value = order?.payAmount ?? order?.amount
      if (value === undefined || value === null || value === '') {
        return '0.00'
      }
      const num = Number(value)
      if (!Number.isNaN(num)) {
        return num.toFixed(2)
      }
      const parsed = parseFloat(value)
      return Number.isNaN(parsed) ? '0.00' : parsed.toFixed(2)
    },
    formatDate(timestamp) {
      if (!timestamp) return '-'
      const date = new Date(timestamp)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hour = String(date.getHours()).padStart(2, '0')
      const minute = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hour}:${minute}`
    },
    handleContinuePay(order) {
      if (!order || !order.orderNo) {
        uni.showToast({ title: '订单信息缺失', icon: 'none' })
        return
      }
      uni.navigateTo({
        url: `/pages/cashier/cashier?orderNo=${order.orderNo}`,
      })
    },
    handleLogout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            // 清除本地存储
            uni.removeStorageSync('token')
            uni.removeStorageSync('openId')
            uni.removeStorageSync('nickname')
            uni.removeStorageSync('avatarUrl')
            uni.removeStorageSync('profileCompleted')

            uni.showToast({ title: '已退出登录', icon: 'success' })

            // 延迟后跳转到首页
            setTimeout(() => {
              uni.reLaunch({ url: '/pages/index/index' })
            }, 1500)
          }
        },
      })
    },
  },
}
</script>

<style scoped>
.mine-page {
  min-height: 100vh;
  background: #f6f7fb;
  padding-bottom: 120rpx;
}

/* 用户信息卡片 */
.profile-card {
  background: linear-gradient(135deg, #0f62fe 0%, #1b57ff 100%);
  padding: 48rpx 32rpx;
  display: flex;
  align-items: center;
  position: relative;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  margin-right: 24rpx;
}

.user-info {
  flex: 1;
}

.nickname {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #fff;
  margin-bottom: 12rpx;
}

.profile-status {
  display: flex;
  align-items: center;
}

.status-badge {
  padding: 8rpx 20rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 32rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  border: 2rpx solid rgba(255, 255, 255, 0.3);
}

.status-badge.completed {
  background: rgba(82, 196, 26, 0.2);
  color: #52c41a;
  border-color: #52c41a;
}

.edit-btn {
  width: 72rpx;
  height: 72rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 36rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.edit-icon {
  font-size: 32rpx;
  color: #fff;
}

/* 订单列表 */
.orders-section {
  padding: 32rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2a44;
}

.order-count {
  font-size: 24rpx;
  color: #8a8ea3;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 120rpx 0;
  background: #fff;
  border-radius: 24rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #8a8ea3;
}

.empty-icon {
  display: block;
  font-size: 96rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  display: block;
  font-size: 28rpx;
  color: #8a8ea3;
  margin-bottom: 32rpx;
}

.go-pay-btn {
  margin: 0 auto;
  width: 200rpx;
  height: 72rpx;
  line-height: 72rpx;
  background: linear-gradient(90deg, #1b57ff, #0f62fe);
  border-radius: 36rpx;
  font-size: 28rpx;
  color: #fff;
  border: none;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.order-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(15, 98, 254, 0.06);
}

.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #f0f2f7;
  margin-bottom: 20rpx;
}

.order-no {
  font-size: 24rpx;
  color: #8a8ea3;
}

.order-status {
  padding: 6rpx 16rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
}

.order-status.pending {
  background: #fff7e6;
  color: #fa8c16;
}

.order-status.success {
  background: #f6ffed;
  color: #52c41a;
}

.order-status.failed {
  background: #fff1f0;
  color: #ff4d4f;
}

.order-status.expired {
  background: #f5f5f5;
  color: #999;
}

.order-body {
  margin-bottom: 20rpx;
}

.order-info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.order-info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 26rpx;
  color: #8a8ea3;
}

.info-value {
  font-size: 26rpx;
  color: #1f2a44;
  font-weight: 500;
}

.order-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20rpx;
  border-top: 2rpx solid #f0f2f7;
}

.group-row {
  margin-top: 12rpx;
  padding: 16rpx;
  border: 2rpx dashed #d6def8;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  background: #f7faff;
}

.group-text {
  flex: 1;
}

.group-thumb {
  width: 140rpx;
  height: 140rpx;
  border-radius: 12rpx;
  background: #fff;
}

.price-section {
  flex: 1;
}

.price-label {
  display: block;
  font-size: 24rpx;
  color: #8a8ea3;
  margin-bottom: 8rpx;
}

.price-wrapper {
  display: flex;
  align-items: flex-end;
}

.price-symbol {
  font-size: 24rpx;
  color: #ff5c5c;
  margin-right: 4rpx;
}

.price-value {
  font-size: 40rpx;
  font-weight: 600;
  color: #ff5c5c;
}

.continue-pay-btn {
  padding: 0 32rpx;
  height: 64rpx;
  line-height: 64rpx;
  background: linear-gradient(90deg, #1b57ff, #0f62fe);
  border-radius: 32rpx;
  font-size: 26rpx;
  color: #fff;
  border: none;
}

.continue-pay-btn[disabled] {
  opacity: 0.6;
}

/* 退出登录 */
.logout-section {
  padding: 32rpx;
}

.logout-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #fff;
  border-radius: 44rpx;
  font-size: 30rpx;
  color: #ff5c5c;
  border: 2rpx solid #ffccc7;
}
</style>
