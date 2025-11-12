# Tabbar Icons

The tabbar requires icons for proper display. Please add the following icon files to this directory:

## Required Icons:

1. **home.png** - Home icon (inactive state)
   - Size: 81x81px (recommended)
   - Color: Gray (#8a8ea3)

2. **home-active.png** - Home icon (active state)
   - Size: 81x81px (recommended)
   - Color: Blue (#0f62fe)

3. **mine.png** - Mine/Profile icon (inactive state)
   - Size: 81x81px (recommended)
   - Color: Gray (#8a8ea3)

4. **mine-active.png** - Mine/Profile icon (active state)
   - Size: 81x81px (recommended)
   - Color: Blue (#0f62fe)

## To Enable Icons:

Once you've added the icon files, update `pages.json` tabBar configuration to include:

```json
"list": [
  {
    "pagePath": "pages/index/index",
    "text": "首页",
    "iconPath": "static/tabbar/home.png",
    "selectedIconPath": "static/tabbar/home-active.png"
  },
  {
    "pagePath": "pages/mine/index",
    "text": "我的",
    "iconPath": "static/tabbar/mine.png",
    "selectedIconPath": "static/tabbar/mine-active.png"
  }
]
```

## Icon Resources:

You can download free icons from:
- https://www.iconfont.cn/
- https://iconpark.oceanengine.com/
- https://www.flaticon.com/
