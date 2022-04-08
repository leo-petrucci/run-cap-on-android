import { Command } from 'commander';
import { promisify } from 'util';
import { exec } from 'child_process';
import ora from 'ora';
import chalk from 'chalk';
import { removeLineEndings } from './utils';

const execAsync = promisify(exec);

const log = console.log;

const packageJson = require('../package.json');
const version: string = packageJson.version;

const program = new Command();

program
  .version(version)
  .name('my-command')
  .requiredOption(
    '-id, --applicationId [applicationId]',
    'the application id to start'
  )
  .option(
    '-a, --androidFolder [androidFolder]',
    'the android folder relative to the project root'
  )
  .option('-s, --sdk [sdk]', 'location of the android sdk')
  .parse(process.argv);

async function main() {
  const { applicationId, androidFolder, sdk } = program.opts() as {
    applicationId: string;
    androidFolder?: string;
    sdk?: string;
  };
  const { stdout: currentUser } = await execAsync(
    `cmd.exe /C echo %username% ${removeLineEndings()}`
  );

  const root = process.cwd();
  let spinner;

  spinner = ora('Running startup checks').start();

  const gradle = await execAsync(
    `gradle -v | grep "Gradle" | tr -d $'Gradle ' ${removeLineEndings()}`
  );

  if (gradle.stderr) {
    spinner.stop();
    log(
      'Gradle is not installed or not available. Please install it or add it to your path.'
    );
    return;
  }

  const linuxAdb = await execAsync(
    `adb --version | grep "Android Debug Bridge" | tr -d $'Android Debug Bridge version ' ${removeLineEndings()}`
  );

  if (linuxAdb.stderr) {
    spinner.stop();
    log(
      'ADB is not installed or not available on WSL. Please install it or add it to your path.'
    );
    return;
  }

  const windowsAdb = await execAsync(
    `cd /mnt/c && cmd.exe /C adb --version | grep "Android Debug Bridge" | tr -d $'Android Debug Bridge version ' ${removeLineEndings()}`
  );

  if (windowsAdb.stderr) {
    spinner.stop();
    log(
      'ADB is not installed or not available on Windows. Please install it or add it to your path.'
    );
    return;
  }

  if (
    windowsAdb.stdout.replace(/\s+/g, '') !==
    linuxAdb.stdout.replace(/\s+/g, '')
  ) {
    spinner.stop();
    log(
      'Your Windows and Linux ADB versions do not match. Please install the same version.'
    );
    return;
  }

  spinner.stop();

  log(`🥳 ${chalk.green.bold('All good!')}`);
  log(`Gradle is installed ${chalk.green.bold('📦v%s')}`, gradle.stdout);
  log(`ADB is installed on WSL ${chalk.green.bold('📦v%s')}`, linuxAdb.stdout);
  log(
    `ADB is installed on Windows ${chalk.green.bold('📦v%s')}`,
    windowsAdb.stdout
  );

  log('\n');

  spinner = ora('Running capacitor sync').start();

  await execAsync('npx cap sync', {
    cwd: '/home/leonardo/Staffscanner.Web/www',
  });

  spinner.stop();

  log(`🆗 ${chalk.green.bold('Capacitor sync complete!')}`);

  await execAsync('./gradlew syncDebugLibJars', {
    env: {
      ANDROID_SDK_ROOT:
        sdk || `/mnt/c/Users/${currentUser}/AppData/Local/Android/Sdk`,
    },
    cwd: '/home/leonardo/Staffscanner.Web/www/android/',
  });

  log(`🆗 ${chalk.green.bold('Gradle sync complete!')}`);

  await execAsync('./gradlew assembleDebug', {
    env: {
      ANDROID_SDK_ROOT:
        sdk || `/mnt/c/Users/${currentUser}/AppData/Local/Android/Sdk`,
    },
    cwd: '/home/leonardo/Staffscanner.Web/www/android/',
  });

  log(`👷 ${chalk.green.bold('App built!')}`);

  const emulator = await execAsync('cmd.exe /C adb devices');

  spinner = ora('Starting emulator').start();

  if (!emulator.stdout.includes('emulator')) {
    exec(
      'cd /mnt/c && cmd.exe /C emulator -avd $(cmd.exe /C emulator -list-avds) > /dev/null 2>&1'
    );
  }

  await execAsync('cmd.exe /C adb wait-for-device');

  spinner.stop();

  log('📱Emulator is good to go!');

  const d1 = await execAsync(
    `cmd.exe /C adb devices | grep -o "emulator-[0-9]*" ${removeLineEndings()}`
  );

  log(`App will be installed on ${d1.stdout}`);

  log('\n');

  spinner = ora(
    'Doing some magic to get WSL to see the Windows emulator'
  ).start();

  await execAsync('adb kill-server');

  await execAsync('cmd.exe /C adb kill-server');

  exec('cmd.exe /C adb -a -P 5037 nodaemon server > /dev/null 2>&1 &');

  const ip = await execAsync(
    `cmd.exe /C ipconfig | grep "IPv4" | awk 'NR==1{print $14}' | tr -d $'\r' | tr -d $'\n'`
  );

  await execAsync('adb start-server', {
    env: {
      ADB_SERVER_SOCKET: `tcp:${ip.stdout}:5037`,
      NODE_ENV: 'development',
      PUBLIC_URL: 'http://localhost:3000',
    },
  });

  spinner.stop();

  spinner = ora('Installing and starting the app').start();

  // const d2 = await execAsync(`adb devices`, {
  //   env: {
  //     ADB_SERVER_SOCKET: `tcp:${ip.stdout}:5037`,
  //     NODE_ENV: 'development',
  //     PUBLIC_URL: 'http://localhost:3000',
  //   },
  // });

  // const androidDevices = d2.stdout
  //   .replace('List of devices attached', '')
  //   .trim();

  // if (androidDevices.includes('offline')) {
  //   log(
  //     `\n📴 ${chalk.red.bold(
  //       'Offline:'
  //     )} Your emulator's status is offline. Reboot it and try again, if it doesn't work try wiping it.`
  //   );
  // }

  await execAsync(
    `adb install ${`${root}/${
      androidFolder || ''
    }`}android/app/build/outputs/apk/debug/app-debug.apk`,
    {
      env: {
        ADB_SERVER_SOCKET: `tcp:${ip.stdout}:5037`,
        NODE_ENV: 'development',
        PUBLIC_URL: 'http://localhost:3000',
      },
    }
  );

  await execAsync(
    `cmd.exe /C adb shell cmd activity start-activity $(cmd.exe /C adb shell cmd package resolve-activity --brief -c android.intent.category.LAUNCHER ${applicationId} | tail -1)`
  );

  spinner.stop();

  log(`🥳 ${chalk.green.bold('App installed and started!')}`);
}

main().catch(e => {
  console.error(e);
});
