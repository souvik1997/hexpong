var scene, camera, renderer;
var geometry, material, mesh;
var SKYBOX_MAX_RADIUS = 3000;
var MAX_BOUND = 2000;

var objects = [new Ball(new THREE.Vector3(0,0,0), new THREE.Vector3(30,29,0), 0xff33bb),new Ball(new THREE.Vector3(-2,0,0), new THREE.Vector3(10,12,3), 0xa351bf)]

$(document).ready(function()
{
	init();
	createSkyBox();
	for (var obj in objects)
		scene.add(objects[obj].mesh);
	/*scene.add(new THREE.Mesh(
		new THREE.BoxGeometry(MAX_BOUND*2,MAX_BOUND*2,MAX_BOUND*2),
		new THREE.MeshPhongMaterial({wireframe:true})));*/
	animate();
	console.log(objects[0])
});


function Ball(position,velocity,color){
	var RADIUS = 50;
	this.color = color;
	this.position = position;
	this.velocity = velocity;
	this.sphere = function(){
		return THREE.Sphere(position,RADIUS)
	}
	this.mesh = new THREE.Mesh(
			new THREE.SphereGeometry(RADIUS),
			new THREE.MeshPhongMaterial({color:this.color}));
	this.update = function(){
		position.add(velocity);
		if (Math.abs(position.x) > MAX_BOUND)
		{
			position.x = position.x > 0 ? MAX_BOUND : -MAX_BOUND;
			velocity.x *= -1;
		}
		if (Math.abs(position.y) > MAX_BOUND)
		{
			position.y = position.y > 0 ? MAX_BOUND : -MAX_BOUND;
			velocity.y *= -1;
		}
		if (Math.abs(position.z) > MAX_BOUND)
		{
			position.z = position.z > 0 ? MAX_BOUND : -MAX_BOUND;
			velocity.z *= -1;
		}
		this.mesh.translateX(position.x-this.mesh.position.x);
		this.mesh.translateY(position.y-this.mesh.position.y);
		this.mesh.translateZ(position.z-this.mesh.position.z);
	}
}
function init() {

	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.z = 1000;
	var light = new THREE.PointLight( 0xffffff, 1, 3000 );
	light.position.set( 0, 0, 0 );
	scene.add(light);
	scene.add(new THREE.AmbientLight( 0x323232 ));
	renderer = new THREE.WebGLRenderer();
	renderer.autoClear = true;
	renderer.setSize( window.innerWidth, window.innerHeight );
	controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.maxDistance = SKYBOX_MAX_RADIUS;
	controls.noPan = true;
	$("body").append(renderer.domElement);

}
function createSkyBox() {
	var geometry = new THREE.SphereGeometry(SKYBOX_MAX_RADIUS,10,10);
	var uniforms = {
		texture: { type: 't', value: THREE.ImageUtils.loadTexture('assets/skybox.jpg') }
	};

	var material = new THREE.ShaderMaterial( {
		uniforms:       uniforms,
		vertexShader:   document.getElementById('sky-vertex').textContent,
		fragmentShader: document.getElementById('sky-fragment').textContent
	});

	skyBox = new THREE.Mesh(geometry, material);
	skyBox.scale.set(-1, 1, 1);
	skyBox.eulerOrder = 'XZY';
	skyBox.renderDepth = 1000.0;
	scene.add(skyBox);
}
function animate() {

	requestAnimationFrame( animate );
	for (var obj in objects)
		objects[obj].update()
	
	renderer.render( scene, camera );

}