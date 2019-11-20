# Starting Android Development with the D Programming Language

## Installing and Using LDC

Disclaimer: this tutorial is mainly written for linux because there
is a prebuilt LDC package with android patches for linux. You might
want to spin up a linux VM if you don't want to manually compile LDC
or check the [D Wiki](https://wiki.dlang.org/Build_LDC_for_Android)
if you don't want to use a VM.

First make sure you have the Android SDK Manager and the Android NDK
installed. For building we will use `ant` and not gradle, so
make sure you have that installed too.

In this tutorial we are going to compile everything with the
**armeabi-v7a** ABI. Make sure your emulator uses this ABI and not
x86. If there is some interest in a tutorial for x86 compilation I
might write another tutorial for that.

You can skip the next 3 sections if you already have an armeabi-v7a
Android emulator setup using the AVD and the NDK setup.

### Obtaining the Android SDK

First start the Android SDK manager and install the latest Android
API including ARM EABI v7a System Images. To make sure you don't run
into any issues also select everything that is not a System Image
for that version.

![https://i.webfreak.org/fI8d7a](https://i.webfreak.org/fI8d7a)

Select these packages and then hit **Install Packages...** at the
bottom right. A dialog with licenses for all selected Packages will
pop up. Once you have read them, check the **Accept Licenses** combo
box. Note that this will only affect the currently selected category
at the left. Make sure you have accepted all categories and not just
the current one, otherwise you might need to open the Install dialog
multiple times which might be annoying if you have a slow internet
connection and want to keep it open over night.

### Obtaining the NDK

For D development you need the Android NDK. On some platforms it might
be available in the Android SDK manager. On most linux distributions
there should be a NDK package in your package manager of choice.

If you didn't find the NDK in your package manager you can
[manually install the NDK](https://developer.android.com/ndk/index.html).

Once installed make sure the NDK is available in the command line
under a `$NDK` variable.

	# Pick the one that applies for you

	#export NDK=/opt/android-ndk
	export NDK=/opt/ndk

Checking if it worked:

	$NDK/ndk-build --version

should print some information about `GNU Make`.

### Setting up an Android Emulator using AVD

First open your Android SDK Manager and open the AVD Manager from
Tools -> Manage AVDs.

Now open the dialog to create a new virtual device.

![https://i.webfreak.org/fIgywM](https://i.webfreak.org/fIgywM)

![https://i.webfreak.org/fIgdnS](https://i.webfreak.org/fIgdnS)

1. Choose a Device - This is basically only the emulator resolution and DPI, so choose any you like
2. Choose a Target - Select the Android Target API you have downloaded in the previous section. Just make sure this one has an `armeabi-v7a` Image.
3. Choose a CPU/ABI - select the **`armeabi-v7a`** version (**not x86** as described above)
4. Set Skin to `Skin with dynamic hardware controls` - This will add the Touchscreen buttons for home, back, etc.
5. Tick "Use Host GPU" if available

### Installing LDC (with Android patches)

If you are on linux x86_64, you are in luck! There are [prebuilt binaries](https://github.com/joakim-noah/android/releases)

If you are on any other platform check the [D Wiki](https://wiki.dlang.org/Build_LDC_for_Android)

Alternatively you could also program on your Android phone and use the prebuilt binary for android.
Then you can just get a terminal app on your Android device and compile using ldc from your phone.
In my eyes this only makes sense if you are on a tablet, programming on a phone keyboard might be
a bit more difficult than it needs to be.

	ldc2 --version

	LDC - the LLVM D compiler (1.1.0git-1155379-dirty):
		based on DMD v2.071.2 and LLVM 3.9.0
		built with DMD64 D Compiler v2.071.2
		Default target: armv7-none-linux-android
		Host CPU: sandybridge
		http://dlang.org - http://wiki.dlang.org/LDC

		Registered Targets:
			arm     - ARM
			armeb   - ARM (big endian)
			thumb   - Thumb
			thumbeb - Thumb (big endian)
			x86     - 32-bit X86: Pentium-Pro and above
			x86-64  - 64-bit X86: EM64T and AMD64

### Building an OpenGL Android app

We are going to use the App made by the author of the Android
patched LDC repository here. I might provide more information how to
do this from scratch in a future tutorial if anyone is interested.
Otherwise just look at the samples in the [repository](https://github.com/joakim-noah/android).

	# Setting Up
	git clone https://github.com/joakim-noah/android.git
	cd android/samples/native-activity/

	# Building D code
	# If you change your code rerun the respective command
	ldc2 -mtriple=armv7-none-linux-androidabi -I../../ -c jni/main.d
	ldc2 -mtriple=armv7-none-linux-androidabi -I../../ -c ../../android/sensor.d
	ldc2 -mtriple=armv7-none-linux-androidabi -I../../ -c ../../android_native_app_glue.d

	# Now this folder should contain a main.o, sensor.o, android_native_app_glue.o

	# Output of the shared library that gets packed into the apk (this is why we chose a armeabi-v7a emulator)
	mkdir -p libs/armeabi-v7a/

	# Note: $NDK_ARCH might not exist, just use tab completion to find your local architecture (most likely x86_64)
	$NDK/toolchains/llvm/prebuilt/linux-$NDK_ARCH/bin/clang -Wl,-soname,libnative-activity.so \
		-shared --sysroot=$NDK/platforms/android-9/arch-arm   main.o sensor.o \
		/path/to/ldc/lib/libdruntime-ldc.a android_native_app_glue.o -lgcc \
		-gcc-toolchain $NDK/toolchains/arm-linux-androideabi-4.9/prebuilt/linux-$NDK_ARCH \
		-no-canonical-prefixes -fuse-ld=bfd -target armv7-none-linux-androideabi \
		-Wl,--fix-cortex-a8 -Wl,--no-undefined -Wl,-z,noexecstack -Wl,-z,relro -Wl,-z,now \
		-mthumb -L$NDK/platforms/android-9/arch-arm/usr/lib \
		-llog -landroid -lEGL -lGLESv1_CM -lc -lm \
		-o libs/armeabi-v7a/libnative-activity.so

	# `android` comes from $ANDROID_SDK/tools/
	# This will create or update the `build.xml` file which is required to package the APK file
	android update project -p . -s --target 1
	# This creates the debug APK
	ant debug

	# We now have a NativeActivity-debug.apk in the bin/ folder
	# The apk will contain the shared libraries for every ABI (armeabi-v7a, x86, etc.)
	# However because we only compiled our code for armeabi-v7a so far the app will only run on ARM devices.

### Running the App

Assuming you are running the Android emulator using the AVD manager, simply run this command
to install the App on the emulator:

	# adb is in $SDK/platform-tools/
	# -r means replace/reinstall so it doesn't complain about the app already being there
	adb install -r bin/NativeActivity-debug.apk

To run it on an Android device you can just copy the apk and move it to your phone's SD Card.
You also need to enable `Allow external App sources` in your Security Settings if you do this.

### Modifying the App

Now we have compiled and packaged the sample app. But to be sure that it really used the D code and not the
C code which is unneccessarily also added in the repository lets try modifying it. Right now the
app will cycle through some colors based on the last position where you have touched the screen.
Let's try to remove the cycling through the colors so it is a still background based on the last
touch location.

Edit `jni/main.d` and go to line 137 where it calls `glClearColor`.

The second argument in this function call (the green channel) is just a floating point number
constantly counting upwards in line 298. So lets just try and change it to a constant value like
`0`.

Your code will now look like this:

	/**
	 * Just the current frame in the display.
	 */
	void engine_draw_frame(engine* engine) {
		if (engine.display == null) {
			// No display.
			return;
		}

		// Just fill the screen with a color.
		glClearColor(engine.state.x/engine.width, 0, engine.state.y/engine.height, 1);
		glClear(GL_COLOR_BUFFER_BIT);

		eglSwapBuffers(engine.display, engine.surface);
	}

**Recompile, link, package & upload**

	# We have only changed jni/main.d
	ldc2 -mtriple=armv7-none-linux-androidabi -I../../ -c jni/main.d # Compile

	# The big .so creation command from earlier
	$NDK/toolchains/llvm/prebuilt/linux-$NDK_ARCH/bin/clang -Wl,-soname,libnative-activity.so \
		-shared --sysroot=$NDK/platforms/android-9/arch-arm   main.o sensor.o \
		/path/to/ldc/lib/libdruntime-ldc.a android_native_app_glue.o -lgcc \
		-gcc-toolchain $NDK/toolchains/arm-linux-androideabi-4.9/prebuilt/linux-$NDK_ARCH \
		-no-canonical-prefixes -fuse-ld=bfd -target armv7-none-linux-androideabi \
		-Wl,--fix-cortex-a8 -Wl,--no-undefined -Wl,-z,noexecstack -Wl,-z,relro -Wl,-z,now \
		-mthumb -L$NDK/platforms/android-9/arch-arm/usr/lib \
		-llog -landroid -lEGL -lGLESv1_CM -lc -lm \
		-o libs/armeabi-v7a/libnative-activity.so # Link

	# No `android update project` needed because its only a source change.
	ant debug # Package

	adb install -r bin/NativeActivity-debug.apk # Upload

You might want to get some build system to do this for you.

Now run the App again and now when you touch somewhere on the screen
the color should only change when moving. If it is still continously animating
and you are sure that you have updated the D code you have done something
wrong previously.

In this case remove the `libs` folder, remove the `bin` folder, uninstall the app
from your Android emulator/device, run `android update project -p . -s --target 1`
again and redo the step above. Error messages should guarantee to pop up if you
have done anything wrong, otherwise it should work now.

### Next Steps & Reference Links

Now that you have successfully compiled and modified your first Android App in D,
check out the other samples and mess around with the API. You might want to setup
some build tool or script to simplify all the commands for compiling, linking, etc.

Some libraries such as [DlangUI](https://github.com/buggins/dlangui/) have been
ported to Android already aswell. If you want to make a more advanced App, try
it out. DlangUI is completely written in D and shows quite a lot of potential.

---

I might write more tutorials for Android Development in D if anyone is interested.
To show me that you liked this tutorial or found it useful please reply to the
Post in the D Forums or mention me on Twitter [@WebFreak001](https://twitter.com/WebFreak001)
or on the D IRC on freenode.

Any feedback is appreciated.

---

If you ran into some other problems or had problems setting up, check these links:

[D Wiki / Build LDC for Android](https://wiki.dlang.org/Build_LDC_for_Android)

[D Wiki / Build DMD for Android (Slightly Outdated)](https://wiki.dlang.org/Build_DMD_for_Android)

If you are still having problems ask on the D forums (in the Learn section) or
on the D IRC. People will probably help you out there. If I am on the IRC you
might as well want to ping me with WebFreak001, I am happy to help you out most
of the time.

by WebFreak001 @ 2016-12-29 [Twitter](https://twitter.com/WebFreak001) - [GitHub](https://github.com/WebFreak001) - [Mastodon](https://niu.moe/@webfreak) - [Forum Post](https://forum.dlang.org/post/gkhikvwhxvihyekntkaq@forum.dlang.org)
