var scene, camera, renderer;
var geometry, material, mesh;
var SKYBOX_MAX_RADIUS = 20000;
var MAX_BOUND = 2000;
var PRINT_LOGS = false;

var ROTATION_STEP = 0.05;
var rotation_intermediate = undefined; //used for smooth camera rotation

var objects = [new Ball(new THREE.Vector3(0,0,0), new THREE.Vector3(10,-6,4), get_random_color())];
var players = [new Player(0,get_random_color(),false),new Player(1,get_random_color()),new Player(2,get_random_color()),new Player(3,get_random_color()),new Player(4,get_random_color()),new Player(5,get_random_color())];

var current_focused_player = 0;
var key_controls = {left:false, right:false, up:false, down:false, step:30}

$(document).ready(function()
{
	init();
	bind_keys();
	createSkyBox();
	for (var obj in objects)
		scene.add(objects[obj].mesh);
	for (var player in players)
		if (players[player].enabled)
			scene.add(players[player].mesh);
	bounding_cube = new THREE.BoxHelper(new THREE.Mesh(
			new THREE.BoxGeometry(MAX_BOUND*2,MAX_BOUND*2,MAX_BOUND*2,2,2),
			new THREE.LineBasicMaterial()));
	bounding_cube.material.color.set(0x321087);
	scene.add(bounding_cube);

	animate();
	log(objects[0])
});

function get_random_color()
{
	return Math.round(Math.random()*0xffffff);
}

function log()
{
	if (PRINT_LOGS)
		for (var i = 0; i < arguments.length; i++)
			console.log(arguments[i]);
}

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
		if (this.position.x >= MAX_BOUND)
		{
			this.position.x = MAX_BOUND;			
			this.velocity.x *= -1;
			if (players[1].enabled && !checkCollisions(this.mesh,[players[1].mesh]))
				log("player 1 missed");

		}
		if (this.position.x <= -MAX_BOUND)
		{
			this.position.x = -MAX_BOUND;
			this.velocity.x *= -1;
			if (players[0].enabled && !checkCollisions(this.mesh,[players[0].mesh]))
				log("player 0 missed");
		}
		if (this.position.y >= MAX_BOUND)
		{
			this.position.y = MAX_BOUND;
			this.velocity.y *= -1;
			if (players[3].enabled && !checkCollisions(this.mesh,[players[3].mesh]))
				log("player 3 missed");;
		}
		if (this.position.y <= -MAX_BOUND)
		{
			this.position.y = -MAX_BOUND;
			this.velocity.y *= -1;
			if (players[2].enabled && !checkCollisions(this.mesh,[players[2].mesh]))
				log("player 2 missed");
		}
		if (this.position.z >= MAX_BOUND)
		{
			this.position.z = MAX_BOUND;
			this.velocity.z *= -1;
			if (players[4].enabled && !checkCollisions(this.mesh,[players[4].mesh]))
				log("player 4 missed");
		}
		if (this.position.z <= -MAX_BOUND)
		{
			this.position.z = -MAX_BOUND;
			this.velocity.z *= -1;
			if (players[5].enabled && !checkCollisions(this.mesh,[players[5].mesh]))
				log("player 5 missed");
		}
		this.mesh.translateX(position.x-this.mesh.position.x);
		this.mesh.translateY(position.y-this.mesh.position.y);
		this.mesh.translateZ(position.z-this.mesh.position.z);
	}
}

function Player(num,color,enabled){
	var SIZE = 800;
	this.color = color;
	this.position = new THREE.Vector2(0,0);
	if (enabled === undefined)
	{
		this.enabled = true;
	}
	else
	{
		this.enabled = enabled;
	}
	this.mesh = new THREE.Mesh(
		new THREE.BoxGeometry(SIZE,SIZE,SIZE/8),
		new THREE.MeshBasicMaterial({color:this.color, side:THREE.DoubleSide, transparent:true, opacity:0.9}))
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
		
		if (this.position.y + step > MAX_BOUND-SIZE/2)
		{
			step = MAX_BOUND-SIZE/2 - this.position.y;
			this.position.y = MAX_BOUND-SIZE/2;
		}
		else if (this.position.y + step < -MAX_BOUND+SIZE/2)
		{
			step = -MAX_BOUND+SIZE/2 - this.position.y;
			this.position.y = -MAX_BOUND+SIZE/2;
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
				this.mesh.translateY(step);
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
		if (this.position.x + step > MAX_BOUND-SIZE/2)
		{
			step = MAX_BOUND-SIZE/2 - this.position.x;
			this.position.x = MAX_BOUND-SIZE/2;
		}
		else if (this.position.x + step < -MAX_BOUND+SIZE/2)
		{
			step = -MAX_BOUND+SIZE/2 - this.position.x;
			this.position.x = -MAX_BOUND+SIZE/2;
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
				this.mesh.translateX(step);
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

function zoom_to(player) // player is a number
{
	target_angles = [
		[0,Math.PI/2],
		[0,Math.PI*3/2],
		[-Math.PI/2,Math.PI],
		[Math.PI/2,Math.PI],
		[0,Math.PI],
		[0,0]
	]
	rotation_intermediate = target_angles[player];
}

function bind_keys()
{
	$(document).keydown(function(e) {
		switch(e.which) {
			case 48:
				current_focused_player = 0;
				break;
			case 49:
				current_focused_player = 1;
				break;
			case 50:
				current_focused_player = 2;
				break;
			case 51:
				current_focused_player = 3;
				break;
			case 52:
				current_focused_player = 4;
				break;
			case 53:
				current_focused_player = 5;
				break;

			case 37: // left
				key_controls.left = true;
				break;
			case 38: // up
				key_controls.up = true;
				break;
			case 39: // right
				key_controls.right = true
				break;
			case 40: // down
				key_controls.down = true;
				break;
			default: return;
		}
		e.preventDefault(); 
	});
	$(document).keyup(function(e) {
		switch(e.which) {
			case 37: // left
				key_controls.left = false;
				break;
			case 38: // up
				key_controls.up = false;
				break;
			case 39: // right
				key_controls.right = false;
				break;
			case 40: // down
				key_controls.down = false;
				break;
			default: return;
		}
		e.preventDefault(); 
	});
}
function init() {

	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, SKYBOX_MAX_RADIUS*2 );
	camera.position.z = 1000;
	var central_light = new THREE.PointLight( 0xffffff, 1, SKYBOX_MAX_RADIUS );
	central_light.position.set( 0, 0, 0 );
	scene.add(central_light);

	renderer = new THREE.WebGLRenderer();
	renderer.autoClear = true;
	renderer.setSize( window.innerWidth, window.innerHeight );
	controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.maxDistance = SKYBOX_MAX_RADIUS;
	controls.noPan = true;
	controls.dollyOut(900);
	$("body").append(renderer.domElement);

}
function get_lat_long()
{
	function radius(x,y,z){ return Math.sqrt(Math.pow(x,2)+Math.pow(y,2)) }
	x=camera.getWorldPosition();
	if (x.z > 0)
	{
		longitude = Math.atan(x.x/x.z) + Math.PI;	
	}
	else if (x.x <= 0)
	{
		longitude = Math.abs(Math.atan(x.x/x.z));
	}
	else if (x.x > 0)
	{
		longitude = Math.PI*2 - Math.abs(Math.atan(x.x/x.z));
	}
	latitude = Math.atan(x.y/radius(x.x,x.z));	
	return [latitude,longitude];
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
function checkCollisions(mesh,collidableMeshList) // http://stackoverflow.com/questions/11473755/how-to-detect-collision-in-three-js
{
	for (var vertexIndex = 0; vertexIndex < mesh.geometry.vertices.length; vertexIndex++)
	{
		var localVertex = mesh.geometry.vertices[vertexIndex].clone();
		var globalVertex = localVertex.applyMatrix4(mesh.matrix);
		var directionVector = globalVertex.sub( mesh.position );

		var ray = new THREE.Raycaster( mesh.position, directionVector.clone().normalize() );
		var collisionResults = ray.intersectObjects( collidableMeshList );
		if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ) 
		{
			log("collision")
			return true;
		}
	}
	return false;
}
function animate() {

	requestAnimationFrame( animate );
	for (var obj in objects)
		objects[obj].update()
	if (key_controls.left)
		players[current_focused_player].moveX(-key_controls.step);
	if (key_controls.right)
		players[current_focused_player].moveX(key_controls.step);
	if (key_controls.up)
		players[current_focused_player].moveY(key_controls.step);
	if (key_controls.down)
		players[current_focused_player].moveY(-key_controls.step);
	if (rotation_intermediate !== undefined)
	{
		var cur_pos = get_lat_long();
		var diff_lat = rotation_intermediate[0] - cur_pos[0];
		var diff_long = 0;
		if (Math.abs(rotation_intermediate[1] - cur_pos[1]) > Math.abs(rotation_intermediate[1] - cur_pos[1] + Math.PI * 2)) //find the shortest path
			diff_long = -(rotation_intermediate[1] - cur_pos[1] - Math.PI * 2);
		else
			diff_long = rotation_intermediate[1] - cur_pos[1];
		log(diff_lat,diff_long);
		if (Math.abs(diff_lat) > 0.01)
		{
			if (Math.abs(diff_lat) < ROTATION_STEP)
				controls.rotateUp(diff_lat);
			else
				controls.rotateUp(ROTATION_STEP * Math.abs(diff_lat)/diff_lat);
		}
		if (Math.abs(diff_long) > 0.01)
		{
			if (Math.abs(diff_long) < ROTATION_STEP)
				controls.rotateLeft(-diff_long);
			else
				controls.rotateLeft(ROTATION_STEP * -Math.abs(diff_long)/diff_long);
		}
		if (Math.abs(diff_lat) < 0.01 && Math.abs(diff_long) < 0.01)
			rotation_intermediate = undefined;
	}
	controls.update();
	renderer.render( scene, camera );

}