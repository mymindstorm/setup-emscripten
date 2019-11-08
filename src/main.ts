import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import * as os from 'os';
import * as fs from 'fs';

async function run() {
  try {
    const emArgs = {
      version: await core.getInput("version"),
      noInstall: await core.getInput("no-install"),
      noCache: await core.getInput("no-cache"),
      storeActionsCache: await core.getInput("store-actions-cache"),
      useActionsCacheFolder: await core.getInput("actions-cache-folder")
    };

    let emsdkFolder;
    let foundInCache = false;
    
    if (emArgs.version !== "latest" && emArgs.noCache === "false") {
      emsdkFolder = await tc.find('emsdk', emArgs.version, os.arch());
    } 
    
    if (emArgs.useActionsCacheFolder) {
      const fullCachePath = `${process.env.GITHUB_WORKSPACE}/${emArgs.useActionsCacheFolder}`
      try {
        fs.accessSync(fullCachePath + '/emsdk-master/emsdk', fs.constants.X_OK)
        emsdkFolder = fullCachePath;
        foundInCache = true;
      } catch (e) {
        core.error(`Could not access cached files at path: ${fullCachePath}`);
        // core.debug(fs.readdirSync(fullCachePath + '/emsdk-master').toString());
      }
    }

    if (!emsdkFolder) {
      const emsdkArchive = await tc.downloadTool("https://github.com/emscripten-core/emsdk/archive/master.zip");
      emsdkFolder = await tc.extractZip(emsdkArchive);
    } else {
      foundInCache = true;
    }

    let emsdk = `${emsdkFolder}/emsdk-master/emsdk`

    if (os.platform() === "win32") {
      emsdk = `powershell ${emsdkFolder}\\emsdk-master\\emsdk.ps1`
    }

    if (emArgs.noInstall === "true") {
      if (os.platform() === "win32") {
        core.addPath(`${emsdkFolder}\\emsdk-master`);
        core.exportVariable("EMSDK", `${emsdkFolder}\\emsdk-master`);
      } else {
        core.addPath(`${emsdkFolder}/emsdk-master`);
        core.exportVariable("EMSDK", `${emsdkFolder}/emsdk-master`);
      }
      return;
    }

    if (!foundInCache) {
      await exec.exec(`${emsdk} install ${emArgs.version}`);

      if (emArgs.version !== "latest" && emArgs.noCache === "false") {
        await tc.cacheDir(emsdkFolder, 'emsdk', emArgs.version, os.arch());
      }
    }

    await exec.exec(`${emsdk} activate ${emArgs.version}`);
    await exec.exec(`${emsdk} construct_env`, [], {listeners: {
      stdline(message) {
        const pathRegex = new RegExp(/PATH \+= (\S+)/)
        const pathResult = pathRegex.exec(message);

        if (pathResult) {
          core.addPath(pathResult[1]);
          return;
        }
        
        const envRegex = new RegExp(/(\S+) = (\S+)/);
        const envResult = envRegex.exec(message);

        if (envResult) {
          core.exportVariable(envResult[1], envResult[2]);
          return;
        }
      }
    }})

    if (emArgs.storeActionsCache) {
      fs.mkdirSync(`${process.env.GITHUB_WORKSPACE}/${emArgs.storeActionsCache}`, { recursive: true });
      await exec.exec(`cp -r ${emsdkFolder}/emsdk-master ${process.env.GITHUB_WORKSPACE}/${emArgs.storeActionsCache}`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
