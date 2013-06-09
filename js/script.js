var camera, scene, renderer, controls, controls_enabled = false;

var composer, renderPass, copyPass;

var light1, light2;

var effects = true;

var slabs = {
    slabs: [],
    count: 750,
    texture_count: 3,
    geometry: null,
    materials: {}
};

var cam = {
    rotateX: -0.15,
    posY: 100
};

var road = {
    y: 0,
    z: 0,
    stepZ: 125,
    speed: 80
};

var sway = {
    speedX: 0.4,
    maxX: 30,
    speedY: 0.5,
    maxY: 10
};

var swing = {
    speedX: 0.5,
    maxX: 10,
    speedY: 0.5,
    maxY: 10
};

window.addEventListener('load', function(){
    init();
    animate();
});

window.addEventListener('resize', function(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
});

function init() {

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.y = cam.posY;
    camera.position.z = 0;
    camera.setLens(35);

    controls = new THREE.TrackballControls( camera );
    controls.target.set( 0, 0, 0 );

    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;

    controls.noZoom = false;
    controls.noPan = false;

    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.15;

    controls.keys = [ 65, 83, 68 ];

    scene = new THREE.Scene();

    scene.fog = new THREE.FogExp2(0x000000, 0.0002);

    scene.add(new THREE.AmbientLight(0xffffff));

    light1 = new THREE.SpotLight(0xffffff, 50, 3000);
    light1.target.position.x = -400;
    light1.target.position.y = 50;
    light1.exponent = 150;
    scene.add(light1);

    light2 = new THREE.SpotLight(0xffffff, 50, 3000);
    light2.target.position.x = 400;
    light2.target.position.y = 50;
    light2.exponent = 150;
    scene.add(light2);

    var sphere = new THREE.SphereGeometry(10, 16, 8);

//    var l1 = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({color: 0xff0000}));
//    l1.position = light1.position;
//    scene.add(l1);
//
//    var l2 = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({color: 0x00ff00}));
//    l2.position = light2.position;
//    scene.add(l2);

    for (var i = 0; i < slabs.texture_count; i++) {
        var slab_material = new THREE.MeshPhongMaterial({
            ambient: 0x333333,
            shading: THREE.SmoothShading,
            map: THREE.ImageUtils.loadTexture('img/slab'+i+'.png')
        });
        slab_material.map.needsUpdate = true;
        slabs.materials[i] = slab_material;
    }

    slabs.geometry = new THREE.PlaneGeometry(1500, 125);

    for (var i = 0; i < slabs.count; i++) {
        render_slab();
    }
    position_slabs();

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setClearColor( scene.fog.color, 1 );
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMapEnabled = true;

    document.body.appendChild(renderer.domElement);

    if (effects) {
        composer = new THREE.EffectComposer(renderer);
        renderPass = new THREE.RenderPass(scene, camera);
        copyPass = new THREE.ShaderPass(THREE.CopyShader);
        composer.addPass(renderPass);

        vignettePass = new THREE.ShaderPass(THREE.VignetteShader);
        vignettePass.uniforms.darkness.value = 1.05;
        vignettePass.uniforms.offset.value = 1.5;
        composer.addPass(vignettePass);

        focusPass = new THREE.ShaderPass(THREE.FocusShader);
        focusPass.uniforms.sampleDistance.value = 0.5;
        focusPass.uniforms.waveFactor.value = 0.0025;
        composer.addPass(focusPass);

        composer.addPass(copyPass);
        copyPass.renderToScreen = true;
    }
}

var slab_material_i = 0;

function render_slab() {
    if (slab_material_i > slabs.texture_count-1) {
        slab_material_i = 0;
    }

    var material = slabs.materials[slab_material_i];

    var slab = new THREE.Mesh(slabs.geometry, material);
    slab.doubleSided = true;
    slab.rotation.x = -Math.PI/2;
    slabs.slabs.push(slab);
    scene.add(slab);

    slab_material_i++;
}

function position_slabs() {
    for (i in slabs.slabs) {
        var slab = slabs.slabs[i];
        slab.position.y = road.y;
        slab.position.z = road.z - (i * road.stepZ);
    }
}

var progress = 0;

var dist = 0, prev_dist = 0;

var swayX, camOffsetX = 0, camOffsetX_target = 0;
var swayY, camOffsetY = 0, camOffsetY_target = 0;

var swingX, camSwingX = 0, camSwingX_target = 0;
var swingY, camSwingY = 0, camSwingY_target = 0;

function animate() {
    requestAnimationFrame(animate);

    if (camOffsetX < camOffsetX_target && swayX === 'right') {
        camOffsetX += sway.speedX;
    } else if (camOffsetX > camOffsetX_target && swayX === 'left') {
        camOffsetX -= sway.speedX;
    } else if (swayX === 'right') {
        camOffsetX_target = -random(0, sway.maxX);
        swayX = 'left';
    } else {
        camOffsetX_target = random(0, sway.maxX);
        swayX = 'right';
    }

    if (camOffsetY < camOffsetY_target && swayY === 'up') {
        camOffsetY += sway.speedY;
    } else if (camOffsetY > camOffsetY_target && swayY === 'down') {
        camOffsetY -= sway.speedY;
    } else if (swayY === 'up') {
        camOffsetY_target = -random(0, sway.maxY);
        swayY = 'down';
    } else {
        camOffsetY_target = random(0, sway.maxY);
        swayY = 'up';
    }

    if (camSwingX < camSwingX_target && swingX === 'up') {
        camSwingX += swing.speedX;
    } else if (camSwingX > camSwingX_target && swingX === 'down') {
        camSwingX -= swing.speedX;
    } else if (swingX === 'up') {
        camSwingX_target = -random(0, swing.maxX);
        swingX = 'down';
    } else {
        camSwingX_target = random(0, swing.maxX);
        swingX = 'up';
    }

    if (camSwingY < camSwingY_target && swingY === 'right') {
        camSwingY += swing.speedY;
    } else if (camSwingY > camSwingY_target && swingY === 'left') {
        camSwingY -= swing.speedY;
    } else if (swingY === 'right') {
        camSwingY_target = -random(0, swing.maxY);
        swingY = 'left';
    } else {
        camSwingY_target = random(0, swing.maxY);
        swingY = 'right';
    }

    if (controls_enabled) {
        controls.update();

    } else {
        camera.position.x = camOffsetX;
        camera.position.y = cam.posY + camOffsetY;

        camera.rotation.x = cam.rotateX + (camSwingX/1000);
        camera.rotation.y = camSwingY/1000;

        camera.position.z -= road.speed;

        light1.position.x = -60 + camOffsetX;
        light2.position.x = 60 + camOffsetX;
        light1.position.y = light2.position.y = 50 + camOffsetY;
        light1.position.z = light2.position.z = camera.position.z - 00;
        light1.target.position.z = light2.target.position.z = camera.position.z - 3000;
    }

    dist = Math.floor(camera.position.z / road.stepZ);

    if (dist < prev_dist) {
        progress++;

        if (progress > 500) {
            console.log('loop');
            progress = prev_dist = 0;
            camera.position.z = 0;

        } else {
            prev_dist = dist;
        }
    }

    if (effects) {
        composer.render(0.1);
    } else {
        renderer.render(scene, camera);
    }
}

function random(from, to) {
    return Math.floor(Math.random() * (to - from + 1) + from);
}

function difference(a, b) {
    return Math.abs(a - b);
}