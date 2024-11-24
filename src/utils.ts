import { mdCheck, showInVscode, setPara, timeoutPromise,clearMsg, logger,escapeStringRegexp } from './lib/common';


import { download } from './lib/download';
import { getLang } from './lib/lang';

import { analyze } from './analyze';
import { moveAll } from './moveAll';
import { drop } from './drop';
import { moveImg } from './moveImg';  

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
/*
import * as nls from 'vscode-nls';
const localize = nls.config({
    bundleFormat: nls.BundleFormat.standalone,
    messageFormat: nls.MessageFormat.both
})();
//const localize = nls.loadMessageBundle();
// 匹配对应的 i18n\zh-cn\xxx.i18n.json 文件
// 打开新文件
// let document = vscode.window.activeTextEditor?.document;
// if(document != null)
// {
//     let pat = 'd:\\test.txt';
//     let newUri = document.uri.with({ path: pat });
//     await vscode.window.showTextDocument(newUri, { preview: false });
// }
*/

let imagePathBracket = 'auto';

export async function vscAnalyze() {
    // vscode.window.showInformationMessage(getLang('hello'))
    analyze();
    showInVscode();
}
export async function vscClean(flag:boolean=false) {
    // cleanMD(flag);
    showInVscode();
}
export async function vscDownload() {
    await download()
    showInVscode();
}
export async function vscMove() {
    const result = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: getLang('moveHint')
    });

    if (!result || result.length === 0) {
        return;
    }

    let localFolder: string = result[0].fsPath;
    console.log(`Will Move images to localFolder[${localFolder}]`)                            
    await moveImg(localFolder);
    showInVscode();
}
export async function vscTransfer() {
    const result = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: getLang('moveHint')
    });

    if (!result || result.length === 0) {
        return;
    }

    let localFolder: string = result[0].fsPath;
    console.log(`Will Move md_file&&images to localFolder[${localFolder}]`)
    
    await moveAll(localFolder);
    showInVscode();
}

export async function vscDropFile() {

    await drop();
    showInVscode();
}

// 上传所选图片/剪切板图片
// export async function vscUpload(clip:boolean=false) {
//     if (!await upCheck()) {
//         showInVscode();
//         return;
//     }
//     await upload(clip);
//     showInVscode();
// }
// 插入剪切板图片




// 初始化参数，参数保存于 common模块中
export function initPara() {
    clearMsg();
    let extendName = 'markdown-image-transfer';
    let hasBracket = vscode.workspace.getConfiguration(extendName).get('hasBracket') as string;
    let updateLink = vscode.workspace.getConfiguration(extendName).get('updateLink') as boolean;
    let skipSelectChange = vscode.workspace.getConfiguration(extendName).get('skipSelectChange') as boolean;
    let rename = vscode.workspace.getConfiguration(extendName).get('rename') as boolean;
    let remotePath: string = vscode.workspace.getConfiguration(extendName).get('remotePath') || '<filename>';
    let imageSaveFolder: string = vscode.workspace.getConfiguration(extendName).get('imageSaveFolder') || '<filename>.assets';
    let removeFolder: string = vscode.workspace.getConfiguration(extendName).get('removeFolder') || 'md-img-remove';
    let dlTimeout: number = vscode.workspace.getConfiguration(extendName).get('timeoutDownload') || 10;
    let ulTimeout: number = vscode.workspace.getConfiguration(extendName).get('timeoutUpload') || 10;
    let clipboardPath: string = vscode.workspace.getConfiguration(extendName).get('clipboardPath') || '<filename>.assets/<YYMMDDHHmmss>.png';
    let urlFormatted: boolean = vscode.workspace.getConfiguration(extendName).get('urlFormatted') || true;
    if(dlTimeout<=0) {dlTimeout =10;}
    if(ulTimeout<=0) {ulTimeout =10;}
    //const isAsync: boolean = vscode.workspace.getConfiguration().get('downloadImageInMarkdown.isAsync') as boolean;
    setPara(hasBracket, rename, updateLink,skipSelectChange, imageSaveFolder, remotePath
        , removeFolder,dlTimeout,ulTimeout,clipboardPath,urlFormatted);

    imagePathBracket = hasBracket; // 全局变量，用于判断是否需要带括号

    let file = vscode.window.activeTextEditor?.document.uri.fsPath || '';
    if (!mdCheck(file)) {
        showInVscode();
        return false;
    }
    return true;
}


export function getStatus(docTextEditor: vscode.TextEditor | undefined): {local: string[], net: string[], invalid: string[], mapping: Record<string, any>, content: string } {
    var picArrLocal: string[] = [];
    var oriMapping = {};
    var picArrInvalid: string[] = [];
    var picArrNet: string[] = [];
    var str = '';
    let retObj = { local: picArrLocal, net: picArrNet, invalid: picArrInvalid, mapping: oriMapping, content: str };
 
    let editContent = '';
    logger.info(`currentEditor is [${docTextEditor?.document.uri.fsPath}]`);
    const currentEditor = docTextEditor;
    if (currentEditor == null) {
        logger.error(getLang('docAct'))
        return retObj;
    }

    if (currentEditor == null) {
        logger.error(getLang('docAct'))
        return retObj;
    }
    let document = currentEditor.document; // 当前编辑内容 ，可能因选择文件等导致不是当前文件
    // 对整个文件内容操作
    if (document.isDirty) { // 文件是否被修改过
        logger.error(getLang('docDirty'))
        return retObj;
    }
    editContent = document?.getText(); // 当前编辑内容;

    try {
        // str = fs.readFileSync(mdfileName).toString();
        str = editContent; // 文本内容覆盖过去
        // 正则格式
        var reg;
        if (imagePathBracket == 'yes') {
            reg = /!\[[^\]]*\]\((.*)\)/g; // 适配所有格式的图片,贪婪匹配可能多个连续的图片被包含
        } else {
            // imagePathBracket =='no' or auto
            reg = /!\[[^\]]*\]\((.*?)\)/g; // 图片路径中没括号，非贪婪匹配
        }
        //const pattern = /!\[(.*?)\]\((.*?)\)/gm // 匹配图片正则
        // const imgList = str.match(pattern) || [] // ![img](http://hello.com/image.png)
        // let tmpPicArrNet: string[] = [],tmpPicArrLocal: string[]=[],tmpPicArrInvalid: string[]=[],tmpOriMapping={};
        findStatus(document.uri.fsPath,reg, str, imagePathBracket == 'auto', picArrNet, picArrLocal, picArrInvalid, oriMapping);
        /*if(picArrInvalid.length>0 && )
        {
            // 尝试有括号重新查找
            //reg = /!\[[^\]]*\]\((.*)\)/g;  // 不能有空格
            // tmpPicArrNet = [],tmpPicArrLocal=[],tmpPicArrInvalid=[],tmpOriMapping={}; // 复位
            //picArrNet =[],picArrLocal=[],picArrInvalid=[],oriMapping={}
            findImage(reg,str,true,picArrNet,picArrLocal,picArrInvalid,oriMapping);
        }*/
        // 进行解构赋值
        // ({picArrNet,picArrLocal,picArrInvalid,oriMapping} = {tmpPicArrNet,tmpPicArrLocal,tmpPicArrInvalid,tmpOriMapping});
    } catch (e: any) {
        console.log(e.message);
    }
    if (picArrInvalid.length > 0) {
        logger.error(getLang('invaldimage', picArrInvalid.length));
        logger.error(`${picArrInvalid.join('\n')}`);
    }
    retObj = { local: picArrLocal, net: picArrNet, invalid: picArrInvalid, mapping: oriMapping, content: str };
    return retObj; //{ local: picArrLocal, net: picArrNet, mapping: oriMapping, content: str };
}


export function findStatus(mdFile: string,reg: any, str: string, auto: boolean, tmpPicArrNet: string[], tmpPicArrLocal: string[], tmpPicArrInvalid: string[], tmpOriMapping: Record<string, any>) {
    //var mdfileName = fs.realpathSync(mdFile);
    var mdfilePath = path.dirname(mdFile); //arr.join('/'); // 获取文件路径
    while (true) {
        let matched = reg.exec(str);
        if (matched == null) { break; }
        let oriFlepath: string = matched[1];
        // 自动抵消匹配括号
        if (auto && oriFlepath.indexOf('(') > 0) {
            var reg2 = new RegExp('!\\[([^\\]]*)\\]\\(' + escapeStringRegexp(oriFlepath) + '\\)', 'ig');
            str = str.replace(reg2, '![$1](' + oriFlepath.replace('(', '<LB>') + '<RB>'); // 内容替换<RB>
            reg.lastIndex = matched.index; // 动态调整，重新正则匹配
            continue;
        }
        // 首先要判断文件路径，对于http https 路径忽略，对于没有写盘符的路径，加上 targetFile 的路径
        oriFlepath = oriFlepath.replace(/<LB>/g, '(').replace(/<RB>/g, ')');
        let filepath = oriFlepath.trim();
        // 首先要判断文件路径，对于http https 路径忽略，对于没有写盘符的路径，加上 targetFile 的路径
        if (/^http:|https:/.test(filepath)) {
            tmpPicArrNet.push(filepath);
        } else {
            var tmpFilePath = ""; //全路径
            tmpFilePath = path.resolve(mdfilePath, filepath); // 支持相对目录和绝对路径
            tmpFilePath = decodeURI(tmpFilePath); // 地址可能被转义,需要还原
            if (fs.existsSync(tmpFilePath)) {
                tmpPicArrLocal.push(tmpFilePath);
                tmpOriMapping[tmpFilePath] = oriFlepath; // 原始的本地路径地址
            } else {
                // 图片不存在
                tmpPicArrInvalid.push(filepath);
            }
        }
    }
}


export async function openAndEditMarkdownFile(mdTargetFilePath: string): Promise<vscode.TextEditor | undefined> {
    try {
        // 打开文件
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(mdTargetFilePath));
        await vscode.window.showTextDocument(doc);

    } catch (error) {
        vscode.window.showErrorMessage(`Error opening file: ${error}`);
        return undefined;
    }
}


