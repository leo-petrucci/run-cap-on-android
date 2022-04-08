# run-cap-on-android

https://user-images.githubusercontent.com/23533178/162486231-7c22ed5e-0b39-4fe0-ba44-32ef5dc4c0f5.mp4

`run-cap-on-android` is a command line tool to improve DX when developing Capacitor apps on WSL.

As of April 2022, Android Studio still has very poor support for WSL2. You can open projects from WSL, but the Gradle sync will fail. This means there is no way to quickly run your Capacitor app on an Android emulator without first copying your entire project to the Windows filesystem.

`run-cap-on-android` uses currently available functionality in ADB to build and install your capacitor app on an Emulator running on Windows.

## Install

```bash
npm install run-cap-on-android -D
```

### Installing Gradle

WSL should have access to the `gradle` command. If it's not installed, you can install the latest verson using the [sdkman package manager](https://sdkman.io/install).

### Installing adb

`adb` needs to be installed and added to your $PATH on both Windows and WSL.

#### On Windows

`adb` and `emulator` should come installed with Android Studio, but often times it's not automatically added to the $PATH. You can check this by opening CMD and typing `adb`.

To add adb to your $PATH:

1. Search your start menu for "Edit the system environment variables".
2. Click on "Environment Variables".
3. In the table, select the row with `Path` and click on "Edit".
4. Add two more lines:

```
%USERPROFILE%\AppData\Local\Android\sdk\platform-tools
```

and

```
%USERPROFILE%\AppData\Local\Android\sdk\emulator
```

Save and close everything. After restarting your terminal you should be able to run both the `adb` and `emulator` commands.

#### On WSL

WSL needs to have the same version of `adb` installed as Windows. `sudo apt install android-sdk` will install version 1.0.39.

You can also download it from the [Android Docs](https://developer.android.com/studio/releases/platform-tools).

Depending on your distro and how you intalled it, there might be different ways to add to $PATH. [This guide](https://www.howtogeek.com/658904/how-to-add-a-directory-to-your-path-in-linux/) will probably help you, if in doubt just Google it.

## Usage

```bash
Usage: run-cap-on-android [options]

Options:
  -id, --applicationId      your app\'s id e.g. com.mycoolapp
  -a,  --androidFolder      the android folder relative to the project root (default:
                            <folder with package.json>/android/app/build/outputs/apk/debug/app-debug.apk)
  -s, --sdk                 location of the android sdk
                            (default:/mnt/c/Users/<your username>/AppData/Local/Android/Sdk )

```

### applicationId

This is the only required option. It depends on how you've set up your app and if you have different versions/names when making staging builds.

### androidFolder

Defaults to the `/android` folder in your project root (wherever you ran the command from).

### sdk

Defaults to the SDK installed by Android Studio, you can specify a Windows path or a WSL path, both will work.
