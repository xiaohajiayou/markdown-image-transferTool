Easy Markdown Migrate
====
<div align="center"><a href="https://github.com/xiaohajiayou/Easy-Markdown-Migrate/blob/dev/README.md"><strong>中文</strong> </a>| <strong>English</strong></div>

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square)](https://standardjs.com)  ![GitHub License](https://img.shields.io/github/license/xiaohajiayou/Easy-Markdown-Migrate)


**Easy Markdown Migrate** is a plugin designed for migrating `Markdown` files, binding files with the images linked within them, and helping users easily move, delete, copy, and paste files or content, making local management and image hosting backups simpler. 


Project Overview
---------------
With this plugin, users can focus on writing documents, and the plugin will automatically recognize image links in the files and match them with the corresponding images, allowing for quick sorting of files and images within the same directory.With just a simple click on the menu options `Migrate File` or `Copy Select Content`, `Paste Select Content`, you can migrate files and images to the desired location, achieving seamless migration of files and images, greatly improving the efficiency of document management.


In addition, Easy Markdown Migrate also provides functions such as image hosting upload, image download, image move, and image delete. These features can help developers who are used to local management to publish blog image hosting version backups; it can also facilitate developers who prefer image hosting management to download remote images to local for maintenance and local backup. These operations automatically maintain the relationship between images and files, ensuring the correctness of image links.

Our goal is to make `Markdown` document management not only efficient but also user-friendly. Even beginners who have never used `Markdown` can simply create an `./images` folder in the root directory to store all images and use the plugin's features to achieve reliable migration management.

How to Install
---------------
Install the plugin through the [Extension Marketplace](https://marketplace.visualstudio.com/vscode) or search within VSCode to use all local management features. If you need to use image hosting upload, complete the [image hosting configuration](https://github.com/xiaohajiayou/Easy-Markdown-Migrate/wiki/Easy%E2%80%90Markdown%E2%80%90Migrate-document) to use.

How to Use
---------------
After opening a Markdown file, a context menu will appear when you right-click in the editing area as follows: ![alt text](https://raw.githubusercontent.com/xiaohajiayou/imagesBed/main/test/easy-markdown-migrate_how_to_use/m4777wb8.png)  
The specific features apply to the following scenarios:
*   Analyze the image links in the current file: `Analyze Image Links`
*   Move the current file and images to another directory (automatically update image links): `Migrate Markdown File`
*   Copy/Cut the selected content (including images) in the current file to another file in a different directory:
    *   Copy the selected content: `Copy Select Content`
    *   Cut the selected content: `Cut Select Content`
    *   Paste the previously selected content: `Paste Select Content`
*   Upload local images to an image hosting service (automatically generate a file version on the image hosting service): `Upload Images`
*   Download remote images to local for backup (automatically update to local image links): `Download Images`
*   Select an image link in the file to move the image to another directory (automatically update the link): `Move Select Images`
*   Insert an image from a local directory and automatically convert it to a relative path: `Absolute<->Relative`
*   Select an image link in the file to delete the image to the trash (automatically remove the link): `Delete Select Images`
*   Delete the current file to discard the file and images to the trash (automatically update the links): `Drop File to Trash`

This plugin aims to reduce the cost of writing documents and make the process of writing casual documents more relaxed. Whether you are a beginner learning or a developer looking to improve management efficiency, Easy Markdown Migrate is an ideal choice for you.

Repository Address
---------------
https://github.com/xiaohajiayou/Easy-Markdown-Migrate  
Welcome to use it ! Feedback through issues and contributions are both very welcome.
