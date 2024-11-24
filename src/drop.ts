import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getImages, escapeStringRegexp, logger,rename,
    newName, getAutoPath, saveFile, getValidFileName,getMdPath,getMdEditor} from './lib/common'
import { analyze,showStatus  } from './analyze';
import {openAndEditMarkdownFile} from './utils'

export async function drop() {


    let mdFilePath = getMdPath();
    if (!mdFilePath) {
        vscode.window.showErrorMessage('No file path found for the active document.');
        return;
    }
    // 获取 VSCode 窗口的根目录路径

    // 获取工作区的根路径
    let rootPath: string ;
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        // 通常，我们取第一个工作区根路径作为当前文件所属的工作区
        rootPath = workspaceFolders[0].uri.fsPath;
        // 确保当前文件确实在工作区内
        if (!mdFilePath.startsWith(rootPath)) {
            return '';
        }

    }else {
        return '';
    }
    

    // 构建 .recycle 目录路径
    const recycleImgPath = path.join(rootPath, '.recycle/images'); // 假设 .recycle 在扩展的根目录下

    // 检查 .recycle 文件夹是否存在，不存在则创建
    if (!fs.existsSync(recycleImgPath)) {
        try {
            fs.mkdirSync(recycleImgPath, { recursive: true });
            console.log(`Created directory: ${recycleImgPath}`);
        } catch (error) {
            console.error(`Failed to create directory: ${recycleImgPath}`, error);
            vscode.window.showErrorMessage(`Failed to create .recycle directory: ${error}`);
            return;
        }
    }
    const recycleBinPath = path.join(rootPath, '.recycle');


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
        let newFile = await getValidFileName(recycleImgPath, newFileName);
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



  
    // 构建目标文件路径
    const mdFileName = path.basename(mdFilePath);
    const mdTargetFilePath = path.join(recycleBinPath, mdFileName);

    try {

        // 移动文件
        fs.renameSync(mdFilePath, mdTargetFilePath);
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