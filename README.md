# QQ 店铺菜单（最简单公网版）

这是一个纯 HTML/CSS/JavaScript 项目：

- 顾客端：手机打开一个网页链接即可浏览店铺、分类、商品、价格和图片。
- 管理端：电脑浏览器打开 `admin/index.html`，可以改店铺名称、公告、分类、商品、价格、图片和显示状态。
- 发布：管理端直接通过 GitHub 官方 API 把 `data/store.json` 和新图片发布到 GitHub 仓库，然后由 GitHub Pages 对外提供网页。
- 不需要 Node、数据库、VPS，也不需要让你的电脑一直开机。

## 最终使用效果

顾客端链接类似：

`https://你的用户名.github.io/你的仓库名/`

复制这个链接发到 QQ，对方点击即可打开。

GitHub Pages 官方说明：GitHub Pages 可以直接把仓库里的 HTML、CSS 和 JavaScript 发布成网站。GitHub Free 对公开仓库可用。详见：
https://docs.github.com/en/pages/quickstart

## 第一次设置

### 1. 注册/登录 GitHub

进入 https://github.com/ 并登录。

### 2. 新建一个公开仓库

例如仓库名：

`my-store`

不要勾选额外模板也可以。

### 3. 把这个项目文件上传到仓库根目录

仓库里最终应该能看到：

- `index.html`
- `style.css`
- `app.js`
- `data/store.json`
- `admin/index.html`
- `admin/admin.js`
- `admin/admin.css`
- `assets/products/`

### 4. 开启 GitHub Pages

进入仓库：Settings → Pages。

Build and deployment → Source 选择 `Deploy from a branch`。

Branch 选择 `main`，文件夹选择 `/ (root)`，保存。

GitHub Pages 官方文档：
https://docs.github.com/en/pages/quickstart

等待发布后，顾客端就是：

`https://你的用户名.github.io/my-store/`

GitHub 文档说明发布更新可能需要几分钟才能生效。

### 5. 给管理端配置 GitHub Token

管理端访问：

`https://你的用户名.github.io/my-store/admin/`

第一次打开，在“一次性配置”中填写：

- GitHub 用户名：你的 GitHub 用户名
- 仓库名：my-store
- 分支：main
- Fine-grained Token：你的令牌

Token 需要这个仓库的：

`Contents → Read and write`

GitHub 官方 API 文档说明，Fine-grained personal access token 可以通过 Contents 写权限创建/更新仓库文件：
https://docs.github.com/en/rest/repos/contents

Token 只保存在当前浏览器 LocalStorage 中，不写入仓库文件。

### 6. 以后怎么用

打开管理端 → 读取店铺 → 修改商品 → 选择图片 → 点“一键发布”。

然后把顾客端链接发 QQ 即可。

## 注意

这是静态网站。不要把身份证、银行卡、客户隐私、订单隐私等敏感数据放进仓库。

管理端的 GitHub Token 不要发给任何人。这个项目没有后端密码认证；真正的发布权限由 GitHub Token 控制。
