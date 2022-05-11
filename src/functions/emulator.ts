import ora from 'ora';
import { promisify } from 'util';
import { exec } from 'child_process';
import { removeLineEndings } from '../utils';

const execAsync = promisify(exec);

const log = console.log;

export const startEmulator = async (): Promise<void> => {
  const emulator = await execAsync('cmd.exe /C adb devices');

  const spinner = ora('Starting emulator').start();

  if (!emulator.stdout.includes('emulator')) {
    exec(
      'cd /mnt/c && cmd.exe /C emulator -avd $(cmd.exe /C emulator -list-avds) > /dev/null 2>&1'
    );
  }

  await execAsync('cmd.exe /C adb wait-for-device');

  spinner.stop();

  const d1 = await execAsync(
    `cmd.exe /C adb devices | grep -o "emulator-[0-9]*" ${removeLineEndings()}`
  );

  log(`App will be installed on ${d1.stdout}`);
};
