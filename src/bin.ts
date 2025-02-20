#!/usr/bin/env node

import { exec } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function askQuestion(query: string): Promise<string> {
    return new Promise((resolve) => rl.question(query, resolve));
}

async function executeCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                reject(error);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
            }
            console.log(`stdout: ${stdout}`);
            resolve();
        });
    });
}

async function replaceInFile(filePath: string, searchValue: string, replaceValue: string): Promise<void> {
    const content = await fs.promises.readFile(filePath, 'utf8');
    const updatedContent = content.replace(new RegExp(searchValue, 'g'), replaceValue);
    await fs.promises.writeFile(filePath, updatedContent, 'utf8');
}

async function replaceRecursively(dir: string, searchValue: string, replaceValue: string): Promise<void> {
    const files = await fs.promises.readdir(dir);
    for (const file of files) {
        if (file == '.git' || file == '.vscode') {
            continue;
        }

        const filePath = path.join(dir, file);
        const stats = await fs.promises.stat(filePath);
        if (stats.isDirectory()) {
            await replaceRecursively(filePath, searchValue, replaceValue);
        } else {
            await replaceInFile(filePath, searchValue, replaceValue);
        }
    }
}

async function main() {
    try {
        const folderName = await askQuestion('Enter folder name: ');
        await executeCommand(`git clone https://github.com/DCC-BS/nuxt-module-template ${folderName}`);

        process.chdir(folderName);

        const packageName = await askQuestion('Enter package name: ');
        await replaceRecursively('.', '<<package-name>>', packageName);

        await fs.remove('.git');
        await executeCommand('git init');

        console.log('Task completed successfully!');
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        rl.close();
    }
}

main();
