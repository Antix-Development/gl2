let 
gl2_gl,
gl2_canvas,
gl2_shaderProgram,
gl2_extension,

gl2_ready,

gl2_jsImage,
gl2_texdestWidth,
gl2_texdestHeight,

gl2_rgbas,
gl2_rotations,
gl2_positions,

gl2_maxDraws = 40000, // Max amount of images on the screen at the same time. You can set this to any number, it's just the array size.
gl2_draws = 0, // Internal count of images drawn so far this frame.

// Draw the defined rectangular area of the sprite-sheet to the screen at the given coordinates with the given scale, alpha blend, and rotation.
// rgba (optional). You can tint the image for example to green by passing 0x00FF007F. rgba alpha goes from 0 to 127 (0x7F) where 127 is not transparent at all. Higher than 127 will brighten the image more than normal.
// rotation is (optional). In radians. Negative is allowed. Rotated about its center.
gl2_drawImage = (sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight, rgba, rotation) => {
	let 
  positions = gl2_positions, // Use a local variable so it's faster to access.

  i = gl2_draws * 6;
	
	gl2_rgbas[i + 4] = rgba || 0xFFFFFF7F; // Store rgba after position/texture. Default to white and fully opaque.
	gl2_rotations[i + 5] = rotation || 0; // Store how rotated we want this image to be.
	
	// Positions array is 2-byte shorts not 4-byte floats so there's twice as many slots.
	i *= 2;
	
	// Store where we want to draw the image.
	positions[i] = destX;
	positions[i + 1] = destY;
	positions[i + 2] = destWidth;
	positions[i + 3] = destHeight;
	
	// Store what portion of our PNG we want to draw.
	positions[i + 4] = sourceX;
	positions[i + 5] = sourceY;
	positions[i + 6] = sourceWidth;
	positions[i + 7] = sourceHeight;
	
	gl2_draws ++;
},

// A handy function for when you want to draw rectangles. For example debugging hitboxes, or to darken everything with semi-transparent black overlay. This assumes the top left pixel in your texture is white, so you can stretch/tint it to any size/color rectangle.
gl2_drawRect = (x, y, width, height, rgba, rotation) => gl2_drawImage(0, 0, 1, 1, x, y, width, height, rgba, rotation),

// Call this every frame to actually draw everything onto your canvas. Renders all drawImage calls since the last time you called drawEverything.
gl2_drawEverything = () => {
	gl2_gl.clear(gl2_gl.COLOR_BUFFER_BIT); // Clear the canvas.
	gl2_gl.bufferSubData(gl2_gl.ARRAY_BUFFER, 0, gl2_rgbas.subarray(0, gl2_draws * 6)); // Only send to gl the amount slots in our arrayBuffer that we used this frame.
	gl2_extension.drawElementsInstancedANGLE(gl2_gl.TRIANGLES, 6, gl2_gl.UNSIGNED_BYTE, 0, gl2_draws); // Draw everything. 6 is because 2 triangles make a rectangle.
	gl2_draws = 0; // Go back to index 0 of our arrayBuffer, since we overwrite its slots every frame.
},

// Call gl2_resize() after your canvas resizes.
gl2_resize = () => {
	gl2_gl.viewport(0, 0, gl2_canvas.width, gl2_canvas.height); // Resize the gl viewport to be the new size of the canvas.
	gl2_gl.uniform2f(gl2_gl.getUniformLocation(gl2_shaderProgram, "i"), gl2_canvas.width / 2, gl2_canvas.height / 2); // Update the shader variables for canvas size. Sending it to gl now so we don't have to do the math in JavaScript on every draw, since gl wants to draw at a position from 0 to 1, and we want to do drawImage with a screen pixel position.
},

// Set the gl canvas background color with the given RGBA values.
gl2_setBackgroundColor = (r,g,b,a) => gl2_gl.clearColor(r,g,b,a),

gl2_setup = (canvas, imageName) => {

  gl2_canvas = canvas;
	gl2_gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: true }); // Get the canvas/context from html.
	gl2_extension = gl2_gl.getExtension('ANGLE_instanced_arrays'); // This extension allows us to repeat the draw operation 6 times (to make 2 triangles) on the same 12 slots in gl2_positions, so we only have to put the image data into gl2_positions once for each image each time we want to draw an image.

  gl2_setBackgroundColor(0, 0, 0, 1); // Set the gl canvas background color.
  
  let 
  byteOffset = 0,

  // Tell gl where read from our arrayBuffer to set our shader attibute variables each time an image is drawn.
  setupAttribute = (name, dataType, amount) => {
    var attribute = gl2_gl.getAttribLocation(shaderProgram, name);
    gl2_gl.enableVertexAttribArray(attribute);
    gl2_gl.vertexAttribPointer(attribute, amount, dataType, false, bytesPerImage, byteOffset);
    gl2_extension.vertexAttribDivisorANGLE(attribute, 1);
    if(dataType == gl2_gl.SHORT) amount *= 2;			
    if(dataType == gl2_gl.FLOAT) amount *= 4;
    byteOffset += amount;
  },
  
  // Create a shader object of the the given type with the given code.
  createShader = (type, code) => {
    var shader = gl2_gl.createShader(type);
    gl2_gl.shaderSource(shader, code);
    gl2_gl.compileShader(shader);
    return shader;
  },

  // Bind the given buffer of the given type with the given usage.
  bindBuffer = (bufferType, buffer, usage = gl2_gl.STATIC_DRAW) => {
    gl2_gl.bindBuffer(bufferType, gl2_gl.createBuffer());
    gl2_gl.bufferData(bufferType, buffer, usage);
  },

  // Common strings that are reused in the shader code strings
  ATTRIBUTE = 'attribute',
  VARYING = 'varying',
  UNIFORM = 'uniform',  

  // Create shaders
  vertShader=createShader(gl2_gl.VERTEX_SHADER,`${ATTRIBUTE} vec2 a;${ATTRIBUTE} vec2 b;${ATTRIBUTE} vec2 c;${ATTRIBUTE} vec4 d;${ATTRIBUTE} vec4 e;${ATTRIBUTE} float f;${VARYING} highp vec2 g;${VARYING} vec4 h;${UNIFORM} vec2 i;${UNIFORM} vec2 j;void main(void){vec2 k;if(f!=0.0){float l=cos(f);float m=sin(f);vec2 n=c*(a-0.5);k=(b+vec2(l*n.x-m*n.y,m*n.x+l*n.y)+c/2.0)/i;}else{k=(b+c*a)/i;}gl_Position=vec4(k.x-1.0,1.0-k.y,0.0,1.0);g=(d.xy+d.zw*a)/j;if(e.x>127.0){float o=pow(2.0,(e.x-127.0)/16.0)/255.0;h=vec4(e.w*o,e.z*o,e.y*o,1.0);}else h=vec4(e.w/255.0,e.z/255.0,e.y/255.0,e.x/127.0);}`), // Each time we draw an image it will run this 6 times. Once for each point of the 2 triangles we use to make the image's rectangle area. The only thing that changes on each repeated draw for the same image is a, so we can get to each corner of the image's rectangle area.
  fragShader = createShader(gl2_gl.FRAGMENT_SHADER, `${VARYING} highp vec2 g;${VARYING} highp vec4 h;${UNIFORM} sampler2D p;void main(void){gl_FragColor=texture2D(p,g)*h;}`),

	// Create a shader program object and attach the shaders.
	shaderProgram = gl2_gl.createProgram();
	gl2_gl.attachShader(shaderProgram, vertShader);
	gl2_gl.attachShader(shaderProgram, fragShader);
	gl2_gl.linkProgram(shaderProgram);
	gl2_gl.useProgram(shaderProgram);
	gl2_shaderProgram = shaderProgram;
	
	// Tell gl that when we set the opacity, it should be semi transparent above what was already drawn.
	gl2_gl.blendFunc(gl2_gl.SRC_ALPHA, gl2_gl.ONE_MINUS_SRC_ALPHA);
	gl2_gl.enable(gl2_gl.BLEND);
	gl2_gl.disable(gl2_gl.DEPTH_TEST);

  bindBuffer(gl2_gl.ELEMENT_ARRAY_BUFFER, new Uint8Array([0, 1, 2, 2, 1, 3])); // Map triangle vertexes to our multiplier array, for which corner of the image drawn's rectangle each triangle point is at.

  bindBuffer(gl2_gl.ARRAY_BUFFER, new Float32Array([0,0, 0,1, 1,0, 1,1])); // Our multiplier array for destWidth/destHeight so we can get to each corner of the image drawn.

	// Size multiplier vec2 variable. This code goes here so that it's linked to the Float32Array above, using those values.
	var attribute = gl2_gl.getAttribLocation(shaderProgram, "a");
	gl2_gl.enableVertexAttribArray(attribute);
	gl2_gl.vertexAttribPointer(attribute, 2, gl2_gl.FLOAT, false, 0, 0);
	
	var 
  shortsPerImagePosition = 2, // Whenever we call our drawImage(), we put in 2 shorts into our arrayBuffer for position (destX,destY)
	shortsPerImageSize = 2, // Whenever we call our drawImage(), we put in 2 shorts into our arrayBuffer for size (destWidth,destHeight)
	shortsPerImageTexPos = 4, // Whenever we call our drawImage(), we also store 4 shorts into our arrayBuffer (texX,texY,texdestWidth,texdestHeight)
	bytesPerImageRgba = 4, // Whenever we call our drawImage(), we also store 4 bytes into our arrayBuffer (r,g,b,a) for color and alpha.
	floatsPerImageRotation = 1, // Whenever we call our drawImage(), we also put a float for rotation.
	bytesPerImage = shortsPerImagePosition * 2 + shortsPerImageSize * 2 + shortsPerImageTexPos * 2 + bytesPerImageRgba + floatsPerImageRotation * 4, // Total bytes stored into arrayBuffer per image = 24
	arrayBuffer = new ArrayBuffer(gl2_maxDraws * bytesPerImage); // Make a buffer big enough to have all the data for the max images we can show at the same time.
	gl2_positions = new Int16Array(arrayBuffer); // Make 3 views on the same arrayBuffer, because we store 3 data types into this same byte array. When we store image positions/UVs into our arrayBuffer we store them as shorts (int16's)
	gl2_rotations = new Float32Array(arrayBuffer); // When we store image rotation into our arrayBuffer we store it as float, because it's radians.
	gl2_rgbas = new Uint32Array(arrayBuffer); // When we store image rgbas into our arrayBuffer we store it as 1 4-byte int32.
	
  bindBuffer(gl2_gl.ARRAY_BUFFER, arrayBuffer, gl2_gl.DYNAMIC_DRAW); // Make the gl vertex buffer and link it to our arrayBuffer. Using DYNAMIC_DRAW because these change as images move around the screen.
  
  setupAttribute("b", gl2_gl.SHORT, shortsPerImagePosition); // Tell gl that each time an image is drawn, have it read 2 array slots from our arrayBuffer as short, and store them in the vec2 I made "b"
	setupAttribute("c", gl2_gl.SHORT, shortsPerImageSize); // Then read the next 2 array slots and store them in my vec2 "c"
	setupAttribute("d", gl2_gl.SHORT, shortsPerImageTexPos); // Then read the next 4 array slots and store them in my vec4 "d"
	setupAttribute("e", gl2_gl.UNSIGNED_BYTE, bytesPerImageRgba); // Then read the next 4 bytes and store them in my vec4 "e"
	setupAttribute("f", gl2_gl.FLOAT, floatsPerImageRotation); // Then read the next 4 bytes as 1 float and store it in my float "f"
	
	// Load the texture image.
	if(imageName) {
		gl2_jsImage = new Image();
		gl2_jsImage.onload = () => gl2_loadTexture(gl2_jsImage);
		gl2_jsImage.src = imageName;
	}
},

// Set the parameter with the given name.
gl2_setTexParameter = (name) => gl2_gl.texParameteri(gl2_gl.TEXTURE_2D, name, gl2_gl.NEAREST),

// This is a separate function so that you can call it again mid-game to change the artwork if you load a new image or canvas.
gl2_loadTexture = (image) => {
	// Create a gl texture from image file.
	gl2_gl.bindTexture(gl2_gl.TEXTURE_2D, gl2_gl.createTexture());
	gl2_gl.texImage2D(gl2_gl.TEXTURE_2D, 0, gl2_gl.RGBA, gl2_gl.RGBA, gl2_gl.UNSIGNED_BYTE, image);
	gl2_gl.generateMipmap(gl2_gl.TEXTURE_2D);
	gl2_gl.activeTexture(gl2_gl.TEXTURE0);
	
	// Tell gl that when draw images scaled up, keep it pixellated and don't smooth it.
	gl2_setTexParameter(gl2_gl.TEXTURE_MAG_FILTER);
	gl2_setTexParameter(gl2_gl.TEXTURE_MIN_FILTER);
	
	// Store texture size in vertex shader.
	gl2_texdestWidth = image.width;
	gl2_texdestHeight = image.height;
	gl2_gl.uniform2f(gl2_gl.getUniformLocation(gl2_shaderProgram, "j"), gl2_texdestWidth, gl2_texdestHeight);
	
	gl2_resize();

  gl2_ready = 1;
};
