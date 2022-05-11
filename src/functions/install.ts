import ora from 'ora';
import { promisify } from 'util';
import { exec } from 'child_process';
import chalk from 'chalk';

const execAsync = promisify(exec);

const log = console.log;

export const installApp = async ({
  androidFolder,
  applicationId,
}: {
  androidFolder: string | undefined;
  applicationId: string | undefined;
}): Promise<void> => {
  const spinner = ora('Installing and starting the app').start();

  const install = await execAsync(
    `powershell.exe /C adb install ${`${
      androidFolder || ''
    }`}android/app/build/outputs/apk/debug/app-debug.apk`
  );

  if (install.stderr) {
    throw new Error(install.stderr);
  }

  await execAsync(
    `cmd.exe /C adb shell cmd activity start-activity $(cmd.exe /C adb shell cmd package resolve-activity --brief -c android.intent.category.LAUNCHER ${applicationId} | tail -1)`
  );

  spinner.stop();

  log(`🥳 ${chalk.green.bold('App installed and started!')}`);
};
