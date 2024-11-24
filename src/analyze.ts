import * as fs from 'fs';
import * as path from 'path';
import { getImages, logger} from './lib/common';
import { getLang } from './lib/lang';
import * as vscode from 'vscode';
import { getStatus } from './utils';



export function analyze() {
    try {
        var obj = getImages();
        if (obj.content == '') { return; }

        logger.info(getLang('localimage', obj.local.length));
        logger.info(`${obj.local.join('\n')}`);
        logger.info(getLang('netimage', obj.net.length));
        logger.info(`${obj.net.join('\n')}`);

    } catch (e: any) {
        logger.error(e.message);
    }
}

export function showStatus(docTextEditor: vscode.TextEditor| undefined) {
    try {
        var obj = getStatus(docTextEditor);
        if (obj.content == '') { return; }

        logger.info(getLang('localimage', obj.local.length));
        logger.info(`${obj.local.join('\n')}`);
        logger.info(getLang('netimage', obj.net.length));
        logger.info(`${obj.net.join('\n')}`);

    } catch (e: any) {
        logger.error(e.message);
    }
}
