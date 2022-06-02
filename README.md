# chorme-plugin-forceJump
#### 适用范围
chorme浏览器
#### 适用网站
掘金、简书、csdn
#### 简介
在浏览掘金、简书、csdn等文章时，如果文章里面添加了链接，这时当我们点击这个链接时，是不会直接跳转过去的，会先进入到一个页面跳转安全提示的页面，个人觉得这个页面是有点多余的
于是就简单实现了这个可以直接跳转页面的插件
#### 安装方法
- 下载完项目代码.zip后,直接解压 （修改文件名如： forceJump）
- 打开chrome://extensions/地址进入扩展程序管理页面
- 开启右上角的`开发者模式`
- 点击左上角的`加载已解压的扩展程序`，选择刚才的文件夹
- 安装成功

#### 注意
浏览器版本高于88在安装时可能会出现错误警告(不影响正常使用)
这是由于manifest_version的版本为2的缘故。在未来版本3中，background脚本会作为service worker被加载，也就是说不能在后台脚本操作dom了，详见https://developer.chrome.com/docs/extensions/mv3/mv3-migration-checklist/
