var scene, camera, renderer;
var geometry, material, mesh;
var SKYBOX_MAX_RADIUS = 10000;
var MAX_BOUND = 1000;

var objects = [new Ball(new THREE.Vector3(0,0,0), new THREE.Vector3(30,29,10), 0xff33bb),new Ball(new THREE.Vector3(-2,0,0), new THREE.Vector3(10,12,3), 0xa351bf)]
var players = [new Player(5,0xccaacc)];
$(document).ready(function()
{
	init();
	createSkyBox();
	for (var obj in objects)
		scene.add(objects[obj].mesh);
	for (var player in players)
		scene.add(players[player].mesh);
	scene.add(new THREE.Mesh(
		new THREE.BoxGeometry(MAX_BOUND*2,MAX_BOUND*2,MAX_BOUND*2),
		new THREE.MeshPhongMaterial({color:0x0A0A0A, transparent: true, side: THREE.DoubleSide, opacity: 0.2})));
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
		this.position.add(velocity);
		if (Math.abs(this.position.x) > MAX_BOUND)
		{
			this.position.x = this.position.x > 0 ? MAX_BOUND : -MAX_BOUND;
			this.velocity.x *= -1;
		}
		if (Math.abs(this.position.y) > MAX_BOUND)
		{
			this.position.y = this.position.y > 0 ? MAX_BOUND : -MAX_BOUND;
			this.velocity.y *= -1;
		}
		if (Math.abs(this.position.z) > MAX_BOUND)
		{
			this.position.z = this.position.z > 0 ? MAX_BOUND : -MAX_BOUND;
			this.velocity.z *= -1;
		}
		this.mesh.translateX(position.x-this.mesh.position.x);
		this.mesh.translateY(position.y-this.mesh.position.y);
		this.mesh.translateZ(position.z-this.mesh.position.z);
	}
}

function Player(num,color){
	var SIZE = 300;
	this.color = color;
	this.position = new THREE.Vector2(0,0);
	this.mesh = new THREE.Mesh(
		new THREE.PlaneGeometry(SIZE,SIZE),
		new THREE.MeshPhongMaterial({color:this.color, side:THREE.DoubleSide}))
	/* Positions:
		0: -x
		1: +x
		2: -y
		3: +y
		4: -z
		5: +z
	*/
	switch (num){
		case 0:
			this.mesh.rotation.y = -Math.PI/2;
			this.mesh.translateZ(MAX_BOUND);
			break;
		case 1: 
			this.mesh.rotation.y = Math.PI/2;
			this.mesh.translateZ(MAX_BOUND);
			break;
		case 2:
			this.mesh.rotation.x = Math.PI/2;
			this.mesh.translateZ(MAX_BOUND);
			break;
		case 3: 
			this.mesh.rotation.x = -Math.PI/2;
			this.mesh.translateZ(MAX_BOUND);
			break;
		case 4:
			this.mesh.rotation.z = Math.PI/2;
			this.mesh.translateZ(MAX_BOUND);
			break;
		case 5: 
			this.mesh.rotation.z = -Math.PI/2;
			this.mesh.translateZ(-MAX_BOUND);
			break;
	}
	this.moveY = function(step){
		
		if (this.position.y + step > MAX_BOUND/2 + SIZE)
		{
			step = MAX_BOUND/2 + SIZE - this.position.y;
			this.position.y = MAX_BOUND/2 + SIZE;
		}
		else if (this.position.y + step < -MAX_BOUND/2 - SIZE)
		{
			step = -MAX_BOUND/2 - SIZE - this.position.y;
			this.position.y = -MAX_BOUND/2 - SIZE;
		}
		else 
		{
			this.position.y += step;
		}

		switch (num){
			case 0:
				this.mesh.translateY(step);
				break;
			case 1:
				this.mesh.translateY(step);
				break;
			case 2:
				this.mesh.translateY(step);
				break;
			case 3:
				this.mesh.translateX(step);
				break;
			case 4:
				this.mesh.translateX(step);
				break;
			case 5:
				this.mesh.translateX(-step);
				break;
		}		
	}
	this.moveX = function(step){
		if (this.position.x + step > MAX_BOUND/2 + SIZE)
		{
			step = MAX_BOUND/2 + SIZE - this.position.x;
			this.position.x = MAX_BOUND/2 + SIZE;
		}
		else if (this.position.x + step < -MAX_BOUND/2 - SIZE)
		{
			step = -MAX_BOUND/2 - SIZE - this.position.x;
			this.position.x = -MAX_BOUND/2 - SIZE;
		}
		else {
			this.position.x += step;
		}
		switch (num){
			case 0:
				this.mesh.translateX(step);
				break;
			case 1:
				this.mesh.translateX(step);
				break;
			case 2:
				this.mesh.translateX(step);
				break;
			case 3:
				this.mesh.translateY(-step);
				break;
			case 4:
				this.mesh.translateY(-step);
				break;
			case 5:
				this.mesh.translateY(-step);
				break;
		}		
	}

}
function init() {

	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 20000 );
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
	controls.dollyOut(900);
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
	controls.update();
	renderer.render( scene, camera );

}