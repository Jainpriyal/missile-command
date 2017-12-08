class SkyMissile {

	constructor(gl){
		this.gl = gl;
		this.center = vec3.fromValues(0,0,0);
		this.on = false;

		this.translation = vec3.fromValues(0,0,0);
		this.xAxis = vec3.fromValues(1,0,0);
		this.yAxis = vec3.fromValues(0,1,0);

		this.material = {"ambient": [0.7,0.7,0.7], "diffuse": [0.6,0.6,0.4], "specular": [0.3,0.3,0.3], "n":17, "alpha": 0.6, "texture": "grass.jpg"};
		this.vertices = [[-1,1,0.5], [1,1,0.5], [1,-0.8,0.5], [-1,-0.8,0.5], [1,1,-0.5], [-1,1,-0.5], [1,-0.8,-0.5], [-1,-0.8,-0.5]];
		//this.vertices = [[-1,1,0.5], [1,1,0.5], [1,0,0.5], [-1,0,0.5], [1,1,-0.5], [-1,1,-0.5], [1,0,-0.5], [-1,0,-0.5]];

		//this.vertices = [[0,1,0.5], [1,1,0.5], [1,-1,0.5], [0,-1,0.5], [1,1,-0.5], [0,1,-0.5], [1,-1,-0.5], [0,-1,-0.5]];
		this.normals =  [[0, 0, -1],[0, 0, -1],[0, 0, -1],[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1],];
		//this.uvs = [[0,1], [1,1], [1,0], [0,0], [0,1], [0.8,0.9], [0,0], [0.8, 0]];
		this.uvs = [[0,1], [1,1], [1,0], [0,0], [0,1], [1,1], [0,0], [1, 0]];

		this.triangles = [[0,1,2],[0,2,3], 
						  [7,6,2], [7,2,3], 
						  [5,4,6], [5,6,7], 
						  [5,4,1],[5,1,0],
						  [5,0,3], [5,3,7],
						  [4,1,2],[4,1,6]];
		this.modelMatrix = mat4.create();
	}

	loadTexture()
	{
	    this.triangleTexture = this.gl.createTexture();
	    this.triangleTexture.image = new Image();
	    this.triangleTexture.image.crossOrigin = "Anonymous";
	    var self=this;
	    this.triangleTexture.image.onload = function()
	    {
	        self.handleTexture();
	    }
	    //triangleTexture[triangleSet].image.src = "https://ncsucgclass.github.io/prog3/" + textureLocation;
	    this.triangleTexture.image.src = "https://jainpriyal.github.io/textures/sky_missile4.jpg";
	}

	//function to handle loaded texture
	handleTexture()
	{
	    this.gl.bindTexture(this.gl.TEXTURE_2D, this.triangleTexture);
	    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
	    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.triangleTexture.image);        
	    //max filter
	    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
	    //min filter
	    if (this.isPowerOf2(this.triangleTexture.image.width) && this.isPowerOf2(this.triangleTexture.image.height)) {
	        this.gl.generateMipmap(this.gl.TEXTURE_2D);
	        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
	    } else {
	        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
	        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
	        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
	    }
	    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
	}    

	isPowerOf2(value) {
    	return (value & (value - 1)) == 0;
	}

load_missile(src, dest){
	this.src = src;
	this.dest = dest;
	this.scale_x = (this.src[0] - this.dest[0])/20;
	this.scale_y = (this.src[1] - this.dest[1])/20;

  	var vtxToAdd; // vtx coords to add to the coord array
  	var normToAdd; // vtx normal to add to the coord array
  	var uvToAdd; // uv coords to add to the uv arry
  	var triToAdd; // tri indices to add to the index array
	var whichSetVert;
	var whichSetTri;

	var glVertices = []; // flat coord list for webgl
	var glNormals = []; // flat normal list for webgl
	var glUVs = []; //UVs for webgls 
	var glTriangles = []; // flat index list for webgl  

  	this.vertexBuffers = this.gl.createBuffer();
  	this.normalBuffers = this.gl.createBuffer();
  	this.textureBuffers = this.gl.createBuffer();
  	this.triangleBuffers = this.gl.createBuffer(); // init empty triangle index buffer
  	this.triSetSizes =0;

  	//scale the sky missile
  	var temp = mat4.create();
  	mat4.multiply(this.modelMatrix,mat4.fromScaling(temp,vec3.fromValues(0.02,0.035,0.02)),this.modelMatrix); // S(1.2) * T(-ctr)

  	//translate city
  	var translation = vec3.create();
  	this.src[0] = this.src[0] - this.scale_x;
   	this.src[1] = this.src[1] - this.scale_y;
   	vec3.set (translation, this.src[0], this.src[1], 4);
	mat4.translate (this.modelMatrix, this.modelMatrix, translation);

    var numVerts = this.vertices.length; 
  	for (whichSetVert=0; whichSetVert<numVerts; whichSetVert++)
  	{
  	vtxToAdd = this.vertices[whichSetVert]; // get vertex to add
  	normToAdd = this.normals[whichSetVert]; // get normal to add
    uvToAdd = this.uvs[whichSetVert];

    glVertices.push(vtxToAdd[0],vtxToAdd[1],vtxToAdd[2]); // put coords in set coord list
    glNormals.push(normToAdd[0],normToAdd[1],normToAdd[2]); // put normal in set coord list
    glUVs.push(uvToAdd[0], uvToAdd[1]);
    } // end for vertices in 

    this.loadTexture();

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vertexBuffers); // activate that buffer
    this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array(glVertices),this.gl.STATIC_DRAW); // data in

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffers); // activate that buffer
    this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array(glNormals),this.gl.STATIC_DRAW); // data in

    //send texture coords to webgl
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureBuffers);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(glUVs), this.gl.STATIC_DRAW);
    
    this.triSetSizes = this.triangles.length; // number of tris in this set
 //   console.log("************** trisetsized: " + this.triSetSizes);

    for (whichSetTri=0; whichSetTri<this.triSetSizes; whichSetTri++) {
		triToAdd = this.triangles[whichSetTri]; // get tri to add
		glTriangles.push(triToAdd[0],triToAdd[1],triToAdd[2]); // put indices in set list
	} // end for triangles in set

	// send the triangle indices to webGl
	this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffers); // activate that buffer
	this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(glTriangles), this.gl.STATIC_DRAW); // data in
   } // end for each triangle set 

   //add destination also
   animate_missile()
   {
   		var self = this;
   		this.modelMatrix = mat4.create();
   		var temp = mat4.create();
  		mat4.multiply(this.modelMatrix,mat4.fromScaling(temp,vec3.fromValues(0.02,0.035,0.02)),this.modelMatrix); // S(1.2) * T(-ctr)

   		this.src[0] = this.src[0] - this.scale_x;
   		this.src[1] = this.src[1] - this.scale_y;

   		var translation = vec3.create();
   		vec3.set (translation, this.src[0], this.src[1], 4);

   		mat4.translate(this.modelMatrix, this.modelMatrix, translation);
   		if(this.src[0] == this.dest[0] && this.src[1] == this.dest[1])
   		{
   			return;
   		}
   		else{
   			setTimeout(function(){self.animate_missile();}, 150);
   		}
   }


}

