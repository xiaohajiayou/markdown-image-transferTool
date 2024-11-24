import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode';
import { getImages, escapeStringRegexp, logger,rename,
    newName, getAutoPath, saveFile, getValidFileName,getMdPath,getMdEditor} from './lib/common'
import { analyze,showStatus  } from './analyze';
import {openAndEditMarkdownFile} from './utils'

export async function moveAll(lf: string) {
    let localFolder = lf;

    let imageTargetFolder = path.join(localFolder, 'images');
    // 检查目标文件夹是否存在
    if (!fs.existsSync(imageTargetFolder)) {
        // 目标文件夹不存在，尝试创建它
        try {
            fs.mkdirSync(imageTargetFolder, { recursive: true }); // 使用 recursive 选项以创建所有必需的父目录
            console.log(`Created directory: ${imageTargetFolder}`);
        } catch (error) {
            // 创建目录时出错
            console.error(`Failed to create directory: ${imageTargetFolder}`, error);
            throw error; // 重新抛出错误，以便调用者可以处理
        }
    } else {
        console.log(`Directory already exists: ${imageTargetFolder}`);
    }


    let fileObj = getImages();
    if (fileObj.content == '') {
        return '';
    }
    let fileArr = fileObj.local; // 本地文件上传
    let fileMapping = fileObj.mapping; // 本地原始信息
    let content = fileObj.content;

    //downThread = thread;
    // 对网络图片去重，不必每次下载
    let set = new Set();
    fileArr.forEach((item) => set.add(item));
    let uniArr: string[] = Array.from(set) as string[];
    let count = 0, len = uniArr.length;
    for (let file of uniArr) {
        let newFileName = '';
        // 转移到目标路径 
        let imageFile = path.parse(file);
        if (rename) {
            // 文件重命名
            newFileName = newName() + imageFile.ext;
        } else {
            // 仅仅更换目录
            newFileName = imageFile.base;
        }
        let newFile = await getValidFileName(imageTargetFolder, newFileName);
        if (newFile == '') {
            logger.error(`get new image file name[${newFile}] fail!`);
            return '';
        }
        logger.info(`[${file}] move to [${newFile}], ${count}/${len}`, false);
        try{
            fs.renameSync(file,newFile);
            var reg = new RegExp( '!\\[([^\\]]*)\\]\\('+ escapeStringRegexp(fileMapping[file]) +'\\)','ig');
            let a = getAutoPath( newFile) ;
            content =  content.replace(reg,'![$1]('+ 'images/'+ newFileName+')'); // 内容替换
            count++;
        }catch(e)
        {
            logger.error('move error:');
            console.log(e);
        }
    }
    await saveFile(content,count);


    // 移动md文件
    // const activeTextEditor = vscode.window.activeTextEditor;
    // if (activeTextEditor == null) { return; }


    let mdFilePath = getMdPath();
    // let mdFilePath = getMdPath();
    if (!mdFilePath) {
        vscode.window.showErrorMessage('No file path found for the active document.');
        return;
    }
    // 构建目标文件路径
    const mdFileName = path.basename(mdFilePath);
    const mdTargetFilePath = path.join(localFolder, mdFileName);

    try {

        // 移动文件
        fs.renameSync(mdFilePath, mdTargetFilePath);
        vscode.window.showInformationMessage(`Moved Markdown file to: ${mdTargetFilePath}`);

        let currentEditor = getMdEditor(); // 获取初始活动文本编辑器
        if(currentEditor == null) { return; }

        // 如果当前活动编辑器是被移动的文件，则关闭它
  

        await vscode.window.showTextDocument(currentEditor.document, currentEditor.viewColumn)
        
        await   vscode.commands.executeCommand('workbench.action.closeActiveEditor')
    
        // 打开新位置的文件
        await   openAndEditMarkdownFile(mdTargetFilePath);
                    
        // 保存当前标签页
        let docTextEditor = vscode.window.activeTextEditor; // 获取当前活动文本编辑器
        if(docTextEditor == null) { return; }
        await docTextEditor.document.save();

        showStatus(docTextEditor);

    } catch (error) {
        // 类型保护
        if (error instanceof Error) {
            vscode.window.showErrorMessage(`Failed to move the Markdown file: ${error.message}`);
        } else {
            vscode.window.showErrorMessage(`Failed to move the Markdown file: ${String(error)}`);
        }
    }
}
