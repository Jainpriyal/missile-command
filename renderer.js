var renderer = new THREE.WebGLRenderer({canvas: document.getElementById('myCanvas'), antialias: true});
renderer.setClearColor(0x00ff00);
renderer.shadowMapEnabled = true;
renderer.shadowMapType=THREE.PCFSoftShadowMap;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

var camera = new THREE.PerspectiveCamera(35, window.innerWidth/window.innerHeight, 0.1, 3000);
//default camera position
//camera.position.set(0,0,0);

var scene = new THREE.Scene();

//add lighting to the scene
var light = new THREE.AmbientLight(0xffffff, 0.5); //light color and intensity
scene.add(light);

var pointlight = new THREE.PointLight(0xffffff, 0.5); //point light
scene.add(pointlight);


//add geometry to scene
var geometry = new THREE.CubeGeometry(100, 100, 100); //x,y,z axis
var material = new THREE.MeshLambertMaterial({color: 0xFFFFE2}); //add material that repond to light
//thats why use mabert material
var mesh = new THREE.Mesh(geometry, material);
//position of scene
mesh.position.set(0,-247,-1000);
scene.add(mesh);

var texture = new THREE.Texture(); 
var loader = new THREE.TextureLoader();
loader.load('textures/city1.jpg', function ( texture ) {
  var geometry = new THREE.SphereGeometry(1000, 20, 20);
  var material = new THREE.MeshBasicMaterial({map: texture, overdraw: 0.5});
  var mesh2 = new THREE.Mesh(geometry, material);
  scene.add(mesh2);
});

var geometry1 = new THREE.CubeGeometry(100, 100, 100); //x,y,z axis
var material1 = new THREE.MeshBasicMaterial
({ambient: Math.random() * 0xffffff, map:texture, needsUpdate: true}); //add material that repond to light
//thats why use mabert material
var mesh1 = new THREE.Mesh(geometry1, material1);
//position of scene
mesh1.position.set(-300,-247,-1000);

scene.add(mesh1);

renderer.render(scene, camera);
