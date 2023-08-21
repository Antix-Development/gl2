# gl2.js
A modified version of [gl1.js](https://github.com/curtastic/gl1) by Curtis "curtastic" Robinson.

The differences between gl2.js and gl1.js are...

- Readability has been somewhat destroyed.

- Code has been flattened to be just a bunch of functions you call directly.

- When fully minified gl2.js about 1.5kb smaller than gl1.js.

<br>

## Functions

<br>

### gl2_setup(canvas, imageName)

Initialize the engine.

**canvas** - an HTML canvas element.

**imageName** - name of image to load (optional).

<br>

### gl2_setBackgroundColor(r, g, b, a)

set the canvas background color.

**r** - Red.

**g** - Green.

**b** - Blue.

**a** - Alpha.

<br>

### gl2_resize()

Resize viewport and shaders. Call whenever your canvas size changes.

<br>

### gl2_drawImage(sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight, rgba, rotation)

Queues a portion of the currently loaded texture (a sub-image) to be drawn when `gl2_drawEverything` is called.

**sourceX** - Sub-image x coordinate (in texture) to draw from.

**sourceY** - Sub-image y coordinate (in texture) to draw from.

**sourceWidth** - Width of sub-image image

**sourceHeight** - Height of sub-image

**destX** - X destination on screen for sub-image.

**destY** - Y destination on screen for sub-image.

**destWidth** - Destination width for sub-image.

**destHeight** - Destination height for sub-image.

**rgba** - RGBA tint (optional).

**rotation** - Rotation in radians (optional).

<br>

### gl2_drawRect(x, y, width, height, rgba, rotation)

A handy function for when you want to draw rectangles. For example debugging hitboxes, or to darken everything with semi-transparent black overlay. This assumes the top left pixel in your texture is white, so you can stretch/tint it to any size/color rectangle.

**x** - X coordinate for the rectangle.

**y** - Y coordinate for the rectangle.

**width** - Width of rectangle.

**height** - Height of rectangle.

**rgba** - RGBA tint (optional).

**rotation** - Rotation in radians (optional).

<br>

### gl2_drawEverything()

Draws all queued sub-images to the canvas. Call this every frame.

<br>

### gl2_loadTextureFromImage(image)

Prepare the given image for use.

**image** - an HTML IMG or CANVAS element.

<br>

<hr>

<br>

## Original gl1.js readme

gl1.js

A webGL 2D graphics library.

Designed and optimized for 2D web games that can fit all their graphics into 1 PNG.

Try the example:
https://curtastic.com/gl/

Try the speed test with 50,000 images:
https://curtastic.com/gl/speedtest.html?max=50000

Features:
- Real time rotation, without slowdown. (meaning the same speed as not using rotation)
- Real time semi-transparent drawing, without slowdown.
- Real time color tinting/brightening, without slowdown.
- Renders 50,000 moving images with real time rotation, tinting, and transparency at 60FPS on an old iPhone SE 2015.
- Works like a regular canvas where you draw images in the order you want. When you want to remove something, simply stop drawing it.
- You can pass in a canvas instead of a PNG, alter the pixels of your canvas, and reload it into webGL's texture quickly.
- Supports old devices/browsers including IE11 and iOS9.
- Only 4KB minified.
- Fully commented code.

Does not include:
- No hue-shift effect, blur effects, or Skew/3D effects.
- No rotate about a point that isn't the image's center. But you can do that with your own math before passing drawX/drawY.
- No camera object. But you can offset things yourself if you want scrolling.
- No drawing other primitive shapes besides images and rectangles.
- No font or svg support.
