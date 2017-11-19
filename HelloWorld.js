"use strict";
var gl;
var program;

//uniform locations
var umv; //uniform for mv matrix
var uproj; //uniform for projection matrix

//matrices
var mv; //local mv
var p; //local projection

//shader variable indices for material properties
var vAmbientLight;
var vLightColor;
var vSpecularExponent;
var vLightPosition;
var utexmapsampler;//this will be a pointer to our sampler2D for color
var unighttexmapsampler;
var uspectexmapsampler;


//document elements
var canvas;

//geometry
var shapePoints;

var sphereStart;
var sphereLength;
var rectangleStart;
var rectangleLength;

var xAngle;
var yAngle;
var mouse_button_down = false;
var prevMouseX = 0;
var prevMouseY = 0;
var rotation;
var moving;

var worldcolortex;
var worldcolorimage;
var nightcolorimage;
var nightcolortex;
var speccolorimage;
var speccolortex;

var umode;
var mode;

window.onload = function init() {

    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if (!gl) {
        alert("WebGL isn't available");
    }

    canvas.addEventListener("mousedown", mouse_down);
    canvas.addEventListener("mousemove", mouse_drag);
    canvas.addEventListener("mouseup", mouse_up);

    //black background
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);


    program = initShaders(gl, "vshader-normal.glsl", "fshader-normal.glsl");

    gl.useProgram(program);
    umv = gl.getUniformLocation(program, "model_view");
    uproj = gl.getUniformLocation(program, "projection");
    utexmapsampler = gl.getUniformLocation(program, "colorMap");
    gl.uniform1i(utexmapsampler, 0);//assign this one to texture unit 0
    unighttexmapsampler = gl.getUniformLocation(program, "nightMap");
    gl.uniform1i(unighttexmapsampler, 1);//assign this one to texture unit 1
    uspectexmapsampler = gl.getUniformLocation(program, "specMap");
    gl.uniform1i(uspectexmapsampler, 2);//assign this one to texture unit 1

    umode = gl.getUniformLocation(program, "mode");

    vLightColor = gl.getUniformLocation(program, "light_color");
    vLightPosition = gl.getUniformLocation(program, "light_position");
    vAmbientLight = gl.getUniformLocation(program, "ambient_light");
    vSpecularExponent = gl.getUniformLocation(program, "specular_exponent");

    rotation = 0;
    moving = true;

    mode = 0;

    xAngle = 0;
    yAngle = 0;

    initTextures();
    makeShapesAndBuffer();

    //set up basic perspective viewing
    gl.viewport(0, 0, canvas.width, canvas.height);
    p = perspective(45, (canvas.width / canvas.height), 1, 20);
    gl.uniformMatrix4fv(uproj, false, flatten(p));

    window.addEventListener("keydown" ,function(event){
        switch(event.key) {
            case "m":
                if(moving) {
                    moving = false;
                }
                else {
                    moving = true;
                }
                break;
            case "r":
                xAngle = 0;
                yAngle = 0;
                break;
            case "ArrowLeft":
                rotation+=3;
                break;
            case "ArrowRight":
                rotation-=3;
                break;
            case "0":
                mode = 0;
                break;
            case "1":
                mode = 1;
                break;
            case "2":
                mode = 2;
                break;
        }

        requestAnimationFrame(render);//and now we need a new frame since we made a change
    });

    requestAnimationFrame(render);

    window.setInterval(update, 16); //target 60 frames per second

};

//update rotation angles based on mouse movement
function mouse_drag(){
    var thetaY, thetaX;
    if (mouse_button_down) {
        thetaY = 360.0 *(event.clientX-prevMouseX)/canvas.width;
        thetaX = 360.0 *(event.clientY-prevMouseY)/canvas.height;
        prevMouseX = event.clientX;
        prevMouseY = event.clientY;
        xAngle += thetaX;
        yAngle += thetaY;
    }
    requestAnimationFrame(render);
}

//record that the mouse button is now down
function mouse_down() {
    //establish point of reference for dragging mouse in window
    mouse_button_down = true;
    prevMouseX= event.clientX;
    prevMouseY = event.clientY;
    requestAnimationFrame(render);
}

//record that the mouse button is now up, so don't respond to mouse movements
function mouse_up(){
    mouse_button_down = false;
    requestAnimationFrame(render);
}

//Make a square and send it over to the graphics card
function makeShapesAndBuffer(){
    shapePoints = []; //empty array

    var steps = 60;

    var step = (360.0 / steps)*(Math.PI / 180.0); //how much do we increase the angles by per triangle?

    sphereStart = shapePoints.length/3;

    for (var lat = 0; lat <= Math.PI ; lat += step){ //latitude
        for (var lon = 0; lon + step <= 2*Math.PI; lon += step){ //longitude
            //triangle 1
            shapePoints.push(vec4(Math.sin(lat)*Math.cos(lon), Math.sin(lon)*Math.sin(lat), Math.cos(lat), 1.0)); //position
            shapePoints.push(vec4(Math.sin(lat)*Math.cos(lon), Math.sin(lon)*Math.sin(lat), Math.cos(lat), 0.0)); //normal
            shapePoints.push(vec2(1-lon/(2*Math.PI), lat/Math.PI)); // color texture

            shapePoints.push(vec4(Math.sin(lat)*Math.cos(lon+step), Math.sin(lat)*Math.sin(lon+step), Math.cos(lat), 1.0)); //position
            shapePoints.push(vec4(Math.sin(lat)*Math.cos(lon+step), Math.sin(lat)*Math.sin(lon+step), Math.cos(lat), 0.0)); //normal
            shapePoints.push(vec2(1-(lon+step)/(2*Math.PI), lat/Math.PI)); // color texture

            shapePoints.push(vec4(Math.sin(lat+step)*Math.cos(lon+step), Math.sin(lon+step)*Math.sin(lat+step), Math.cos(lat+step), 1.0));
            shapePoints.push(vec4(Math.sin(lat+step)*Math.cos(lon+step), Math.sin(lon+step)*Math.sin(lat+step), Math.cos(lat+step), 0.0));
            shapePoints.push(vec2(1-(lon+step)/(2*Math.PI), (lat+step)/Math.PI)); // color texture

            //triangle 2
            shapePoints.push(vec4(Math.sin(lat+step)*Math.cos(lon+step), Math.sin(lon+step)*Math.sin(lat+step), Math.cos(lat+step), 1.0));
            shapePoints.push(vec4(Math.sin(lat+step)*Math.cos(lon+step), Math.sin(lon+step)*Math.sin(lat+step), Math.cos(lat+step), 0.0));
            shapePoints.push(vec2(1-(lon+step)/(2*Math.PI), (lat+step)/Math.PI)); // color texture

            shapePoints.push(vec4(Math.sin(lat+step)*Math.cos(lon), Math.sin(lat+step)*Math.sin(lon), Math.cos(lat+step), 1.0));
            shapePoints.push(vec4(Math.sin(lat+step)*Math.cos(lon), Math.sin(lat+step)*Math.sin(lon), Math.cos(lat+step),0.0));
            shapePoints.push(vec2(1-lon/(2*Math.PI), (lat+step)/Math.PI)); // color texture

            shapePoints.push(vec4(Math.sin(lat)*Math.cos(lon), Math.sin(lon)*Math.sin(lat), Math.cos(lat), 1.0));
            shapePoints.push(vec4(Math.sin(lat)*Math.cos(lon), Math.sin(lon)*Math.sin(lat), Math.cos(lat), 0.0));
            shapePoints.push(vec2(1-lon/(2*Math.PI), lat/Math.PI)); // color texture
        }
    }

    sphereLength = shapePoints.length/3 - sphereStart;

    rectangleStart = shapePoints.length/3;

    shapePoints.push(vec4(1.5, -1, 0.0, 1.0));
    shapePoints.push(vec4(0, 0, 1.0, 0.0)); //normal
    shapePoints.push(vec2(1,0)); // color texture
    shapePoints.push(vec4(1.5, 1, 0.0, 1.0));
    shapePoints.push(vec4(0, 0, 1.0, 0.0)); //normal
    shapePoints.push(vec2(1,1)); // color texture
    shapePoints.push(vec4(-1.5, 1, 0.0, 1.0));
    shapePoints.push(vec4(0, 0, 1.0, 0.0)); //normal
    shapePoints.push(vec2(0,1)); // color texture
    shapePoints.push(vec4(-1.5, 1, 0.0, 1.0));
    shapePoints.push(vec4(0, 0, 1.0, 0.0)); //normal
    shapePoints.push(vec2(0,1)); // color texture
    shapePoints.push(vec4(-1.5, -1, 0.0, 1.0));
    shapePoints.push(vec4(0, 0, 1.0, 0.0)); //normal
    shapePoints.push(vec2(0,0)); // color texture
    shapePoints.push(vec4(1.5, -1, 0.0, 1.0));
    shapePoints.push(vec4(0, 0, 1.0, 0.0)); //normal
    shapePoints.push(vec2(1,0)); // color texture

    rectangleLength = shapePoints.length/3 - rectangleStart;

    //The tangent direction for a sphere will not be the same as for a flat square like this
    //Please don't try to copy and paste this for a sphere and expect it to work

    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(shapePoints), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 40, 0);
    gl.enableVertexAttribArray(vPosition);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 40, 16);
    gl.enableVertexAttribArray(vNormal);

    var vTexCoord = gl.getAttribLocation(program, "texCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 40, 32);
    gl.enableVertexAttribArray(vTexCoord);
}

function update() {
    if (moving) {
        rotation = rotation+0.25;
    }
    requestAnimationFrame(render);
}

//https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
function initTextures() {
    worldcolortex = gl.createTexture();
    worldcolorimage = new Image();
    worldcolorimage.onload = function() { handleTextureLoaded(worldcolorimage, worldcolortex); };
    worldcolorimage.src = 'earthimages/Earth.png';

    nightcolortex = gl.createTexture();
    nightcolorimage = new Image();
    nightcolorimage.onload = function() { handleTextureLoaded(nightcolorimage, nightcolortex); };
    nightcolorimage.src = 'earthimages/EarthNight.png';

    speccolortex = gl.createTexture();
    speccolorimage = new Image();
    speccolorimage.onload = function() { handleTextureLoaded(speccolorimage, speccolortex); };
    speccolorimage.src = 'earthimages/EarthSpec.png';
}

function handleTextureLoaded(image, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    var anisotropic_ext = gl.getExtension('EXT_texture_filter_anisotropic');
    gl.texParameterf(gl.TEXTURE_2D, anisotropic_ext.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

//draw a frame
function render(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //position camera 10 units back from origin
    mv = lookAt(vec3(0, 0, 5), vec3(0, 0, 0), vec3(0, 1, 0));

    var camera = mult(mv, mult(rotateY(yAngle), rotateX(xAngle)));

    //send the modelview matrix over
    mv = mult(camera, mult(rotateY(rotation), rotateX(90)));
    gl.uniformMatrix4fv(umv, false, flatten(mv));

    gl.uniform4fv(vLightPosition, mult(camera, vec4(50, 50, 25, 1)));  //light is locked to the camera position
    gl.uniform1f(vSpecularExponent, 30.0); // 30 is the gloss value
    gl.uniform4fv(vLightColor, vec4(0.8,0.8,0.8,1));
    gl.uniform4fv(vAmbientLight, vec4(0.5, 0.5, 0.5, 1.0));
    gl.uniform1i(umode, mode);


    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, worldcolortex); //which texture do we want?
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, nightcolortex);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, speccolortex);
    // Draw the sphere
    gl.drawArrays( gl.TRIANGLES, sphereStart, sphereLength );
    // Draw the rectangle
    // gl.drawArrays( gl.TRIANGLES, rectangleStart, rectangleLength );

}