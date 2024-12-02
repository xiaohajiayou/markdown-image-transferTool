Easy Markdown Migrate
====
<div align="center"><strong>中文</strong> | <a href="https://github.com/xiaohajiayou/Easy-Markdown-Migrate/blob/dev/README_en.md"><strong>English</strong></a></div>

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square)](https://standardjs.com)  ![GitHub License](https://img.shields.io/github/license/xiaohajiayou/Easy-Markdown-Migrate)


**Easy Markdown Migrate** 是一个针对`Markdown`文件迁移而设计的插件，实现文件与链接背后的图片绑定，帮助用户轻松地移动、删除、复制、粘贴文件或内容，让本地管理和图床备份变得更简单。



项目简介
---------------
通过这个插件，用户只需专注于撰写文档，插件会自动识别文件中的图片链接，并将其与背后图片匹配，可以实现同一级目录下文件与图片的快速分类。只需要简单的点击菜单选项`migrate file` 或`Copy Select content`、`Paste Select content` ，即可将文件与图片迁移到你所需的位置，实现文件与图片的无缝迁移，极大地提高了文档管理的效率。

此外，Easy Markdown Migrate 还提供了图床上传、图片下载、图片移动、图片删除等功能，这些内容可以帮助习惯本地管理的开发者发布博客所需的图床版本备份；也可以方便习惯图床管理的开发者，将远程图片下载到本地，维护本地备份。这些操作都自动维护图片与文件的关系，保证图片链接的正确性。

我们的目标是让`Markdown`文档管理不仅高效，而且更加小白友好。即使是从未使用过`Markdown`的新手，甚至可以只在根目录新建一个`./images`文件夹，在里面存放所有图片，然后通过插件的功能，实现可靠的迁移管理。

如何安装
---------------
通过[插件市场](https://marketplace.visualstudio.com/vscode)或vscode内搜索的方式，安装插件即可使用本地管理所有功能。如需要使用图床上传，完成[图床配置](https://github.com/xiaohajiayou/Easy-Markdown-Migrate/wiki/Easy%E2%80%90Markdown%E2%80%90Migrate-document)即可使用。

如何使用
---------------
打开Markdown文件后，在编辑页面右键出现菜单如下：![alt text](https://raw.githubusercontent.com/xiaohajiayou/imagesBed/main/test/easy-markdown-migrate_how_to_use/m4777wb8.png)

  具体功能适用场景如下：  
- 分析当前文件的图片链接:  `Analyze Image Links`  
- 移动当前文件和图片 --> 另外的目录（自动更新图片链接） :  `Migrate Markdown File`  
- 复制/剪切当前文件内选中内容（包括图片） --> 另外的目录下的文件内 : 
  - 复制所选择的内容:  `Copy Select Content`  
  - 剪切所选择的内容:  `Cut Select Content`  
  - 粘贴之前选择的内容:  `Paste Select Content`  
+ 上传本地图片 --> 图床（自动生成图床版文件） ：`Upload Images`  
+ 下载远程图片 --> 本地备份 （自动更新为本地图片链接）：`Download Images`  
- 选择文件内图片链接 --> 移动图片到另外的目录（自动更新链接） ：`Move Select Images`  
- 插入本地目录下的图片 --> 一键转换为相对路径 ：`Absolute<->Relative`  
+ 选择文件内的图片链接 --> 丢弃图片到垃圾桶（自动清除链接） ：`Delete Select Images`  
+ 删除当前文件 --> 丢弃文件与图片到垃圾桶（自动更新链接） ：`Drop File to Trash`  

这个插件旨在减少撰写文档的成本，同时也让撰写随笔文档的过程更加轻松。无论您是正在学习的新手还是希望提高管理效率的开发者，Easy Markdown Migrate 都是您的理想选择。


仓库地址
---------------
https://github.com/xiaohajiayou/Easy-Markdown-Migrate  
欢迎使用！issue 反馈和contribute 贡献都非常欢迎。
