为 [Google 翻译](https://github.com/mantou132/GoogleTranslate) Mac App 添加浏览器上下文菜单支持；
目前只打包 Firefox 版本，Chrome 版本未通过测试

## 下载

Firefox: 文件夹 `web-ext-artifacts` 中下载

## 工作方式

扩展通过 [Native Messaging](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging) 启动无界面的“Google 翻译”，他将和“Google 翻译”建立，当浏览器端提交翻译命令时，通知“Google 翻译”

由于该扩展会启动无界面的“Google 翻译”，所以大约会占用 50M 内存
