import ora from 'ora';
import { promisify } from 'util';
import { exec } from 'child_process';
import chalk from 'chalk';

const execAsync = promisify(exec);

const log = console.log;

export const buildApp = async ({
  currentUser,
  root,
  androidFolder,
  sdk,
}: {
  currentUser: string;
  root: string;
  androidFolder: string | undefined;
  sdk: string | undefined;
}): Promise<void> => {
  let spinner = ora('Running capacitor sync').start();

  await execAsync('npx cap sync', {
    cwd: root,
  });

  spinner.stop();

  log(`🆗 ${chalk.green.bold('Capacitor sync complete!')}`);

  spinner = ora('Building your app, this might take a while...').start();

  await execAsync('./gradlew syncDebugLibJars', {
    env: {
      ANDROID_SDK_ROOT:
        sdk || `/mnt/c/Users/${currentUser}/AppData/Local/Android/Sdk`,
    },
    cwd: `${root}/${androidFolder || ''}android`,
  });

  log(`🆗 ${chalk.green.bold('Gradle sync complete!')}`);

  await execAsync('chmod +x ./gradlew', {
    cwd: `${root}/${androidFolder || ''}android`,
  });

  await execAsync('./gradlew assembleDebug', {
    env: {
      ANDROID_SDK_ROOT:
        sdk || `/mnt/c/Users/${currentUser}/AppData/Local/Android/Sdk`,
    },
    cwd: `${root}/${androidFolder || ''}android`,
  });

  spinner.stop();

  log(`👷 ${chalk.green.bold('App built!')}`);
};
