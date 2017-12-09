/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog3/triangles.json"; // triangles file loc
var defaultEye = vec3.fromValues(0,1,-5); // default eye position in world space
var defaultCenter = vec3.fromValues(0,3,7  ); // default view direction in world space
var defaultUp = vec3.fromValues(0,1,0); // default view up vector
var lightAmbient = vec3.fromValues(1,1,1); // default light ambient emission
var lightDiffuse = vec3.fromValues(1,1,1); // default light diffuse emission
var lightSpecular = vec3.fromValues(1,1,1); // default light specular emission
var lightPosition = vec3.fromValues(2,4,-0.5); // default light position
var rotateTheta = Math.PI/50; // how much to rotate models by with each key press

/* webgl and geometry data */
var gl = null; // the all powerful gl object. It's all here folks!
var inputTriangles = []; // the triangle data as loaded from input files
var numTriangleSets = 0; // how many triangle sets in input scene

//var textureBuffers = []; 
var samplerUniform;
var uvTextureLoc;
var uniToggleTexture =0;

/* shader parameter locations */
var vPosAttribLoc; // where to put position for vertex shader
var mMatrixULoc; // where to put model matrix for vertex shader
var pvmMatrixULoc; // where to put project model view matrix for vertex shader
var ambientULoc; // where to put ambient reflecivity for fragment shader
var diffuseULoc; // where to put diffuse reflecivity for fragment shader
var specularULoc; // where to put specular reflecivity for fragment shader
var shininessULoc; // where to put specular exponent for fragment shader


var alphaULoc; //location of alpha 
var useTextureLoc //use texture

/* interaction variables */
var Eye = vec3.clone(defaultEye); // eye position in world space
var Center = vec3.clone(defaultCenter); // view direction in world space
var Up = vec3.clone(defaultUp); // view up vector in world space
var viewDelta = 0; // how much to displace view with each key press

//input from users
var use_light;
var toggle_Texture = 0; //maximum value is 2

var scenes = []; //total 9 scenes: 6cities and 3 missile launcher
var attack_missile_list = []; // list of missiles coming to attack
var defend_missile_list = []; //list of missiles send to defend

var missile_list = [];
var scene_terrain = [];

var explode_list = [];
// ASSIGNMENT HELPER FUNCTIONS


// get the JSON file from the passed URL
function getJSONFile(url,descr) {
    try {
        if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
            throw "getJSONFile: parameter not a string";
        else {
            var httpReq = new XMLHttpRequest(); // a new http request
            httpReq.open("GET",url,false); // init the request
            httpReq.send(null); // send the request
            var startTime = Date.now();
            while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
                if ((Date.now()-startTime) > 3000)
                    break;
            } // until its loaded or we time out after three seconds
            if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
                throw "Unable to open "+descr+" file!";
            else
                return JSON.parse(httpReq.response); 
        } // end if good params
    } // end try    
    
    catch(e) {
        console.log(e);
        return(String.null);
    }
} // end get input json file

// does stuff when keys are pressed
function handleKeyDown(event) {
    
    const modelEnum = {TRIANGLES: "triangles", ELLIPSOID: "ellipsoid"}; // enumerated model type
    const dirEnum = {NEGATIVE: -1, POSITIVE: 1}; // enumerated rotation direction
    
    function highlightModel(modelType,whichModel) {
        if (handleKeyDown.modelOn != null)
            handleKeyDown.modelOn.on = false;
        handleKeyDown.whichOn = whichModel;
        handleKeyDown.modelOn = inputTriangles[whichModel]; 
        handleKeyDown.modelOn.on = true; 
    } // end highlight model
    
    function translateModel(offset) {
        if (handleKeyDown.modelOn != null)
            vec3.add(handleKeyDown.modelOn.translation,handleKeyDown.modelOn.translation,offset);
    } // end translate model

    function rotateModel(axis,direction) {
        if (handleKeyDown.modelOn != null) {
            var newRotation = mat4.create();

            mat4.fromRotation(newRotation,direction*rotateTheta,axis); // get a rotation matrix around passed axis
            vec3.transformMat4(handleKeyDown.modelOn.xAxis,handleKeyDown.modelOn.xAxis,newRotation); // rotate model x axis tip
            vec3.transformMat4(handleKeyDown.modelOn.yAxis,handleKeyDown.modelOn.yAxis,newRotation); // rotate model y axis tip
        } // end if there is a highlighted model
    } // end rotate model
    
    // set up needed view params
    var lookAt = vec3.create(), viewRight = vec3.create(), temp = vec3.create(); // lookat, right & temp vectors
    lookAt = vec3.normalize(lookAt,vec3.subtract(temp,Center,Eye)); // get lookat vector
    viewRight = vec3.normalize(viewRight,vec3.cross(temp,lookAt,Up)); // get view right vector
    
    // highlight static variables
    handleKeyDown.whichOn = handleKeyDown.whichOn == undefined ? -1 : handleKeyDown.whichOn; // nothing selected initially
    handleKeyDown.modelOn = handleKeyDown.modelOn == undefined ? null : handleKeyDown.modelOn; // nothing selected initially

    switch (event.code) {
        
        // model selection
        case "Space": 
            if (handleKeyDown.modelOn != null)
                handleKeyDown.modelOn.on = false; // turn off highlighted model
            handleKeyDown.modelOn = null; // no highlighted model
            handleKeyDown.whichOn = -1; // nothing highlighted
            break;
        case "ArrowRight": // select next triangle set
            highlightModel(modelEnum.TRIANGLES,(handleKeyDown.whichOn+1) % numTriangleSets);
            break;
        case "ArrowLeft": // select previous triangle set
            highlightModel(modelEnum.TRIANGLES,(handleKeyDown.whichOn > 0) ? handleKeyDown.whichOn-1 : numTriangleSets-1);
            break;
            
        // view change
        case "KeyA": // translate view left, rotate left with shift
            Center = vec3.add(Center,Center,vec3.scale(temp,viewRight,viewDelta));
            if (!event.getModifierState("Shift"))
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,viewRight,viewDelta));
            break;
        case "KeyD": // translate view right, rotate right with shift
            Center = vec3.add(Center,Center,vec3.scale(temp,viewRight,-viewDelta));
            if (!event.getModifierState("Shift"))
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,viewRight,-viewDelta));
            break;
        case "KeyS": // translate view backward, rotate up with shift
            if (event.getModifierState("Shift")) {
                Center = vec3.add(Center,Center,vec3.scale(temp,Up,viewDelta));
                Up = vec3.cross(Up,viewRight,vec3.subtract(lookAt,Center,Eye)); /* global side effect */
            } else {
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,lookAt,-viewDelta));
                Center = vec3.add(Center,Center,vec3.scale(temp,lookAt,-viewDelta));
            } // end if shift not pressed
            break;
        case "KeyW": // translate view forward, rotate down with shift
            if (event.getModifierState("Shift")) {
                Center = vec3.add(Center,Center,vec3.scale(temp,Up,-viewDelta));
                Up = vec3.cross(Up,viewRight,vec3.subtract(lookAt,Center,Eye)); /* global side effect */
            } else {
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,lookAt,viewDelta));
                Center = vec3.add(Center,Center,vec3.scale(temp,lookAt,viewDelta));
            } // end if shift not pressed
            break;
        case "KeyQ": // translate view up, rotate counterclockwise with shift
            if (event.getModifierState("Shift"))
                Up = vec3.normalize(Up,vec3.add(Up,Up,vec3.scale(temp,viewRight,-viewDelta)));
            else {
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,Up,viewDelta));
                Center = vec3.add(Center,Center,vec3.scale(temp,Up,viewDelta));
            } // end if shift not pressed
            break;
        case "KeyE": // translate view down, rotate clockwise with shift
            if (event.getModifierState("Shift"))
                Up = vec3.normalize(Up,vec3.add(Up,Up,vec3.scale(temp,viewRight,viewDelta)));
            else {
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,Up,-viewDelta));
                Center = vec3.add(Center,Center,vec3.scale(temp,Up,-viewDelta));
            } // end if shift not pressed
            break;
        case "Escape": // reset view to default
            Eye = vec3.copy(Eye,defaultEye);
            Center = vec3.copy(Center,defaultCenter);
            Up = vec3.copy(Up,defaultUp);
            break;
            
        // model transformation
        case "KeyK": // translate left, rotate left with shift
            if (event.getModifierState("Shift"))
                rotateModel(Up,dirEnum.NEGATIVE);
            else
                translateModel(vec3.scale(temp,viewRight,viewDelta));
            break;
        case "Semicolon": // translate right, rotate right with shift
            if (event.getModifierState("Shift"))
                rotateModel(Up,dirEnum.POSITIVE);
            else
                translateModel(vec3.scale(temp,viewRight,-viewDelta));
            break;
        case "KeyL": // translate backward, rotate up with shift
            if (event.getModifierState("Shift"))
                rotateModel(viewRight,dirEnum.POSITIVE);
            else
                translateModel(vec3.scale(temp,lookAt,-viewDelta));
            break;
        case "KeyO": // translate forward, rotate down with shift
            if (event.getModifierState("Shift"))
                rotateModel(viewRight,dirEnum.NEGATIVE);
            else
                translateModel(vec3.scale(temp,lookAt,viewDelta));
            break;
        case "KeyI": // translate up, rotate counterclockwise with shift 
            if (event.getModifierState("Shift"))
                rotateModel(lookAt,dirEnum.POSITIVE);
            else
                translateModel(vec3.scale(temp,Up,viewDelta));
            break;
        case "KeyP": // translate down, rotate clockwise with shift
            if (event.getModifierState("Shift"))
                rotateModel(lookAt,dirEnum.NEGATIVE);
            else
                translateModel(vec3.scale(temp,Up,-viewDelta));
            break;
        case "Backspace": // reset model transforms to default
            for (var whichTriSet=0; whichTriSet<numTriangleSets; whichTriSet++) {
                vec3.set(inputTriangles[whichTriSet].translation,0,0,0);
                vec3.set(inputTriangles[whichTriSet].xAxis,1,0,0);
                vec3.set(inputTriangles[whichTriSet].yAxis,0,1,0);
            } // end for all triangle sets
            break;
    } // end switch
} // end handleKeyDown

// set up the webGL environment
function setupWebGL() {
    
    // Set up keys
    document.onkeydown = handleKeyDown; // call this when key pressed

      // Get the image canvas, render an image in it
     var imageCanvas = document.getElementById("myImageCanvas"); // create a 2d canvas
     imageCanvas.width = window.innerWidth;
     imageCanvas.height = window.innerHeight;

      var cw = imageCanvas.width, ch = imageCanvas.height; 
      imageContext = imageCanvas.getContext("2d"); 
      var bkgdImage = new Image(); 
      //bkgdImage.src = "https://ncsucgclass.github.io/prog3/sky.jpg";
      bkgdImage.src = "https://jainpriyal.github.io/textures/stars.jpg";
      bkgdImage.onload = function(){
          var iw = bkgdImage.width, ih = bkgdImage.height;
          imageContext.drawImage(bkgdImage,0,0,iw,ih,0,0,cw,ch);   
     } // end onload callback
    
     // create a webgl canvas and set it up
     var webGLCanvas = document.getElementById("myWebGLCanvas"); // create a webgl canvas
     webGLCanvas.width = window.innerWidth;
     webGLCanvas.height = window.innerHeight;

     webGLCanvas.onmousedown = send_defend_missile;

     gl = webGLCanvas.getContext("webgl"); // get a webgl object from i
     try {
       if (gl == null) {
         throw "unable to create gl context -- is your browser gl ready?";
       } else {
         //gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
         gl.clearDepth(1.0); // use max when we clear the depth buffer
         gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
         gl.depthMask(true);

         //setup game start audio
        var startAudio = document.createElement('audio');
        var start_source = document.createElement('source');
        //modification
        //add game start audio
        start_source.src = "/Users/pjain12/Downloads/gameOver.wav";
        startAudio.appendChild(start_source);
        startAudio.play();
       }
     } // end try
     
     catch(e) {
       console.log(e);
     } // end catch
} // end setupWebGL


function generateRandomValue(min, max) {
  // min = Math.ceil(min);
  // max = Math.floor(max);
  // return Math.floor(Math.random() * (max - min)) + min;
  return Math.random() * (max - min) + min;
}

function getRandomScene(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

// read models in, load them into webgl buffers
function loadModels() {

    //??? anything with max value min value doubt
    var maxCorner = vec3.fromValues(-10, -10, -10); // bbox corner
    var minCorner = vec3.fromValues(10, 10, 10); // other corner

    //load terrain
    var terrain = new Terrain(gl);
    terrain.load_model();

    //load cities
    var city1 = new City(gl);
    city1.load_city(-1.5, 0, 0);

    var city2 = new City(gl);
    city2.load_city(-1, 0,0);

    var city3 = new City(gl);
    city3.load_city(-0.5, 0,0);

    var city4 = new City(gl);
    city4.load_city(0.5, 0,0);

    var city5 = new City(gl);
    city5.load_city(1, 0,0);

    var city6 = new City(gl);
    city6.load_city(1.5, 0,0);

    //load missile launchers
    var missile_launcher1 = new MissileLauncher(gl);
    missile_launcher1.load_missile(-2, 0,0);

    var missile_launcher2 = new MissileLauncher(gl);
    missile_launcher2.load_missile(0,0,0);

    var missile_launcher3 = new MissileLauncher(gl);
    missile_launcher3.load_missile(2, 0,0);

    scene_terrain.push(terrain);
    scenes.push(city1);
    scenes.push(city2);
    scenes.push(city3);

    scenes.push(city4);
    scenes.push(city5);
    scenes.push(city6);

    scenes.push(missile_launcher1);
    scenes.push(missile_launcher2);
    scenes.push(missile_launcher3);
    
    launch_missile();

    launch_spaceship();

    var temp = vec3.create();
    viewDelta = vec3.length(vec3.subtract(temp,maxCorner,minCorner)) / 100; // set global 

} // end load models

function launch_missile()
{

    for(var i=0; i<1; i++){
        var dest = scenes[getRandomScene(0,scenes.length)];
        // var dest = vec3.fromValues(-1.5, 0, 0);
        if(dest.visible==true){
            attack_missile = new AttackMissile(gl);

            src= vec3.fromValues(generateRandomValue(0, 2.5), 4, 0);

            attack_missile.load_missile(src[0], src[1], src[2]);

            attack_missile_list.push(attack_missile);
            var trans_x = (src[0]-dest.x)/35;
            var trans_y = (src[1]-dest.y)/35;
            attack_missile.animate_missile(trans_x, trans_y, dest, explode_list);
        }
        else{
            i=i-1;
        }
    }

    setTimeout(launch_missile, 3000);
}

function launch_spaceship()
{
    var spaceship = new SpaceShip(gl);
    spaceship.load_spaceship(3, 3.5, 0);
    attack_missile_list.push(spaceship);
    var dest = vec3.fromValues(-3,3.5,0);
    spaceship.animate_spaceship(0.1,dest);
    setTimeout(launch_spaceship, 9000);
}
//send 
function send_defend_missile(event){

    val_x = (event.clientX/window.innerWidth)*2-1;
    val_y = (event.clientY/window.innerHeight)*2-1;

    console.log("************** canvas val_X: " + val_x + "**** val_y: " + val_y);
    //canvas_x = -2.25*val_x - 0.25;
    canvas_x = -2.7*val_x + 0.2;
    canvas_y = -2.7*val_y + 2.;
    // canvas_y = -10*val_y + 10;

    console.log("********* canvas_x: " + canvas_x);
    console.log("********* canvas_y: " + canvas_y);

    defend_missile = new DefendMissile(gl);
    dest= vec3.fromValues(canvas_x, canvas_y, 0);

    scenes[8].visible==false;
    if(canvas_x>1.5 && scenes[8].visible==true)
    {
        console.log("********* inside if *******");
        src = vec3.fromValues(2, 0, 0);
    }
    else if(canvas_x>0.5 && scenes[7].visible==true)
    {
        console.log("********* inside else if *********");
        src = vec3.fromValues(0, 0, 0);

    }
    else if(scenes[6].visible==true){
                console.log("********* inside last else if *********");
        src = vec3.fromValues(-2, 0, 0);

    }
    else{
                console.log("********* inside else *********");
        return;
    }
    defend_missile.load_missile(src[0], src[1], 0);
    defend_missile_list.push(defend_missile);
    console.log("********** src: *****" +src);

    // console.log("******** sending defend missile: src: " + src + "***** dest: " + dest);
    defend_missile.animate_defend_missile((src[0]-dest[0])/8 , (src[1]-dest[1])/8, dest, attack_missile_list, explode_list);
}

// setup the webGL shaders
function setupShaders() {
    
    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        attribute vec3 aVertexPosition; // vertex position
        attribute vec3 aVertexNormal; // vertex normal
        
        attribute vec2 uvTexturePosition;

        uniform mat4 umMatrix; // the model matrix
        uniform mat4 upvmMatrix; // the project view model matrix
        
        varying vec3 vWorldPos; // interpolated world position of vertex
        varying vec3 vVertexNormal; // interpolated normal for frag shader

        varying vec2 uvVaryingTexturePosition;
        void main(void) {
            
            // vertex position
            vec4 vWorldPos4 = umMatrix * vec4(aVertexPosition, 1.0);
            vWorldPos = vec3(vWorldPos4.x,vWorldPos4.y,vWorldPos4.z);
            gl_Position = upvmMatrix * vec4(aVertexPosition, 1.0);

            // vertex normal (assume no non-uniform scale)
            vec4 vWorldNormal4 = umMatrix * vec4(aVertexNormal, 0.0);
            vVertexNormal = normalize(vec3(vWorldNormal4.x,vWorldNormal4.y,vWorldNormal4.z)); 
            uvVaryingTexturePosition = uvTexturePosition;
        }
    `;
    
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        precision mediump float; // set float to medium precision

        // eye location
        uniform vec3 uEyePosition; // the eye's position in world
        
        // light properties
        uniform vec3 uLightAmbient; // the light's ambient color
        uniform vec3 uLightDiffuse; // the light's diffuse color
        uniform vec3 uLightSpecular; // the light's specular color
        uniform vec3 uLightPosition; // the light's position
        
        //uniform sampler
        uniform sampler2D uSampler;

        // material properties
        uniform vec3 uAmbient; // the ambient reflectivity
        uniform vec3 uDiffuse; // the diffuse reflectivity
        uniform vec3 uSpecular; // the specular reflectivity
        uniform float uShininess; // the specular exponent
        uniform float uAlphaVal; //alpha value
        
        // geometry properties
        varying vec3 vWorldPos; // world xyz of fragment
        varying vec3 vVertexNormal; // normal of fragment
        varying vec2 uvVaryingTexturePosition;
            
        void main(void) {
        
            // ambient term
            vec3 ambient = uAmbient*uLightAmbient; 
            
            // diffuse term
            vec3 normal = normalize(vVertexNormal); 
            vec3 light = normalize(uLightPosition - vWorldPos);
            float lambert = max(0.0,dot(normal,light));
            vec3 diffuse = uDiffuse*uLightDiffuse*lambert; // diffuse term
            
            // specular term
            vec3 eye = normalize(uEyePosition - vWorldPos);
            vec3 halfVec = normalize(light+eye);
            float highlight = pow(max(0.0,dot(normal,halfVec)),uShininess);
            vec3 specular = uSpecular*uLightSpecular*highlight; // specular term
            
            // combine to output color
            vec3 colorOut = ambient + diffuse + specular; // no specular yet

            highp vec4 texelColor = texture2D(uSampler, vec2(uvVaryingTexturePosition.s, uvVaryingTexturePosition.t));
            gl_FragColor = vec4(colorOut, uAlphaVal)*texelColor;
        }
    `;
    
    try {
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution
            
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                
                // locate and enable vertex attributes
                vPosAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexPosition"); // ptr to vertex pos attrib
                gl.enableVertexAttribArray(vPosAttribLoc); // connect attrib to array
                vNormAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexNormal"); // ptr to vertex normal attrib
                gl.enableVertexAttribArray(vNormAttribLoc); // connect attrib to array

                //locate and enable texture uv attributes
                uvTextureLoc = gl.getAttribLocation(shaderProgram, "uvTexturePosition"); //ptr to UV pos attrib
                gl.enableVertexAttribArray(uvTextureLoc); //connect attrib to array

                
                // locate vertex uniforms
                mMatrixULoc = gl.getUniformLocation(shaderProgram, "umMatrix"); // ptr to mmat
                pvmMatrixULoc = gl.getUniformLocation(shaderProgram, "upvmMatrix"); // ptr to pvmmat
                
                // locate fragment uniforms
                var eyePositionULoc = gl.getUniformLocation(shaderProgram, "uEyePosition"); // ptr to eye position
                var lightAmbientULoc = gl.getUniformLocation(shaderProgram, "uLightAmbient"); // ptr to light ambient
                var lightDiffuseULoc = gl.getUniformLocation(shaderProgram, "uLightDiffuse"); // ptr to light diffuse
                var lightSpecularULoc = gl.getUniformLocation(shaderProgram, "uLightSpecular"); // ptr to light specular
                var lightPositionULoc = gl.getUniformLocation(shaderProgram, "uLightPosition"); // ptr to light position
                ambientULoc = gl.getUniformLocation(shaderProgram, "uAmbient"); // ptr to ambient
                diffuseULoc = gl.getUniformLocation(shaderProgram, "uDiffuse"); // ptr to diffuse
                specularULoc = gl.getUniformLocation(shaderProgram, "uSpecular"); // ptr to specular
                shininessULoc = gl.getUniformLocation(shaderProgram, "uShininess"); // ptr to shininess

                alphaULoc = gl.getUniformLocation(shaderProgram, "uAlphaVal");
                samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
                
                // pass global constants into fragment uniforms
                gl.uniform3fv(eyePositionULoc,Eye); // pass in the eye's position
                gl.uniform3fv(lightAmbientULoc,lightAmbient); // pass in the light's ambient emission
                gl.uniform3fv(lightDiffuseULoc,lightDiffuse); // pass in the light's diffuse emission
                gl.uniform3fv(lightSpecularULoc,lightSpecular); // pass in the light's specular emission
                gl.uniform3fv(lightPositionULoc,lightPosition); // pass in the light's position
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders


// render the loaded model
function renderModels() {

    console.log("************* inside render models ***********" + scenes.length);

    
    var pMatrix = mat4.create(); // projection matrix
    var vMatrix = mat4.create(); // view matrix
    var mMatrix = mat4.create(); // model matrix
    var pvMatrix = mat4.create(); // hand * proj * view matrices
    var pvmMatrix = mat4.create(); // hand * proj * view * model matrices
    
    window.requestAnimationFrame(renderModels); // set up frame render callback
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    
    // set up projection and view
    // mat4.fromScaling(hMatrix,vec3.fromValues(-1,1,1)); // create handedness matrix
    mat4.perspective(pMatrix,0.3*Math.PI,1,0.1,100); // create projection matrix
    mat4.lookAt(vMatrix,Eye,Center,Up); // create view matrix
    mat4.multiply(pvMatrix,pvMatrix,pMatrix); // projection
    mat4.multiply(pvMatrix,pvMatrix,vMatrix); // projection * view

    // render each triangle set
    //var currSet; // the tri set and its material properties
    //for (var whichTriSet=0; whichTriSet<numTriangleSets; whichTriSet++) {
       // currSet = inputTriangles[whichTriSet];

    currscene = scene_terrain[0];
    mat4.multiply(pvmMatrix,pvMatrix,currscene.modelMatrix); // project * view * model
    gl.uniformMatrix4fv(mMatrixULoc, false, currscene.modelMatrix); // pass in the m matrix
    gl.uniformMatrix4fv(pvmMatrixULoc, false, pvmMatrix); // pass in the hpvm matrix
    
    // reflectivity: feed to the fragment shader
    gl.uniform3fv(ambientULoc,currscene.material.ambient); // pass in the ambient reflectivity
    gl.uniform3fv(diffuseULoc,currscene.material.diffuse); // pass in the diffuse reflectivity
    gl.uniform3fv(specularULoc,currscene.material.specular); // pass in the specular reflectivity
    gl.uniform1f(shininessULoc,currscene.material.n); // pass in the specular exponent

    gl.uniform1f(alphaULoc,currscene.material.alpha); //alpha location

    // vertex buffer: activate and feed into vertex shader
    gl.bindBuffer(gl.ARRAY_BUFFER,currscene.vertexBuffers); // activate
    gl.vertexAttribPointer(vPosAttribLoc,3,gl.FLOAT,false,0,0); // feed
    gl.bindBuffer(gl.ARRAY_BUFFER,currscene.normalBuffers); // activate
    gl.vertexAttribPointer(vNormAttribLoc,3,gl.FLOAT,false,0,0); // feed\

    //uv buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, currscene.textureBuffers);
    gl.vertexAttribPointer(uvTextureLoc,2,gl.FLOAT,false,0,0);

    //bind texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, currscene.triangleTexture);
    gl.uniform1i(samplerUniform, 0);

    // triangle buffer: activate and render
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, currscene.triangleBuffers); // activate
    //gl.drawElements(gl.TRIANGLES, 3*terrain.triSetSizes,gl.UNSIGNED_SHORT,0); // render
    gl.drawElements(gl.TRIANGLES, 3*currscene.triSetSizes,gl.UNSIGNED_SHORT,0); // render

    //render scenes
    for (var iter=0; iter<scenes.length; iter++)
    {
        currscene = scenes[iter];
        if(currscene.visible==true){
            mat4.multiply(pvmMatrix,pvMatrix,currscene.modelMatrix); // project * view * model
            gl.uniformMatrix4fv(mMatrixULoc, false, currscene.modelMatrix); // pass in the m matrix
            gl.uniformMatrix4fv(pvmMatrixULoc, false, pvmMatrix); // pass in the hpvm matrix
            
            // reflectivity: feed to the fragment shader
            gl.uniform3fv(ambientULoc,currscene.material.ambient); // pass in the ambient reflectivity
            gl.uniform3fv(diffuseULoc,currscene.material.diffuse); // pass in the diffuse reflectivity
            gl.uniform3fv(specularULoc,currscene.material.specular); // pass in the specular reflectivity
            gl.uniform1f(shininessULoc,currscene.material.n); // pass in the specular exponent

            gl.uniform1f(alphaULoc,currscene.material.alpha); //alpha location

            // vertex buffer: activate and feed into vertex shader
            gl.bindBuffer(gl.ARRAY_BUFFER,currscene.vertexBuffers); // activate
            gl.vertexAttribPointer(vPosAttribLoc,3,gl.FLOAT,false,0,0); // feed
            gl.bindBuffer(gl.ARRAY_BUFFER,currscene.normalBuffers); // activate
            gl.vertexAttribPointer(vNormAttribLoc,3,gl.FLOAT,false,0,0); // feed\

            //uv buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, currscene.textureBuffers);
            gl.vertexAttribPointer(uvTextureLoc,2,gl.FLOAT,false,0,0);

            //bind texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, currscene.triangleTexture);
            gl.uniform1i(samplerUniform, 0);

            // triangle buffer: activate and render
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, currscene.triangleBuffers); // activate
            //gl.drawElements(gl.TRIANGLES, 3*terrain.triSetSizes,gl.UNSIGNED_SHORT,0); // render
            gl.drawElements(gl.TRIANGLES, 3*currscene.triSetSizes,gl.UNSIGNED_SHORT,0); // render
        }
    }

    //render attack missile
    for (var item=0; item<attack_missile_list.length; item++)
    {
        currscene = attack_missile_list[item];
        if(currscene.visible==true)
        {
            mat4.multiply(pvmMatrix,pvMatrix,currscene.modelMatrix); // project * view * model
            gl.uniformMatrix4fv(mMatrixULoc, false, currscene.modelMatrix); // pass in the m matrix
            gl.uniformMatrix4fv(pvmMatrixULoc, false, pvmMatrix); // pass in the hpvm matrix
            
            // reflectivity: feed to the fragment shader
            gl.uniform3fv(ambientULoc,currscene.material.ambient); // pass in the ambient reflectivity
            gl.uniform3fv(diffuseULoc,currscene.material.diffuse); // pass in the diffuse reflectivity
            gl.uniform3fv(specularULoc,currscene.material.specular); // pass in the specular reflectivity
            gl.uniform1f(shininessULoc,currscene.material.n); // pass in the specular exponent

            gl.uniform1f(alphaULoc,currscene.material.alpha); //alpha location

            // vertex buffer: activate and feed into vertex shader
            gl.bindBuffer(gl.ARRAY_BUFFER,currscene.vertexBuffers); // activate
            gl.vertexAttribPointer(vPosAttribLoc,3,gl.FLOAT,false,0,0); // feed
            gl.bindBuffer(gl.ARRAY_BUFFER,currscene.normalBuffers); // activate
            gl.vertexAttribPointer(vNormAttribLoc,3,gl.FLOAT,false,0,0); // feed\

            //uv buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, currscene.textureBuffers);
            gl.vertexAttribPointer(uvTextureLoc,2,gl.FLOAT,false,0,0);

            //bind texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, currscene.triangleTexture);
            gl.uniform1i(samplerUniform, 0);

            // triangle buffer: activate and render
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, currscene.triangleBuffers); // activate
            //gl.drawElements(gl.TRIANGLES, 3*terrain.triSetSizes,gl.UNSIGNED_SHORT,0); // render
            gl.drawElements(gl.TRIANGLES, 3*currscene.triSetSizes,gl.UNSIGNED_SHORT,0); // render
        }
    }

    //render defend missiles
    for (var item=0; item<defend_missile_list.length; item++)
    {
        currscene = defend_missile_list[item];
        if(currscene.visible==true)
        {
            mat4.multiply(pvmMatrix,pvMatrix,currscene.modelMatrix); // project * view * model
            gl.uniformMatrix4fv(mMatrixULoc, false, currscene.modelMatrix); // pass in the m matrix
            gl.uniformMatrix4fv(pvmMatrixULoc, false, pvmMatrix); // pass in the hpvm matrix
            
            // reflectivity: feed to the fragment shader
            gl.uniform3fv(ambientULoc,currscene.material.ambient); // pass in the ambient reflectivity
            gl.uniform3fv(diffuseULoc,currscene.material.diffuse); // pass in the diffuse reflectivity
            gl.uniform3fv(specularULoc,currscene.material.specular); // pass in the specular reflectivity
            gl.uniform1f(shininessULoc,currscene.material.n); // pass in the specular exponent

            gl.uniform1f(alphaULoc,currscene.material.alpha); //alpha location

            // vertex buffer: activate and feed into vertex shader
            gl.bindBuffer(gl.ARRAY_BUFFER,currscene.vertexBuffers); // activate
            gl.vertexAttribPointer(vPosAttribLoc,3,gl.FLOAT,false,0,0); // feed
            gl.bindBuffer(gl.ARRAY_BUFFER,currscene.normalBuffers); // activate
            gl.vertexAttribPointer(vNormAttribLoc,3,gl.FLOAT,false,0,0); // feed\

            //uv buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, currscene.textureBuffers);
            gl.vertexAttribPointer(uvTextureLoc,2,gl.FLOAT,false,0,0);

            //bind texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, currscene.triangleTexture);
            gl.uniform1i(samplerUniform, 0);

            // triangle buffer: activate and render
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, currscene.triangleBuffers); // activate
            //gl.drawElements(gl.TRIANGLES, 3*terrain.triSetSizes,gl.UNSIGNED_SHORT,0); // render
            gl.drawElements(gl.TRIANGLES, 3*currscene.triSetSizes,gl.UNSIGNED_SHORT,0); // render
        }
    }

    //render explosion
    for (var item=0; item<explode_list.length; item++)
    {
        currscene = explode_list[item];
        if(currscene.visible==true)
        {
            mat4.multiply(pvmMatrix,pvMatrix,currscene.modelMatrix); // project * view * model
            gl.uniformMatrix4fv(mMatrixULoc, false, currscene.modelMatrix); // pass in the m matrix
            gl.uniformMatrix4fv(pvmMatrixULoc, false, pvmMatrix); // pass in the hpvm matrix
            
            // reflectivity: feed to the fragment shader
            gl.uniform3fv(ambientULoc,currscene.material.ambient); // pass in the ambient reflectivity
            gl.uniform3fv(diffuseULoc,currscene.material.diffuse); // pass in the diffuse reflectivity
            gl.uniform3fv(specularULoc,currscene.material.specular); // pass in the specular reflectivity
            gl.uniform1f(shininessULoc,currscene.material.n); // pass in the specular exponent

            gl.uniform1f(alphaULoc,currscene.material.alpha); //alpha location

            // vertex buffer: activate and feed into vertex shader
            gl.bindBuffer(gl.ARRAY_BUFFER,currscene.vertexBuffers); // activate
            gl.vertexAttribPointer(vPosAttribLoc,3,gl.FLOAT,false,0,0); // feed
            gl.bindBuffer(gl.ARRAY_BUFFER,currscene.normalBuffers); // activate
            gl.vertexAttribPointer(vNormAttribLoc,3,gl.FLOAT,false,0,0); // feed\

            //uv buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, currscene.textureBuffers);
            gl.vertexAttribPointer(uvTextureLoc,2,gl.FLOAT,false,0,0);

            //bind texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, currscene.triangleTexture);
            gl.uniform1i(samplerUniform, 0);

            // triangle buffer: activate and render
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, currscene.triangleBuffers); // activate
            //gl.drawElements(gl.TRIANGLES, 3*terrain.triSetSizes,gl.UNSIGNED_SHORT,0); // render
            gl.drawElements(gl.TRIANGLES, 3*currscene.triSetSizes,gl.UNSIGNED_SHORT,0); // render
        }
    }



} // end render model


/* MAIN -- HERE is where execution begins after window load */
function main() {
  setupWebGL(); // set up the webGL environment
  loadModels(); // load in the models from tri file
  setupShaders(); // setup the webGL shaders
  renderModels(); // draw the triangles using webGL  
} // end main
