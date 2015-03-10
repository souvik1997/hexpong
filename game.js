var scene, camera, renderer;
var geometry, material, mesh;
var SKYBOX_MAX_RADIUS = 20000;
var MAX_BOUND = 2000;
var PRINT_LOGS = false;
var ROTATION_STEP = 0.05;
var rotation_intermediate; //used for smooth camera rotation
var objects = [
	new Ball(new THREE.Vector3(0, 0, 0), new THREE.Vector3(10, -6, 4), 0xffffff),
	new Ball(new THREE.Vector3(0, 0, 0), new THREE.Vector3(2, 9, -4), 0xffffff),
	new Ball(new THREE.Vector3(0, 0, 0), new THREE.Vector3(-3, -2, -8), 0xffffff),
	new Ball(new THREE.Vector3(0, 0, 0), new THREE.Vector3(-10, -3, 1), 0xffffff),
];
var players = [
	new Player({num: 0, color: get_palette_color(0), ai: true, userControlled: false}),
	new Player({num: 1, color: get_palette_color(1), ai: true, userControlled: false}),
	new Player({num: 2, color: get_palette_color(2), ai: true, userControlled: false}),
	new Player({num: 3, color: get_palette_color(3), ai: true, userControlled: false}),
	new Player({num: 4, color: get_palette_color(4), ai: true, userControlled: false}),
	new Player({num: 5, color: get_palette_color(5), ai: true, userControlled: false})
];
var current_focused_player = 0;
var PLAYER_ACCEL_CONSTANT = 8;
var key_controls = {
	left: false,
	right: false,
	up: false,
	down: false
}
var global_audio_context = new AudioContext();
var bg_audio = new Audio();
var skybox_texture;
var sfx_miss;
var demo = false;
var controls;
$(document).ready(function()
{
	NProgress.start();
	download_all(function()
	{
		fill_score_boxes();
		setup_scene();
		bind_keys();
		createSkyBox();
		add_balls_to_scene();
		add_players_to_scene()
		add_bounding_cube();
		start_demo();
		$("#new-single-player").click(new_single_player_game);
		$(window).resize(function()
		{
			camera.aspect = window.innerWidth / window.innerHeight;
			$("#c").width(window.innerWidth);
			$("#c").height(window.innerHeight);
			renderer.setSize($("#c").width(), $("#c").height());
			console.log("resize");
		});
		animate();
	});
});

function download_all(callback)
{
	skybox_texture = THREE.ImageUtils.loadTexture('assets/images/skybox.jpg');
	urls = [
	{
		url: "assets/sounds/Eric_Skiff_-_03_-_Chibi_Ninja.mp3",
		responseType: "arraybuffer",
		exec: function(data)
		{
			log("downloaded bg sound #1");
			NProgress.inc();
			bg_audio.addSound(data, function()
			{
				bg_audio.sound.volume.gain.value = 0.5;
				bg_audio.playAllLoopFlat();
			});
		}
	},
	{
		url: "assets/sounds/BoxCat_Games_-_10_-_Epic_Song.mp3",
		responseType: "arraybuffer",
		exec: function(data)
		{
			log("downloaded bg sound #2");
			NProgress.inc();
			bg_audio.addSound(data);
		}
	},
	{
		url: "assets/sounds/Rolemusic_-_01_-_Bacterial_Love.mp3",
		responseType: "arraybuffer",
		exec: function(data)
		{
			log("downloaded bg sound #3");
			NProgress.inc();
			bg_audio.addSound(data);
		}
	},
	{
		url: "assets/sounds/beep.mp3",
		responseType: "arraybuffer",
		exec: function(data)
		{
			log("downloaded sfx sound #1");
			NProgress.inc();
			global_audio_context.decodeAudioData(data, function onSuccess(buffer)
			{
				for (obj in objects)
				{
					if (objects[obj].audio_controller === undefined) //ensure audio is created only once
						objects[obj].audio_controller = new Audio();
					objects[obj].audio_controller.buffers[0] = buffer;
				}
			}, function onFailure()
			{});
		}
	},
	{
		url: "assets/sounds/explosion.mp3",
		responseType: "arraybuffer",
		exec: function(data)
		{
			log("downloaded sfx sound #2");
			NProgress.done();
			global_audio_context.decodeAudioData(data, function onSuccess(buffer)
			{
				for (obj in objects)
				{
					if (objects[obj].audio_controller === undefined)
						objects[obj].audio_controller = new Audio();
					objects[obj].audio_controller.buffers[1] = buffer;
				}
			}, function onFailure()
			{});
		}
	}, ];
	var xhr_callback = function(e)
	{
		urls[0].exec(this.response);
		urls.shift();
		if (urls.length == 0)
		{
			callback();
		}
		else
		{
			var request = new XMLHttpRequest();
			request.open("GET", urls[0].url, true);
			request.responseType = urls[0].responseType;
			request.onload = xhr_callback;
			request.send();
		}
	};
	var request = new XMLHttpRequest();
	request.open("GET", urls[0].url, true);
	request.responseType = urls[0].responseType;
	request.onload = xhr_callback;
	request.send();
}

function fill_score_boxes()
{
	for (var i = 0; i < players.length; i++)
	{
		$("#player"+i+"-score-box").css("background-color","#"+players[i].color.toString(16));
	}
}

function setup_scene()
{
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, SKYBOX_MAX_RADIUS * 2);
	camera.position.z = 1000;
	var camera_positions = [
		[new THREE.Vector3(-MAX_BOUND, 0, 0), players[0].color],
		[new THREE.Vector3(-MAX_BOUND, MAX_BOUND / 2, 0), players[0].color],
		[new THREE.Vector3(-MAX_BOUND, -MAX_BOUND / 2, 0), players[0].color],
		[new THREE.Vector3(-MAX_BOUND, 0, MAX_BOUND / 2), players[0].color],
		[new THREE.Vector3(-MAX_BOUND, 0, -MAX_BOUND / 2), players[0].color],
		[new THREE.Vector3(MAX_BOUND, 0, 0), players[1].color],
		[new THREE.Vector3(MAX_BOUND, MAX_BOUND / 2, 0), players[1].color],
		[new THREE.Vector3(MAX_BOUND, -MAX_BOUND / 2, 0), players[1].color],
		[new THREE.Vector3(MAX_BOUND, 0, MAX_BOUND / 2), players[1].color],
		[new THREE.Vector3(MAX_BOUND, 0, -MAX_BOUND / 2), players[1].color],
		[new THREE.Vector3(0, -MAX_BOUND, 0), players[2].color],
		[new THREE.Vector3(MAX_BOUND / 2, -MAX_BOUND, 0), players[2].color],
		[new THREE.Vector3(-MAX_BOUND / 2, -MAX_BOUND, 0), players[2].color],
		[new THREE.Vector3(0, -MAX_BOUND, MAX_BOUND / 2), players[2].color],
		[new THREE.Vector3(0, -MAX_BOUND, -MAX_BOUND / 2), players[2].color],
		[new THREE.Vector3(0, MAX_BOUND, 0), players[3].color],
		[new THREE.Vector3(MAX_BOUND / 2, MAX_BOUND, 0), players[3].color],
		[new THREE.Vector3(-MAX_BOUND / 2, MAX_BOUND, 0), players[3].color],
		[new THREE.Vector3(0, MAX_BOUND, MAX_BOUND / 2), players[3].color],
		[new THREE.Vector3(0, MAX_BOUND, -MAX_BOUND / 2), players[3].color],
		[new THREE.Vector3(0, 0, MAX_BOUND), players[4].color],
		[new THREE.Vector3(MAX_BOUND / 2, 0, MAX_BOUND), players[4].color],
		[new THREE.Vector3(-MAX_BOUND / 2, 0, MAX_BOUND), players[4].color],
		[new THREE.Vector3(0, MAX_BOUND / 2, MAX_BOUND), players[4].color],
		[new THREE.Vector3(0, -MAX_BOUND / 2, MAX_BOUND), players[4].color],
		[new THREE.Vector3(0, 0, -MAX_BOUND), players[5].color],
		[new THREE.Vector3(MAX_BOUND / 2, 0, -MAX_BOUND), players[5].color],
		[new THREE.Vector3(-MAX_BOUND / 2, 0, -MAX_BOUND), players[5].color],
		[new THREE.Vector3(0, MAX_BOUND / 2, -MAX_BOUND), players[5].color],
		[new THREE.Vector3(0, -MAX_BOUND / 2, -MAX_BOUND), players[5].color]
	];
	for (pos in camera_positions)
	{
		var center = new THREE.PointLight(camera_positions[pos][1], 3, MAX_BOUND);
		center.position.set(camera_positions[pos][0].x, camera_positions[pos][0].y, camera_positions[pos][0].z);
		scene.add(center);
	}
	renderer = new THREE.WebGLRenderer(
	{
		canvas: document.getElementById("c")
	});
	renderer.autoClear = true;
	renderer.setSize($("#c").width(), $("#c").height());
	controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.maxDistance = SKYBOX_MAX_RADIUS;
	controls.noPan = true;
	controls.dollyOut(900);
}

function bind_keys()
{
	$(document).keydown(function(e)
	{
		switch (e.which)
		{
			case 48:
				current_focused_player = 0;
				zoom_to(0);
				break;
			case 49:
				current_focused_player = 1;
				zoom_to(1);
				break;
			case 50:
				current_focused_player = 2;
				zoom_to(2);
				break;
			case 51:
				current_focused_player = 3;
				zoom_to(3);
				break;
			case 52:
				current_focused_player = 4;
				zoom_to(4);
				break;
			case 53:
				current_focused_player = 5;
				zoom_to(5);
				break;
			case 8: //backspace
				zoom_to(current_focused_player);
				break;
			case 187:
				controls.dollyIn(1.1);
				break;
			case 189:
				controls.dollyOut(1.1);
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
			default:
				return;
		}
		e.preventDefault();
	});
	$(document).keyup(function(e)
	{
		switch (e.which)
		{
			case 37: // left
				if (!players[current_focused_player].ai)
					players[current_focused_player].stop();
				key_controls.left = false;
				break;
			case 38: // up
				if (!players[current_focused_player].ai)
					players[current_focused_player].stop();
				key_controls.up = false;
				break;
			case 39: // right
				if (!players[current_focused_player].ai)
					players[current_focused_player].stop();
				key_controls.right = false;
				break;
			case 40: // down
				if (!players[current_focused_player].ai)
					players[current_focused_player].stop();
				key_controls.down = false;
				break;
			default:
				return;
		}
		e.preventDefault();
	});
}

function createSkyBox()
{
	var geometry = new THREE.SphereGeometry(SKYBOX_MAX_RADIUS, 10, 10);
	var uniforms = {
		texture:
		{
			type: 't',
			value: skybox_texture
		}
	};
	var material = new THREE.ShaderMaterial(
	{
		uniforms: uniforms,
		vertexShader: document.getElementById('sky-vertex').textContent,
		fragmentShader: document.getElementById('sky-fragment').textContent
	});
	skyBox = new THREE.Mesh(geometry, material);
	skyBox.scale.set(-1, 1, 1);
	skyBox.eulerOrder = 'XZY';
	skyBox.renderDepth = 1000.0;
	scene.add(skyBox);
}

function add_balls_to_scene()
{
	for (var obj in objects)
		scene.add(objects[obj].mesh);
}

function add_players_to_scene()
{
	for (var player in players)
		if (players[player].enabled)
			scene.add(players[player].mesh);
}

function add_bounding_cube()
{
	bounding_cube = new THREE.BoxHelper(new THREE.Mesh(
		new THREE.BoxGeometry(MAX_BOUND * 2, MAX_BOUND * 2, MAX_BOUND * 2, 2, 2),
		new THREE.LineBasicMaterial()));
	bounding_cube.material.color.set(0x321087);
	scene.add(bounding_cube);
}

function start_demo()
{
	demo = true;
	controls.autoRotate = true;
}

function zoom_to(player) // player is a number
{
	target_angles = [
		[0, Math.PI / 2],
		[0, Math.PI * 3 / 2],
		[-Math.PI / 2, Math.PI],
		[Math.PI / 2, Math.PI],
		[0, Math.PI],
		[0, 0]
	]
	rotation_intermediate = target_angles[player];
}

function new_single_player_game()
{
	// Set player 0 to be user controlled
	players[0].ai = false;
	players[0].userControlled = true;
	for(var i in players)
		players[i].reset = true;
	for(var i in objects)
		objects[i].reset = true;
	controls.autoRotate = false;
	zoom_to(0);
}


function animate()
{
	requestAnimationFrame(animate);
	for (var obj in objects)
		objects[obj].update()
	for (var player in players)
	{
		instructions = []
		for (var obj in objects)
			instructions.push(players[player].ai_intent(objects[obj]));
		players[player].ai_exec(instructions);
		players[player].update();
	}
	if (key_controls.left && players[current_focused_player].userControlled)
		players[current_focused_player].accelerate(new THREE.Vector2(-PLAYER_ACCEL_CONSTANT, 0));
	if (key_controls.right && players[current_focused_player].userControlled)
		players[current_focused_player].accelerate(new THREE.Vector2(PLAYER_ACCEL_CONSTANT, 0));
	if (key_controls.up && players[current_focused_player].userControlled)
		players[current_focused_player].accelerate(new THREE.Vector2(0, PLAYER_ACCEL_CONSTANT));
	if (key_controls.down && players[current_focused_player].userControlled)
		players[current_focused_player].accelerate(new THREE.Vector2(0, -PLAYER_ACCEL_CONSTANT));
	if (rotation_intermediate !== undefined)
	{
		var cur_pos = get_lat_long();
		var diff_lat = rotation_intermediate[0] - cur_pos[0];
		var diff_long = 0;
		if (Math.abs(rotation_intermediate[1] - cur_pos[1]) > Math.abs(rotation_intermediate[1] - cur_pos[1] + Math.PI * 2)) //find the shortest path
			diff_long = -(rotation_intermediate[1] - cur_pos[1] - Math.PI * 2);
		else
			diff_long = rotation_intermediate[1] - cur_pos[1];
		if (rotation_intermediate[1] == 0)
		{
			if (Math.abs(Math.PI * 2 - cur_pos[1]) > Math.abs(Math.PI * 2 - cur_pos[1] + Math.PI * 2)) //find the shortest path
				diff_long2 = -(Math.PI * 2 - cur_pos[1] - Math.PI * 2);
			else
				diff_long2 = Math.PI * 2 - cur_pos[1];
			diff_long = diff_long < diff_long2 ? diff_long : diff_long2;
		}
		if (Math.abs(diff_lat) > 0.01)
		{
			if (Math.abs(diff_lat) < ROTATION_STEP)
				controls.rotateUp(diff_lat);
			else
				controls.rotateUp(ROTATION_STEP * Math.abs(diff_lat) / diff_lat);
		}
		if (Math.abs(diff_long) > 0.01)
		{
			if (Math.abs(diff_long) < ROTATION_STEP)
				controls.rotateLeft(-diff_long);
			else
				controls.rotateLeft(ROTATION_STEP * -Math.abs(diff_long) / diff_long);
		}
		if (Math.abs(diff_lat) < 0.01 && Math.abs(diff_long) < 0.01)
			rotation_intermediate = undefined;
	}
	controls.update();
	renderer.render(scene, camera);
}
//Class constructors
function Ball(position, velocity, color)
{
	var RADIUS = 100;
	var STICKINESS = 0.03;
	var BOUNCINESS = 1.0001;
	this.color = color;
	this.position = position;
	this.position0 = position.clone();
	this.velocity = velocity;
	this.audio_controller;
	this.sphere = function()
	{
		return THREE.Sphere(position, RADIUS)
	}
	this.explosion_effect = function()
	{
		if (this.audio_controller !== undefined)
		{
			this.audio_controller.startOver();
			this.audio_controller.current_playing++;
			this.audio_controller.playOneFlat();
		}
	}
	this.bounce_effect = function()
	{
		if (this.audio_controller !== undefined)
		{
			this.audio_controller.startOver();
			/*this.mesh.updateMatrixWorld();
			var object_position = new THREE.Vector3();
			object_position.setFromMatrixPosition(this.mesh.matrixWorld);
			var listener_position = new THREE.Vector3();
			camera.updateMatrixWorld();
			listener_position.setFromMatrixPosition(camera.matrixWorld);
			var object_orientation = new THREE.Vector3();
			var object_matrix = this.mesh.clone().matrixWorld;
			object_matrix.elements[12] = object_matrix.elements[13] = object_matrix.elements[14] = 0;
			object_orientation.applyProjection(object_matrix);
			object_orientation.normalize();
			var listener_orientation = [new THREE.Vector3(0,0,1),new THREE.Vector3(0,1,0)];
			var camera_matrix = camera.clone().matrix;
			camera_matrix.elements[12] = camera_matrix.elements[13] = camera_matrix.elements[14] = 0;
			listener_orientation[0].applyProjection(camera_matrix);
			listener_orientation[0].normalize();
			listener_orientation[1].applyProjection(camera_matrix);
			listener_orientation[1].normalize();*/
			this.audio_controller.playOneFlat();
		}
	}
	this.mesh = new THREE.Mesh(
		new THREE.SphereGeometry(RADIUS),
		new THREE.MeshPhongMaterial(
		{
			color: this.color
		}));
	this.reset = false;
	this.update = function()
	{
		if (this.reset)
		{
			this.position = this.position0.clone();
			this.velocity.x = Math.random() * 12 - 6;
			this.velocity.y = Math.random() * 12 - 6;
			this.velocity.z = Math.random() * 12 - 6;
			this.reset = false;
		}
		else
		{
			this.position.add(velocity);
			if (this.position.x >= MAX_BOUND)
			{
				this.position.x = MAX_BOUND;
				this.velocity.x *= -1;
				if (players[1].enabled) // player direction → world direction comments added
				{
					if (checkCollisions(this.mesh, [players[1].mesh]))
					{
						// -x → +z, +y → +y
						this.velocity.z += -STICKINESS * players[1].velocity.x;
						this.velocity.y += STICKINESS * players[1].velocity.y;
						this.velocity.x *= BOUNCINESS;
						this.velocity.y *= BOUNCINESS;
						this.velocity.z *= BOUNCINESS;
						this.bounce_effect();
						players[1].scoreInc();
					}
					else
					{
						log("player 1 missed");
						this.explosion_effect();
						players[1].scoreDec();
						this.reset = true;
					}
				}
			}
			if (this.position.x <= -MAX_BOUND)
			{
				this.position.x = -MAX_BOUND;
				this.velocity.x *= -1;
				if (players[0].enabled)
				{
					if (checkCollisions(this.mesh, [players[0].mesh]))
					{
						// +x → +z, +y → +y
						this.velocity.z += STICKINESS * players[0].velocity.x;
						this.velocity.y += STICKINESS * players[0].velocity.y;
						this.velocity.x *= BOUNCINESS;
						this.velocity.y *= BOUNCINESS;
						this.velocity.z *= BOUNCINESS;
						this.bounce_effect();
						players[0].scoreInc();
					}
					else
					{
						log("player 0 missed");
						this.explosion_effect();
						players[0].scoreDec();
						this.reset = true;
					}
				}
			}
			if (this.position.y >= MAX_BOUND)
			{
				this.position.y = MAX_BOUND;
				this.velocity.y *= -1;
				if (players[3].enabled)
				{
					if (checkCollisions(this.mesh, [players[3].mesh]))
					{
						// -y → +z, +x → +x
						this.velocity.x += STICKINESS * players[3].velocity.x;
						this.velocity.z += -STICKINESS * players[3].velocity.y;
						this.velocity.x *= BOUNCINESS;
						this.velocity.y *= BOUNCINESS;
						this.velocity.z *= BOUNCINESS;
						this.bounce_effect();
						players[3].scoreInc();
					}
					else
					{
						log("player 3 missed");
						this.explosion_effect();
						players[3].scoreDec();
						this.reset = true;
					}
				}
			}
			if (this.position.y <= -MAX_BOUND)
			{
				this.position.y = -MAX_BOUND;
				this.velocity.y *= -1;
				if (players[2].enabled)
				{
					if (checkCollisions(this.mesh, [players[2].mesh]))
					{
						// +y → +z, +x → +x
						this.velocity.x += STICKINESS * players[2].velocity.x;
						this.velocity.z += -STICKINESS * players[2].velocity.y;
						this.velocity.x *= BOUNCINESS;
						this.velocity.y *= BOUNCINESS;
						this.velocity.z *= BOUNCINESS;
						this.bounce_effect();
						players[2].scoreInc();
					}
					else
					{
						log("player 2 missed");
						this.explosion_effect();
						players[2].scoreDec();
						this.reset = true;
					}
				}
			}
			if (this.position.z >= MAX_BOUND)
			{
				this.position.z = MAX_BOUND;
				this.velocity.z *= -1;
				if (players[4].enabled)
				{
					if (checkCollisions(this.mesh, [players[4].mesh]))
					{
						// +x → +x, +y → +y
						this.velocity.x += STICKINESS * players[4].velocity.x;
						this.velocity.y += STICKINESS * players[4].velocity.y;
						this.velocity.x *= BOUNCINESS;
						this.velocity.y *= BOUNCINESS;
						this.velocity.z *= BOUNCINESS;
						this.bounce_effect();
						players[4].scoreInc();
					}
					else
					{
						log("player 4 missed");
						this.explosion_effect();
						players[4].scoreDec();
						this.reset = true;
					}
				}
			}
			if (this.position.z <= -MAX_BOUND)
			{
				this.position.z = -MAX_BOUND;
				this.velocity.z *= -1;
				if (players[5].enabled)
				{
					if (checkCollisions(this.mesh, [players[5].mesh]))
					{
						// +x → -x, +y → +y
						this.velocity.x += -STICKINESS * players[5].velocity.x;
						this.velocity.y += STICKINESS * players[5].velocity.y;
						this.velocity.x *= BOUNCINESS;
						this.velocity.y *= BOUNCINESS;
						this.velocity.z *= BOUNCINESS;
						this.bounce_effect();
						players[5].scoreInc();
					}
					else
					{
						log("player 5 missed");
						this.explosion_effect();
						players[5].scoreDec();
						this.reset = true;
					}
				}
			}
		}
		this.set_position();
	}
	this.set_position = function()
	{
		this.mesh.translateX(this.position.x - this.mesh.position.x);
		this.mesh.translateY(this.position.y - this.mesh.position.y);
		this.mesh.translateZ(this.position.z - this.mesh.position.z);
	}
}

function Player(args)
{
	var SIZE = 800;
	this.color = args.color;
	this.position = new THREE.Vector2(0, 0);
	this.velocity = new THREE.Vector2(0, 0);
	this.score = 0;
	this.num = args.num;
	this.userControlled = args.userControlled;
	if (args.enabled === undefined)
	{
		this.enabled = true;
	}
	else
	{
		this.enabled = enabled;
	}
	if (args.ai === undefined)
	{
		this.ai = false;
	}
	else
	{
		this.ai = args.ai;
	}
	this.mesh = new THREE.Mesh(
		new THREE.BoxGeometry(SIZE, SIZE, SIZE / 8),
		new THREE.MeshBasicMaterial(
		{
			color: this.color,
			side: THREE.DoubleSide,
			transparent: true,
			opacity: 0.6
		}));
	/* Positions:
		0: -x
		1: +x
		2: -y
		3: +y
		4: -z
		5: +z
	*/
	switch (this.num)
	{
		case 0:
			this.mesh.rotation.y = -Math.PI / 2;
			this.mesh.translateZ(MAX_BOUND);
			break;
		case 1:
			this.mesh.rotation.y = Math.PI / 2;
			this.mesh.translateZ(MAX_BOUND);
			break;
		case 2:
			this.mesh.rotation.x = Math.PI / 2;
			this.mesh.translateZ(MAX_BOUND);
			break;
		case 3:
			this.mesh.rotation.x = -Math.PI / 2;
			this.mesh.translateZ(MAX_BOUND);
			break;
		case 4:
			this.mesh.rotation.z = Math.PI / 2;
			this.mesh.translateZ(MAX_BOUND);
			break;
		case 5:
			this.mesh.rotation.z = -Math.PI / 2;
			this.mesh.translateZ(-MAX_BOUND);
			break;
	}
	this.scoreInc = function()
	{
		this.score++;
		$("#player"+this.num+"-score").text(this.score);
	}
	this.scoreDec = function()
	{
		this.score--;
		$("#player"+this.num+"-score").text(this.score);
	}
	this.reset = false;
	this.accelerate = function(acc_vec) //THREE.Vector2
	{
		this.velocity.x += acc_vec.x;
		this.velocity.y += acc_vec.y;
	}
	this.stop = function()
	{
		this.stop_x();
		this.stop_y();
	}
	this.stop_x = function()
	{
		this.velocity.x = 0;
	}
	this.stop_y = function()
	{
		this.velocity.y = 0;
	}
	this.moveY = function(step)
	{
		if (this.position.y + step > MAX_BOUND - SIZE / 2)
		{
			step = MAX_BOUND - SIZE / 2 - this.position.y;
			this.position.y = MAX_BOUND - SIZE / 2;
			this.velocity.y = 0;
		}
		else if (this.position.y + step < -MAX_BOUND + SIZE / 2)
		{
			step = -MAX_BOUND + SIZE / 2 - this.position.y;
			this.position.y = -MAX_BOUND + SIZE / 2;
			this.velocity.y = 0;
		}
		else
		{
			this.position.y += step;
		}
		switch (this.num)
		{
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
	this.moveX = function(step)
	{
		if (this.position.x + step > MAX_BOUND - SIZE / 2)
		{
			step = MAX_BOUND - SIZE / 2 - this.position.x;
			this.position.x = MAX_BOUND - SIZE / 2;
			this.velocity.x = 0;
		}
		else if (this.position.x + step < -MAX_BOUND + SIZE / 2)
		{
			step = -MAX_BOUND + SIZE / 2 - this.position.x;
			this.position.x = -MAX_BOUND + SIZE / 2;
			this.velocity.x = 0;
		}
		else
		{
			this.position.x += step;
		}
		switch (this.num)
		{
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
	this.update = function()
	{
		if (this.reset)
		{
			this.score = 0;
			$("#player"+this.num+"-score").text(this.score);
			this.moveX(-this.position.x);
			this.moveY(-this.position.y);
			this.velocity.x = 0
			this.velocity.y = 0;
			this.reset = false;
		}
		this.moveX(this.velocity.x);
		this.moveY(this.velocity.y);
	}
	this.move_right_ai = function()
	{
		return function(self)
		{
			if (self.velocity.x < 0)
				self.stop_x();
			self.accelerate(new THREE.Vector2(PLAYER_ACCEL_CONSTANT, 0));
		};
	}
	this.move_left_ai = function()
	{
		return function(self)
		{
			if (self.velocity.x > 0)
				self.stop_x();
			self.accelerate(new THREE.Vector2(-PLAYER_ACCEL_CONSTANT, 0));
		};
	}
	this.move_up_ai = function()
	{
		return function(self)
		{
			if (self.velocity.y < 0)
				self.stop_y();
			self.accelerate(new THREE.Vector2(0, PLAYER_ACCEL_CONSTANT));
		};
	}
	this.move_down_ai = function()
	{
		return function(self)
		{
			if (self.velocity.y > 0)
				self.stop_y();
			self.accelerate(new THREE.Vector2(0, -PLAYER_ACCEL_CONSTANT));
		};
	}
	this.stop_x_ai = function()
	{
		return function(self)
		{
			self.stop_x();
		};
	}
	this.stop_y_ai = function()
	{
		return function(self)
		{
			self.stop_y();
		};
	}
	this.ai_exec = function(instructions)
	{
		if (this.ai)
		{
			instructions.sort(function(a, b)
			{
				return b[0] - a[0]; //reverse sort
			});
			instructions[0][1](this);
			instructions[0][2](this);
		}
	}
	this.ai_intent = function(ball)
	{
		if (this.ai)
		{
			var instructions = [];
			switch (this.num)
			{
				case 0:
					instructions[0] = -ball.position.x;
					if (ball.position.z > this.position.x)
						instructions[1] = this.move_right_ai();
					else if (ball.position.z < this.position.x)
						instructions[1] = this.move_left_ai();
					else if (ball.position.z == this.position.x)
						instructions[1] = this.stop_x_ai();
					if (ball.position.y > this.position.y)
						instructions[2] = this.move_up_ai();
					else if (ball.position.y < this.position.y)
						instructions[2] = this.move_down_ai();
					else if (ball.position.y == this.position.y)
						instructions[2] = this.stop_y_ai();
					break;
				case 1:
					instructions[0] = ball.position.x;
					if (ball.position.z < -this.position.x)
						instructions[1] = this.move_right_ai();
					else if (ball.position.z > -this.position.x)
						instructions[1] = this.move_left_ai();
					else if (ball.position.z == -this.position.x)
						instructions[1] = this.stop_x_ai();
					if (ball.position.y > this.position.y)
						instructions[2] = this.move_up_ai();
					else if (ball.position.y < this.position.y)
						instructions[2] = this.move_down_ai();
					else if (ball.position.y == this.position.y)
						instructions[2] = this.stop_y_ai();
					break;
				case 2:
					instructions[0] = -ball.position.y;
					if (ball.position.z > this.position.y)
						instructions[2] = this.move_up_ai();
					else if (ball.position.z < this.position.y)
						instructions[2] = this.move_down_ai();
					else if (ball.position.z == this.position.y)
						instructions[2] = this.stop_y_ai();
					if (ball.position.x > this.position.x)
						instructions[1] = this.move_right_ai();
					else if (ball.position.x < this.position.x)
						instructions[1] = this.move_left_ai();
					else if (ball.position.x == this.position.x)
						instructions[1] = this.stop_x_ai();
					break;
				case 3:
					instructions[0] = ball.position.y;
					if (ball.position.z < -this.position.y)
						instructions[2] = this.move_up_ai();
					else if (ball.position.z > -this.position.y)
						instructions[2] = this.move_down_ai();
					else if (ball.position.z == -this.position.y)
						instructions[2] = this.stop_y_ai();
					if (ball.position.x > this.position.x)
						instructions[1] = this.move_right_ai();
					else if (ball.position.x < this.position.x)
						instructions[1] = this.move_left_ai();
					else if (ball.position.x == this.position.x)
						instructions[1] = this.stop_x_ai();
					break;
				case 4:
					instructions[0] = ball.position.z;
					if (ball.position.y > this.position.y)
						instructions[2] = this.move_up_ai();
					else if (ball.position.y < this.position.y)
						instructions[2] = this.move_down_ai();
					else if (ball.position.y == this.position.y)
						instructions[2] = this.stop_y_ai();
					if (ball.position.x > this.position.x)
						instructions[1] = this.move_right_ai();
					else if (ball.position.x < this.position.x)
						instructions[1] = this.move_left_ai();
					else if (ball.position.x == this.position.x)
						instructions[1] = this.stop_x_ai();
					break;
				case 5:
					instructions[0] = -ball.position.z;
					if (ball.position.y > this.position.y)
						instructions[2] = this.move_up_ai();
					else if (ball.position.y < this.position.y)
						instructions[2] = this.move_down_ai();
					else if (ball.position.y == this.position.y)
						instructions[2] = this.stop_y_ai();
					if (ball.position.x < -this.position.x)
						instructions[1] = this.move_right_ai();
					else if (ball.position.x > -this.position.x)
						instructions[1] = this.move_left_ai();
					else if (ball.position.x == -this.position.x)
						instructions[1] = this.stop_x_ai();
					break;
			}
			return instructions;
		}
	}
}

function Audio()
{
	this.sound = {};
	this.ctx = global_audio_context;
	this.mainVolume = this.ctx.createGain();
	this.mainVolume.connect(this.ctx.destination);
	this.buffers = [];
	this.current_playing = -1;
	this.sound.volume = this.ctx.createGain();
	this.playing = false;
	this.addSound = function(data, callback) //data from XMLHttpRequest
	{
		var self = this;
		this.ctx.decodeAudioData(data, function onSuccess(buffer)
		{
			self.buffers.push(buffer);
			if (callback !== undefined)
				callback();
		}, function onFailure()
		{});
	}
	this.set_up_audiobuffersourcenode = function()
	{
		this.sound.source = this.ctx.createBufferSource();
		this.sound.panner = this.ctx.createPanner();
	}
	this.playOneFlat = function(callback)
	{
		this.current_playing++;
		this.set_up_audiobuffersourcenode();
		this.sound.volume.connect(this.mainVolume);
		this.sound.source.connect(this.sound.volume);
		this.stop();
		if (this.buffers[this.current_playing] !== undefined)
		{
			this.sound.source.buffer = this.buffers[this.current_playing];
			this.sound.source.start(this.ctx.currentTime);
			this.playing = true;
			var self = this;
			if (callback !== undefined)
				this.sound.source.onended(function()
				{
					self.playing = false;
					callback();
				});
		}
	}
	this.playAllLoopFlat = function()
		{
			this.current_playing++;
			this.set_up_audiobuffersourcenode();
			this.sound.volume.connect(this.mainVolume);
			this.sound.source.connect(this.sound.volume);
			this.stop();
			if (this.buffers.length <= 0)
				return false;
			this.playing = true;
			if (this.buffers[this.current_playing] == undefined)
			{
				this.startOver();
				this.current_playing++;
			}
			this.sound.source.buffer = this.buffers[this.current_playing];
			this.sound.source.start(this.ctx.currentTime);
			var self = this;
			this.sound.source.onended = function()
			{
				self.playing = false;
				self.playAllLoopFlat();
			};
		}
		/*
		TODO: Fix this

		this.playOnePositional = function(object_position,object_orientation,listener_position, listener_orientation, callback){ //listener will be the camera, object will be the ball
			this.current_playing++;
			this.stop();
			this.set_up_audiobuffersourcenode();
			this.sound.volume.connect(this.sound.panner);
			this.sound.panner.connect(this.mainVolume);
			this.sound.panner.rolloffFactor = 0;
			this.sound.panner.coneInnerAngle = 360;
			this.sound.panner.setPosition(object_position.x,object_position.y,object_position.z);
			//this.sound.panner.setOrientation(object_orientation.x,object_orientation.y,object_orientation.z);
			this.ctx.listener.setPosition(listener_position.x,listener_position.y,listener_position.z);
			//this.ctx.listener.setOrientation(listener_orientation[0].x,listener_orientation[0].y,listener_orientation[0].z,listener_orientation[1].x,listener_orientation[1].y,listener_orientation[1].z);

			if (this.buffers[this.current_playing] !== undefined)
			{
				this.playing = true;
				this.sound.source.buffer = this.buffers[this.current_playing];
				this.sound.source.start(this.ctx.currentTime);
				var self = this;
				this.sound.source.onended = function(){self.playing = false;};
			}
		}*/
	this.startOver = function()
	{
		this.current_playing = -1;
	}
	this.stop = function()
	{
		this.sound.source.onended = function() {};
		if (this.playing && this.sound.source !== undefined)
		{
			try
			{
				this.sound.source.stop();
			}
			catch (DOMException)
			{
				log("Audio error");
			}
		}
		this.playing = false;
	}
}
// Helper methods
function log()
{
	if (PRINT_LOGS)
		for (var i = 0; i < arguments.length; i++)
			console.log(arguments[i]);
}

function get_lat_long()
{
	function radius(x, y, z)
	{
		return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
	}
	x = camera.getWorldPosition();
	if (x.z > 0)
	{
		longitude = Math.atan(x.x / x.z) + Math.PI;
	}
	else if (x.x <= 0)
	{
		longitude = Math.abs(Math.atan(x.x / x.z));
	}
	else if (x.x > 0)
	{
		longitude = Math.PI * 2 - Math.abs(Math.atan(x.x / x.z));
	}
	latitude = Math.atan(x.y / radius(x.x, x.z));
	return [latitude, longitude];
}

function checkCollisions(mesh, collidableMeshList) // http://stackoverflow.com/questions/11473755/how-to-detect-collision-in-three-js
{
	for (var vertexIndex = 0; vertexIndex < mesh.geometry.vertices.length; vertexIndex++)
	{
		var localVertex = mesh.geometry.vertices[vertexIndex].clone();
		var globalVertex = localVertex.applyMatrix4(mesh.matrix);
		var directionVector = globalVertex.sub(mesh.position);
		var ray = new THREE.Raycaster(mesh.position, directionVector.clone().normalize());
		var collisionResults = ray.intersectObjects(collidableMeshList);
		if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length())
		{
			log("collision")
			return true;
		}
	}
	return false;
}

function get_palette_color(num)
{
	var palette = [
		0x95FE03,
		0x3BAEE0,
		0xE85EC3,
		0x37FF81,
		0xE2704B,
		0x4A00B4,
		0xFCB227,
		0x9C5EDB,
		0x1CC095,
		0xB4003C,
		0xCFFF37,
		0xF8345A,
	]
	return palette[num];
}