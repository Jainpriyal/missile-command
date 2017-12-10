class DefendMissile {

	constructor(gl){
		this.gl = gl;
		this.center = vec3.fromValues(0,0,0);
		this.on = false;
		this.visible = true;

		this.translation = vec3.fromValues(0,0,0);
		this.xAxis = vec3.fromValues(1,0,0);
		this.yAxis = vec3.fromValues(0,1,0);

		this.material = {"ambient": [0.7,0.7,0.7], "diffuse": [0.6,0.6,0.4], "specular": [0.3,0.3,0.3], "n":17, "alpha": 0.6, "texture": "grass.jpg"};
		this.vertices = [[-0.5,0.5,0.5], [0.5,0.5,0.5], [0.5,-0.5,0.5], [-0.5,-0.5,0.5], [0.5,0.5,-0.5], [-0.5,0.5,-0.5], [0.5,-0.5,-0.5], [-0.5,-0.5,-0.5]];
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
		this.trans = 4;
		this.count =0;
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
	    this.triangleTexture.image.src = "https://jainpriyal.github.io/textures/defend_missile.jpg";
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

	load_missile(x, y, z){
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

	  	//load missile
	  	this.x = x;
		this.y = y;
		this.z = z;

	  	//scale the city
	  	var temp = mat4.create();
	  	this.modelMatrix=mat4.create();
	  	mat4.multiply(this.modelMatrix,mat4.fromScaling(temp,vec3.fromValues(0.2,0.4,0.2)),this.modelMatrix); // S(1.2) * T(-ctr)

	  	//translate city
	  	var temp1 = mat4.create();
	  	var translation = vec3.create();
	  	mat4.multiply(this.modelMatrix, mat4.fromTranslation(temp1, vec3.fromValues(x,y,z)), this.modelMatrix);
		//vec3.set (translation, -7, 0.8, 4);
		//vec3.set (translation, x, y, z);
		//mat4.translate (this.modelMatrix, this.modelMatrix, translation);

	    var numVerts = this.vertices.length; 
	  	for (whichSetVert=0; whichSetVert<numVerts; whichSetVert++)
	  	{
	  	vtxToAdd = this.vertices[whichSetVert]; // get vertex to add
	  	normToAdd = this.normals[whichSetVert]; // get normal to add
	    uvToAdd = this.uvs[whichSetVert];

	    glVertices.push(vtxToAdd[0],vtxToAdd[1],vtxToAdd[2]); // put coords in set coord list
	    glNormals.push(normToAdd[0],normToAdd[1],normToAdd[2]); // put normal in set coord list
	    glUVs.push(uvToAdd[0], uvToAdd[1]);

	    //vec3.max(maxCorner,maxCorner,vtxToAdd); // update world bounding box corner maxima
	    //vec3.min(minCorner,minCorner,vtxToAdd); // update world bounding box corner minima
	    //vec3.add(inputTriangles[whichSet].center,inputTriangles[whichSet].center,vtxToAdd); // add to ctr sum
	    } // end for vertices in 

	    //vec3.scale(inputTriangles[whichSet].center,inputTriangles[whichSet].center,1/numVerts); // avg ctr sum

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
   	animate_defend_missile(add_x, add_y, dest, attack_missile_list, explode_list)
   	{
   		//console.log("********** inside animate missile");
   		//animate missile only destroy city or missile launcher
   		this.modelMatrix = mat4.create();
   		var temp = mat4.create();
  		mat4.multiply(this.modelMatrix,mat4.fromScaling(temp,vec3.fromValues(0.1,0.15,0.08)),this.modelMatrix); // S(1.2) * T(-ctr)

  		this.x = this.x - add_x;
  		this.y = this.y - add_y;

		var missileAudio = document.createElement('audio');
	    var audio_source = document.createElement('source');
	    //audio_source.src = "/Users/pjain12/Downloads/squash.wav";
	    audio_source.src = "https://jainpriyal.github.io/sounds/explode.wav";
	    missileAudio.appendChild(audio_source);

   		var translation = vec3.create();

   		//vec3.set (translation, src[0], src[1], 4);
   		vec3.set (translation, this.x, this.y, this.z);

   		//translate city
	  	var temp1 = mat4.create();
	  	var translation = vec3.create();
	  	mat4.multiply(this.modelMatrix, mat4.fromTranslation(temp1, vec3.fromValues(this.x,this.y,0)), this.modelMatrix);

   		var self = this;

	   	if(this.x == dest[0] && this.y == dest[1])
	   	{
	   		for(var attack_missile=0; attack_missile<attack_missile_list.length; attack_missile++)
   			{
   				var val_x = this.x - attack_missile_list[attack_missile].x;
   				var val_y = this.y - attack_missile_list[attack_missile].y;
   				var distance = Math.sqrt(val_x*val_x + val_y*val_y);
   				if(distance<0.5)
   				{
   					var explode = new Explosion(this.gl);
   					explode.load_explosion(this.x, this.y, 0);
					explode_list.push(explode);
					explode.animate_explosion();
   					attack_missile_list[attack_missile].visible = false;
   					this.visible = false;
   					missileAudio.play();
   					return;
   				}
   			}
   			this.visible = false;
	   	}
	   	else{
   			setTimeout(function(){self.animate_defend_missile(add_x, add_y, dest, attack_missile_list, explode_list);}, 40);
	   	}
   }

}

