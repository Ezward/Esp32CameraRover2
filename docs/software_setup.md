## Software Setup

### Firmware Toolchain
see [Rover Firmware](rover_firmware.md#the-rover-application)

### Client Toolchain
The good news here is that we don't really need a toolchain.  We are using plain HTML, CSS and JavaScript.  We've included some shell scripts to bundle the assets, so no extra tooling is necessary.  However, if you are planning on make changes in the client code then it would be prudent to add a little tooling so that the editor provides much better code completion and type checking.  The JavaScript source is extensively commented with JsDoc comments that include type information and this information can be used by tooling to provide a much better (and less error prone) programming experience.

We use TypeScript to enable code completion and type checking using the JsDoc comments in the JavaScript source.  To install TypeScript we first install NodeJS.

1. Install NodeJS
2. Initialize 
3. Install http-server
4. Install TypeScript

#### 1. Install NodeJS
The simplest way to do this is to just use the NodeJS installer from https://nodejs.org/en/download.  If this is the only project that uses NodeJS then that will work well.

I myself have many project that use NodeJS and they all use a different version (of course).  So I have installed a toolchain that allows me to easily use different version of NodeJS.  I am on a Mac, so I use two tools to do this; Homebrew and ASDF.

Macintosh
- Install Homebrew as described here https://brew.sh/
- Install asdf; these instructions are adapted from https://asdf-vm.com/guide/getting-started.html
  - Install coreutils and curl, `brew install coreutils curl`
  - If you don't already have git, then install it with brew, `brew install git`
  - Git clone asdf, `git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.11.3`
  - follow any addition instructions provided at the end of the installation
- Install NodeJS using asdf
  - Install GnuPG via Homebrew, `brew install gpg`
  - Install the NodeJS plugin, `asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git`
  - You can now list the available versions, `asdf list all nodejs`
  - Install a version of nodejs, `asdf install nodejs 19.8.1`
- Change into the client folder and set you version of node, `asdf local nodejs 19.8.1`
- Reopen the console so that changes are applied in the new console.

#### 2. Initialize
- Change into the client folder, and initialize the nodejs project, `npm init`
  - This will generate a few questions; take the defaults for package (client), version (1.0.0), description (empty).  When you get to entry point use `js/main.js`.  Take all the defaults after that.

#### 3. Install http-server
- Install http-server so we can run the client locally, `npm install http-server`
- Try running it from within the client folder, `npx http-server`, then open `http://127.0.0.1:8080/index_unbundled.html` in your browser; you should see the client application.  At this point, since we are not actually running this on the robot, git won't completely work, but you can use the browser's developer tools to view the html, css and JavaScript and even use the debugger to set breakpoints.

#### 4. Install TypeScript
- Install typescript, `npm install typescript --save-dev`
- Now when you view the client source in Visual Studio Code it should provide much better type checking and intellisense.
- If you choose to modify the source code (and I hope you do) then this guide will help you add JsDoc comments to your code https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
