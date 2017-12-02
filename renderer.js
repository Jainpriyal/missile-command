var renderer = new THREE.WebGLRenderer({canvas: document.getElementById('myCanvas'), antialias: true});
renderer.setClearColor(0x00ff00);
renderer.shadowMapEnabled = true;
renderer.shadowMapType=THREE.PCFSoftShadowMap;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

var camera = new THREE.PerspectiveCamera(35, window.innerWidth/window.innerHeight, 0.1, 3000);

var scene = new THREE.Scene();

renderer.render(scene, camera);
