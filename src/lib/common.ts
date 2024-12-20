import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { fromBuffer } from 'file-type';
import * as fsExt from "fs-extra";
import { getLang } from './lang';
import { logger } from '../utils';
let dayjs = require('dayjs');
// import * as chalk from 'chalk' 可以不必用chalk 库

export let localFolder = ''; // 目标文件夹
export let readonly = false; // 是否只读，默认修改内容
export let skipSelectChange = false; // 是否只读，默认修改内容
export let overwriteFile = false; // 是否覆盖原先的md文件，此选项不用
export let rename = true; // 是否下载的图片重新命名
export let remotePath = ''; // 远程路径
export let dlTimeout = 10; // 下载超时
export let ulTimeout = 10; // 上传超时
export let urlFormatted = true; // URL格式神需要转义

let mdFile = ''; // 需要处理的文件
let oMdFile: path.ParsedPath; // mdFile的对象结构

let docTextEditor: vscode.TextEditor | undefined; // 选择的MD文件
let docPreSelection: vscode.Selection | undefined; // 选择的范围
let imagePathBracket = 'auto'; // 文件名中包含括号

export function getImages(selectFlag: boolean = false): { local: string[], net: string[], invalid: string[], mapping: Record<string, any>, content: string } {
    var picArrLocal: string[] = [];
    var oriMapping = {};
    var picArrInvalid: string[] = [];
    var picArrNet: string[] = [];
    var str = '';
    let retObj = { local: picArrLocal, net: picArrNet, invalid: picArrInvalid, mapping: oriMapping, content: str };
 
    let editContent = '';
    const currentEditor = docTextEditor;
    // const currentEditor = vscode.window.activeTextEditor; // 获取当前活动文本编辑器
    
    if (currentEditor == null) {
        logger.error(getLang('docAct'))
        return retObj;
    }
    if (selectFlag) {
        // 只获取编辑的字符串内容 
        let r = currentEditor.selection;// 选中的内容
        editContent = currentEditor.document.getText(r);
        if (r == null || editContent == '') {
            // 没有选中任何内容
            logger.warn("No Image Url selected. Please select a URL before proceeding.");
            return retObj;
        }
    } else {
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
    }
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
        findImage(reg, str, imagePathBracket == 'auto', picArrNet, picArrLocal, picArrInvalid, oriMapping);
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
export function findImage(reg: any, str: string, auto: boolean, tmpPicArrNet: string[], tmpPicArrLocal: string[], tmpPicArrInvalid: string[], tmpOriMapping: Record<string, any>) {
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
export function escapeStringRegexp(string: string) {
    if (typeof string !== 'string') {
        throw new TypeError('Expected a string');
    }
    // Escape characters with special meaning either inside or outside character sets.
    // Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
    return string
        .replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
        .replace(/-/g, '\\x2d');
}


// 设置相关内部变量
export function setPara(bracket: string, ren: boolean, read: boolean, skip: boolean
    , local: string, remote: string, dl: number, ul: number, urlf: boolean) {
    imagePathBracket = bracket;
    rename = ren;
    skipSelectChange = skip;
    readonly = !read; // 含义相反
    localFolder = local;
    remotePath = remote;
    dlTimeout = dl;
    ulTimeout = ul;
    urlFormatted = urlf;
}
// 本地文件的通用检查 , 检查后备份相关相关变量
export function mdCheck(file: string): boolean {
    // md文件路径
    if (!fs.existsSync(file)) {
        if (file.indexOf('markdown-image-manage') > -1) {
            // 可能是插件未启动和安装完毕
            logger.warn(getLang('extension'));
        } else {
            logger.error(getLang('fileExist', file));
        }
        return false;
    } else {
        var stat = fs.statSync(file);
        if (!stat.isFile()) {
            logger.error(`[${file}] is not file!!!`);
            return false;
        }
    }
    mdFile = file; // 内部对象赋值，多个模块共用
    oMdFile = path.parse(mdFile)
    docTextEditor = vscode.window.activeTextEditor;
    docPreSelection = docTextEditor?.selection; // 光标位置
    return true;
}
export function getMdPath(): string | null {
    // 获取当前活动的文本编辑器
    const currentEditor = docTextEditor;

    // 检查是否有活动的文本编辑器
    if (!currentEditor) {
        logger.error(getLang('docAct')); // 假设 getLang 函数用于获取本地化字符串
        return null;
    }

    // 获取当前文档的URI
    const documentUri = currentEditor.document.uri;

    // 检查文件是否是本地文件（而非未保存的文档或其他类型的URI）
    if (documentUri.scheme !== 'file') {
        // logger.error(getLang('notLocalFile'));
        return null;
    }

    // 获取文件的完整路径
    const filePath = documentUri.fsPath;

    // 可选：检查文件是否是Markdown文件
    if (path.extname(filePath).toLowerCase() !== '.md') {
        // logger.error(getLang('notMarkdownFile'));
        return null;
    }

    return filePath;
}

export function getMdEditor(): vscode.TextEditor | undefined {
    // 获取当前活动的文本编辑器
    const currentEditor = docTextEditor;


    return currentEditor;
}
// 有本地lcoal路径的检查程序
export function localCheck() {
    let parentPath = path.dirname(mdFile);
    // 目标保存
    let targetFolder = path.resolve(parentPath, convertPath(localFolder.trim() || ''));

    if (!fs.existsSync(targetFolder)) {
        logger.info(getLang('localfolder', targetFolder), true, true);
        fsExt.ensureDirSync(targetFolder);
    } else {
        var stat = fs.statSync(targetFolder);
        if (!stat.isDirectory()) {
            logger.error(getLang('notf', targetFolder));
            return false;
        }
    }
    localFolder = targetFolder
    return true;
}
// 简单参数option的统一赋值
export function getOpt(options: { readonly: null; overwriteFile: null; rename: null; }) {
    let readonly = (options.readonly != null);
    let overwriteFile = (options.overwriteFile != null);
    let rename = (options.rename != null);
    return { readonly, overwriteFile, rename }; // 返回
}
// 重新命名新文件名
export function newName() {
    let num = Math.random().toString().slice(2, 4);// 增加2位随机数防止时间冲突
    return new Date().getTime().toString(36) + num;
}
// 将URL地址进行转义和还原
export function myEncodeURI(url: string, flag: boolean) {
    // 默认以 md文件为默认路径
    let newPath = url.replace(/\\/g, '/'); // 转换为 / 格式 path.sep 格式不一样
    try {
        newPath = decodeURI(newPath); // 防止重复encode，先decode
        newPath = flag ? encodeURI(newPath) : decodeURI(newPath);
    } catch(e) {
        console.log(e);
    }
    return newPath;
}
// 转换为相对路径,第一个参数为相对路径，第二个为新的文件全路径
export function getAutoPath(newfile: string) {
    // 默认以 md文件为默认路径
    let newPath = getAutoPathCore(oMdFile.dir, newfile);
    return myEncodeURI(newPath, urlFormatted);
}
// 转换为路径 path.resolve('c:/aa/b','相对路径')
function getAutoPathCore(dir: string, newfile: string) {

        let relativeFile = path.relative(dir, newfile);
        // 如果不是上级目录的文件
        if (relativeFile.indexOf('..\\') != -1) {
            newfile = relativeFile;
        }
        return newfile;
}
// 进行绝对路径和相对路径转换
export function switchPath(strPath:string,relativeFlag: boolean = true)
{
    if(relativeFlag){
        // 转相对路径
        return path.relative(oMdFile.dir, strPath);
    } else {
        // 转换为绝对路径
        return path.resolve(oMdFile.dir, strPath)
    }
}
// 检测位置是否改变了
export function checkSamePos(pos1: vscode.Position | undefined, pos2: vscode.Position | undefined) {
    if (pos1 == null || pos2 == null) {
        logger.error('!position error!')
        return false;
    }
    return (pos1?.character == pos2.character && pos1?.line == pos2?.line)
}
// 检测编辑器是否改变了 active = true 表示点否则表示范围
export async function checkEditor(active: boolean) {
    let editor = docTextEditor;
    if (editor == null || editor.document.isClosed) {
        logger.error(getLang('closed'))
        return;
    }
    let uri = editor.document.uri;
    //vscode.commands.executeCommand<vscode.TextDocumentShowOptions>("vscode.open",uri);
    let editor2 = await vscode.window.showTextDocument(uri)
    // .then( editor => { 
    //     let same = docPreSelection?.active == editor.selection.active
    //     console.log('opened.....');
    //  },
    //error => { console.log(error) });
    //let now = vscode.window.activeTextEditor;
    // editor.document.isClosed , 文件可能切换或关闭了 now != editor
    if (active) {
        if (!checkSamePos(docPreSelection?.active, editor2.selection.active)) {
            if (skipSelectChange) {
                logger.warn(getLang('posChg'))
            } else {
                logger.error(getLang('posChg') + ',' + getLang('notChg'))
                return;
            }
        }
    } else {
        if (!checkSamePos(docPreSelection?.start, editor2.selection.start) || !checkSamePos(docPreSelection?.end, editor2.selection.end)) {
            if (skipSelectChange) {
                logger.warn(getLang('rangChg'))
            } else {
                logger.error(getLang('rangChg') + ',' + getLang('notChg'))
                return;
            }
        }
    }
    return editor2;
}
// 在当前光标处插入内容
export async function insertText(content: string) {
    let editor = docTextEditor;
    if (content.length == 0 || editor == null) {
        logger.error(getLang('insertEmpty'))
        return;
    }
    try {
        logger.info(getLang('inserting') + content, false)
        let editor2 = await checkEditor(true)
        if (editor2 == null) { return; }
        const position = editor2?.selection.active;
        editor2?.edit(textEditorEdit => {
            textEditorEdit.insert(position, content);
        });
    } catch (error) {
        console.log(error)
        logger.error('insert fail 222')
        return;
    }
    logger.success(getLang('insertTxt'))
}
// 保存内容
export async function saveFile(content: string, count: number, selectFlag: boolean = false,cleanFlag: boolean = false) {
    if (count == 0) {
        logger.warn(getLang('uptSucc3'));
        return;
    }
    if (readonly) {
        logger.warn(getLang('uptSucc2', count));
        return;
    }
    let textEditor = await checkEditor(false)
    if (textEditor == undefined) { return; }
    if ((content.length > 0||cleanFlag) && textEditor != null) {
        await textEditor.edit((editBuilder: vscode.TextEditorEdit) => {
            let rang: vscode.Range;
            if (selectFlag) {
                // 替换选中的内容
                let r = textEditor?.selection;
                if (r == null) {
                    logger.error(getLang('docSelect'))
                    return;
                }
                rang = r;
            } else {
                const end = new vscode.Position(textEditor?.document.lineCount || 0 + 1, 0);
                rang = new vscode.Range(new vscode.Position(0, 0), end)
            }
            vscode.window.showTextDocument(textEditor.document)
            editBuilder.replace(rang, content);
        });
        await new Promise(resolve => setTimeout(resolve, 100));
        await textEditor.document.save();
        await vscode.window.showTextDocument(textEditor.document)
        await new Promise(resolve => setTimeout(resolve, 100));
        
    }


    logger.success(getLang('uptSucc', count, path.basename(mdFile)),false);
}
// 获取本地有效的文件名
export async function getValidFileName(dest: string, filename: string, content?: Buffer): Promise<string> {
    let pos1 = filename.search(/[\/:*\?\"<>|]/); // 找到第一个不合法字符位置截断
    if (pos1 > -1) {
        filename = filename.substring(0, pos1);
    }
    const imageExtensionRegex = /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico)$/i;
    // 若剔除不合法字符后文件名已不包含图片拓展名，则通过文件内容获取后补回
    if (content && !imageExtensionRegex.test(filename)) {
        const fileInfo = await fromBuffer(content);
        if (fileInfo?.ext) {
            filename = `${filename}.${fileInfo.ext}`
        }
    }
    return getAntiSameFileName(dest, filename); // 防止文件重复
}
// 输入需要写入的文件名，如果发现重复，增加(序号) ，序号最大999 ，如果成功返回真实路径，否则返回空字符串
function getAntiSameFileName(dest: string, filename: string): string {
    let filePath = path.join(dest, filename);
    while (fs.existsSync(filePath)) // 同名文件数量最多1000
    {
        // 如果存在，则需要改名,格式为 文件名[数字递增].后缀 返回最新的文件名,不建议用() 因为和链接定义可能重复
        let f = path.parse(filePath);
        var re = /\[(\d+)\]$/;
        if (re.test(f.name)) {
            let num = parseInt(RegExp.$1, 10);
            if (num > 999) {
                logger.error(`file num[${num}] >999`);
                return '';
            }
            let newName = f.name.replace(re, '[' + (++num) + ']') + f.ext;
            filePath = path.join(dest, newName);
        } else {
            let newName = f.name + '[1]' + f.ext; // 重复时初始化的文件
            filePath = path.join(dest, newName);
        }
    }
    return filePath;
}
// 识别 路径 上代码转换，包括 <filename>  <yyyy> <mm> <dd>
export function convertPath(p: string): string {
    if (mdFile == '') {
        return '';
    }
    let date = dayjs(new Date());
    return p.replace(/<filename>/ig, oMdFile.name)
        .replace(/<(.+?)>/ig, function (a, b)  // 支持各种日期格式字符串
        {
            return (date.format(b));
        });
}
// 超时控制
export async function timeoutPromise(promise: Promise<unknown>, ms: number, msg: string): Promise<any> {
    function delayPromise(ms: number) {
        return new Promise(function (resolve) {
            setTimeout(function () { resolve('timeoutPromise') }, ms);
        })
    }
    var timeout = delayPromise(ms);
    let res = await Promise.race([promise, timeout]);
    if (res == 'timeoutPromise') {
        logger.error(msg);
        return '';
    }
    return res;
}