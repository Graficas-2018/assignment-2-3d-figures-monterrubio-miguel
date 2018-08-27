var projectionMatrix;

var shaderProgram, shaderVertexPositionAttribute, shaderVertexColorAttribute, 
    shaderProjectionMatrixUniform, shaderModelViewMatrixUniform;

var duration = 8000; // ms

// Attributes: Input variables used in the vertex shader. Since the vertex shader is called on each vertex, these will be different every time the vertex shader is invoked.
// Uniforms: Input variables for both the vertex and fragment shaders. These do not change values from vertex to vertex.
// Varyings: Used for passing data from the vertex shader to the fragment shader. Represent information for which the shader can output different value for each vertex.
var vertexShaderSource =    
    "    attribute vec3 vertexPos;\n" +
    "    attribute vec4 vertexColor;\n" +
    "    uniform mat4 modelViewMatrix;\n" +
    "    uniform mat4 projectionMatrix;\n" +
    "    varying vec4 vColor;\n" +
    "    void main(void) {\n" +
    "		// Return the transformed and projected vertex value\n" +
    "        gl_Position = projectionMatrix * modelViewMatrix * \n" +
    "            vec4(vertexPos, 1.0);\n" +
    "        // Output the vertexColor in vColor\n" +
    "        vColor = vertexColor;\n" +
    "    }\n";

// precision lowp float
// This determines how much precision the GPU uses when calculating floats. The use of highp depends on the system.
// - highp for vertex positions,
// - mediump for texture coordinates,
// - lowp for colors.
var fragmentShaderSource = 
    "    precision lowp float;\n" +
    "    varying vec4 vColor;\n" +
    "    void main(void) {\n" +
    "    gl_FragColor = vColor;\n" +
    "}\n";

function initWebGL(canvas)
{
    var gl = null;
    var msg = "Your browser does not support WebGL, " +
        "or it is not enabled by default.";
    try 
    {
        gl = canvas.getContext("experimental-webgl");
    } 
    catch (e)
    {
        msg = "Error creating WebGL Context!: " + e.toString();
    }

    if (!gl)
    {
        alert(msg);
        throw new Error(msg);
    }

    return gl;        
 }

function initViewport(gl, canvas)
{
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function initGL(canvas)
{
    // Create a project matrix with 45 degree field of view
    projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Math.PI / 32, canvas.width / canvas.height, 1, 10000);
    mat4.translate(projectionMatrix, projectionMatrix, [0, 0, -40]);
}

// TO DO: Create the functions for each of the figures.
function createOcta(gl, translation, rotationAxis, translationAxis, altTranslation)
{    
    // Vertex Data
    var vertexBuffer2;
    vertexBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer2);

    var v1 = [0.0, -.75, 0.0];
    var v2 = [-.75, 0.0, 0.0];
    var v3 = [0.0, 0.0, .75];
    var v4 = [.75, 0.0, 0.0];
    var v5 = [0.0, 0.0, -.75];
    var v6 = [0.0, .75, 0.0];


    var verts = [
       //bottom face 1
       ...v1, ...v2, ...v3,

       //bottom face 2
       ...v1, ...v3, ...v4,

       //bottom face 3
       ...v1, ...v4, ...v5,

       //bottom face 4
       ...v1, ...v5, ...v2,

       //top face 1
       ...v6, ...v2, ...v3,

       //top face 2
       ...v6, ...v3, ...v4,

       //top face 3
       ...v6, ...v4, ...v5,

       //top face 4
       ...v6, ...v5, ...v2
       ];
       
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    // Color data
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    var faceColors = [
        [1.0, 0.0, 0.0, 1.0], // color 1
        [0.0, 0.0, 1.0, 1.0], // color 2
        [0.0, 1.0, 0.0, 1.0], // color 3
        [0.0, 1.0, 1.0, 1.0], // color 4 
        [1.0, 1.0, 0.0, 1.0], // color 5
        [1.0, 0.0, 1.0, 1.0], // color 6
        [1.0, 0.6, 0.4, 1.0], // color 7
        [0.4, 0.6, 0.2, 1.0], // color 8
    ];

    var vertexColors = [];

    // Each vertex must have the color information, that is why the same color is concatenated 3 times, one for each vertex of the octahedron's face.

    for (const color of faceColors) 
    {
        for (var j=0; j < 3; j++)
            vertexColors = vertexColors.concat(color);
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

    // Index data (defines the triangles to be drawn).
    var scutoidIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, scutoidIndexBuffer);
    var scutoidIndices = [
        0, 1, 2,        //Face 1
        3, 4, 5,        //Face 2
        6, 7, 8,        //Face 3
        9, 10, 11,      //Face 4
        12, 13, 14,     //Face 5
        15, 16, 17,     //Face 6
        18, 19, 20,     //Face 7
        21, 22, 23      //Face 8
    ];

    // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
    // Uint16Array: Array of 16-bit unsigned integers.
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(scutoidIndices), gl.STATIC_DRAW);
    
    var octa = {
            buffer:vertexBuffer2, colorBuffer:colorBuffer, indices:scutoidIndexBuffer,
            vertSize:3, nVerts:24, colorSize:4, nColors: 24, nIndices:24,
            primtype:gl.TRIANGLES, modelViewMatrix: mat4.create(), currentTime : Date.now()};

    mat4.translate(octa.modelViewMatrix, octa.modelViewMatrix, translation);

    var timerun = 0;
    var up = true;

    octa.update = function()
    {
        var now = Date.now();
        var deltat = now - this.currentTime;
        this.currentTime = now;
        var fract = deltat / duration;
        var angle = Math.PI * 2 * fract;

        //Variable "up" determines the direction the triangle will move each frame. 
        //It is inverted every time the time counter reaches ~4.3 seconds, and the counter is reset
        timerun += deltat;
        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);

        if(up)
        {
            mat4.translate(this.modelViewMatrix, this.modelViewMatrix, translationAxis);
        }

        else
        {
            mat4.translate(this.modelViewMatrix, this.modelViewMatrix, altTranslation);
        }
        
        if(timerun >= 4300)
        {
            up = !up;
            timerun = 0;
        }
        console.log(timerun);
        console.log(up);
    };
    
    return octa;
}

function createScutoid(gl, translation, rotationAxis)
{    
    // Vertex Data
    var vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);


    var v1 = [-0.7, 1.5, 1.0];
    var v2 = [-1.5,  1.5,  0.0];
    var v3 = [-0.7,  1.5, -1.2];
    var v4 = [0.7,  1.5,  1.0];
    var v5 = [1.5,  1.5,  0.0];
    var v6 = [0.7,  1.5, -1.2];
    var v7 = [0.0, -1.5,  1.0];
    var v8 = [-0.9, -1.5,  0.2];
    var v9 = [0.9, -1.5,  0.2];
    var v10 = [0.6, -1.5, -1.0];
    var v11 = [-0.6, -1.5, -1.0];
    var v12 = [0.0,  0.0,  1.4];

    var verts = [
       // Top face
        ...v1, ...v2, ...v3, ...v4, ...v5, ...v6, 

       // Bottom face
        ...v7, ...v8, ...v9, ...v10, ...v11,

       // Rectangle face 1
        ...v6, ...v3, ...v11, ...v10, 

       // Rectangle face 2
        ...v2, ...v3, ...v8, ...v11,

       // Rectangle face 3
        ...v5, ...v6, ...v9, ...v10,

       // Triangle face DONE
        ...v1, ...v4, ...v12, 

       // Weird face 1
        ...v2, ...v1, ...v12, ...v8, ...v7,

       // Weird face 2
        ...v12, ...v7, ...v4, ...v5, ...v9, 
       ];
       
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    // Color data
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    var faceColors = [
        [1.0, 0.0, 0.0, 1.0], // color 1
        [0.0, 1.0, 0.0, 1.0], // color 2
        [0.0, 1.0, 1.0, 1.0], // color 3
        [0.8, 0.5, 0.0, 1.0], // color 4 
        [1.0, 1.0, 0.0, 1.0], // color 5
        [1.0, 0.0, 1.0, 1.0], // color 6
        [0.1, 0.3, 0.6, 1.0], // color 7
        [0.4, 0.6, 0.2, 1.0], // color 8
    ];

    // Each vertex must have the color information, that is why the same color is concatenated 4 times, one for each vertex of the scutoid's face.
    var vertexColors = [];

    // For loop that assigns color to each vertex. Uses an array that has the number of vertices in each face.
    var vertices = [6, 5, 4, 4, 4, 3, 5, 5]


    var j = 0;
    for (const color of faceColors)
    {
        for (var k=0; k < vertices[j]; k++)
        {
            vertexColors = vertexColors.concat(color);
        }
        j++
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

    // Index data (defines the triangles to be drawn).
    var scutoidIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, scutoidIndexBuffer);
    var scutoidIndices = [
        0, 1, 2,      0, 2, 3,      3, 2, 5,      3, 4, 5,    // Top face
        6, 7, 10,     6, 8, 9,      6, 9, 10,                 // Bottom face
        11, 12, 14,   12, 13, 14,                             // Rect 1 face
        15, 16, 18,   15, 17, 18,                             // Rect 2 face
        19, 20, 21,   20, 21, 22,                             // Rect 3 face
        23, 24, 25,                                           // Triangle face
        26, 27, 29,   27, 28, 29,   28, 29, 30,               // Weird 1 face
        33, 34, 35,   31, 33, 35,   31, 32, 35                // Weird 2 face
    ];

    // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
    // Uint16Array: Array of 16-bit unsigned integers.
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(scutoidIndices), gl.STATIC_DRAW);
    
    var scutoid = {
            buffer:vertexBuffer, colorBuffer:colorBuffer, indices:scutoidIndexBuffer,
            vertSize:3, nVerts:36, colorSize:4, nColors: 36, nIndices:60,
            primtype:gl.TRIANGLES, modelViewMatrix: mat4.create(), currentTime : Date.now()};

    mat4.translate(scutoid.modelViewMatrix, scutoid.modelViewMatrix, translation);

    scutoid.update = function()
    {
        var now = Date.now();
        var deltat = now - this.currentTime;
        this.currentTime = now;
        var fract = deltat / duration;
        var angle = Math.PI * 2 * fract;
        var up = false;
        // Rotates a mat4 by the given angle
        // mat4 out the receiving matrix
        // mat4 a the matrix to rotate
        // Number rad the angle to rotate the matrix by
        // vec3 axis the axis to rotate around
        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);
    };
    
    return scutoid;
}

function createPyramid(gl, translation, rotationAxis)
{    
    // Vertex Data
    var vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    

    var v1 = [0.0, -1.5, -1.0];
    var v2 = [-.95, -1.5, -.31];
    var v3 = [-.59, -1.5, .81];
    var v4 = [.59, -1.5, .81];
    var v5 = [.95, -1.5, -.31];
    var v6 = [0.0, 1.0, 0.0];

    var verts = [
       //Pentagon base
       ...v1, ...v2, ...v3, ...v4, ...v5,

       //tri face 1
       ...v1, ...v2, ...v6,

       //tri face 2
       ...v2, ...v3, ...v6,

       //tri face 3
       ...v3, ...v4, ...v6,
       //tri face 4
       ...v4, ...v5, ...v6,

       //tri face 5
       ...v5, ...v1, ...v6,
       ];
       
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    // Color data
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    var faceColors = [
        [1.0, 0.0, 0.0, 1.0], // color 1
        [0.0, 1.0, 0.0, 1.0], // color 2
        [0.0, 0.0, 1.0, 1.0], // color 3
        [0.0, 1.0, 1.0, 1.0], // color 4 
        [1.0, 1.0, 0.0, 1.0], // color 5
        [1.0, 0.0, 1.0, 1.0], // color 6
    ];

    var vertexColors = [];

    //for loop that assigns color to each vertex. Uses an array that has the number of vertices in each face.
    var vertices = [5, 3, 3, 3, 3, 3]

    var j = 0;
    for (const color of faceColors)
    {
        for (var k=0; k < vertices[j]; k++)
        {
            vertexColors = vertexColors.concat(color);
        }
        j++
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

    // Index data (defines the triangles to be drawn).
    var scutoidIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, scutoidIndexBuffer);
    var scutoidIndices = [
        0, 1, 2,    0, 2, 3,    0, 3, 4,    //pengaton base
        5, 6, 7,                            //tri face 1
        8, 9, 10,                           //tri face 2
        11, 12, 13,                         //tri face 3
        14, 15, 16,                         //tri face 4
        17, 18, 19                          //tri face 5
    ];

    // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
    // Uint16Array: Array of 16-bit unsigned integers.
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(scutoidIndices), gl.STATIC_DRAW);
    
    var pyramid = {
            buffer:vertexBuffer, colorBuffer:colorBuffer, indices:scutoidIndexBuffer,
            vertSize:3, nVerts:20, colorSize:4, nColors: 20, nIndices:24,
            primtype:gl.TRIANGLES, modelViewMatrix: mat4.create(), currentTime : Date.now()};

    mat4.translate(pyramid.modelViewMatrix, pyramid.modelViewMatrix, translation);

    
    pyramid.update = function()
    {
        var now = Date.now();
        var deltat = now - this.currentTime;
        this.currentTime = now;
        var fract = deltat / duration;
        var angle = Math.PI * 2 * fract;
        var up = false;
        // Rotates a mat4 by the given angle
        // mat4 out the receiving matrix
        // mat4 a the matrix to rotate
        // Number rad the angle to rotate the matrix by
        // vec3 axis the axis to rotate around
        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);
    };
    
    return pyramid;
}

function createShader(gl, str, type)
{
    var shader;
    if (type == "fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == "vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShader(gl)
{
    // load and compile the fragment and vertex shader
    var fragmentShader = createShader(gl, fragmentShaderSource, "fragment");
    var vertexShader = createShader(gl, vertexShaderSource, "vertex");

    // link them together into a new program
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // get pointers to the shader params
    shaderVertexPositionAttribute = gl.getAttribLocation(shaderProgram, "vertexPos");
    gl.enableVertexAttribArray(shaderVertexPositionAttribute);

    shaderVertexColorAttribute = gl.getAttribLocation(shaderProgram, "vertexColor");
    gl.enableVertexAttribArray(shaderVertexColorAttribute);
    
    shaderProjectionMatrixUniform = gl.getUniformLocation(shaderProgram, "projectionMatrix");
    shaderModelViewMatrixUniform = gl.getUniformLocation(shaderProgram, "modelViewMatrix");

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
}

function draw(gl, objs) 
{
    // clear the background (with black)
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT  | gl.DEPTH_BUFFER_BIT);

    // set the shader to use
    gl.useProgram(shaderProgram);

    for(i = 0; i<objs.length; i++)
    {
        obj = objs[i];
        // connect up the shader parameters: vertex position, color and projection/model matrices
        // set up the buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.buffer);
        gl.vertexAttribPointer(shaderVertexPositionAttribute, obj.vertSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
        gl.vertexAttribPointer(shaderVertexColorAttribute, obj.colorSize, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indices);

        gl.uniformMatrix4fv(shaderProjectionMatrixUniform, false, projectionMatrix);
        gl.uniformMatrix4fv(shaderModelViewMatrixUniform, false, obj.modelViewMatrix);

        // Draw the object's primitives using indexed buffer information.
        // void gl.drawElements(mode, count, type, offset);
        // mode: A GLenum specifying the type primitive to render.
        // count: A GLsizei specifying the number of elements to be rendered.
        // type: A GLenum specifying the type of the values in the element array buffer.
        // offset: A GLintptr specifying an offset in the element array buffer.
        gl.drawElements(obj.primtype, obj.nIndices, gl.UNSIGNED_SHORT, 0);
    }
}

function run(gl, objs) 
{
    // The window.requestAnimationFrame() method tells the browser that you wish to perform an animation and requests that the browser call a specified function to update an animation before the next repaint. The method takes a callback as an argument to be invoked before the repaint.
    requestAnimationFrame(function() { run(gl, objs); });
    draw(gl, objs);

    for(i = 0; i<objs.length; i++)
        objs[i].update();
}
