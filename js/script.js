var camera, scene, renderer;

var composer, renderPass, copyPass;

var slabs = [],
        slabs_initial = 100,
        slab_rotation = -1.38,
        slab_texture_count = 3,
        slab_geometry,
        slab_materials = {};

var road = {
    startZ: 0,
    startY: -150,
    stepZ: 125,
    stepY: 24,
    speed: 80
};

var sway = {
    speedX: 0.6,
    maxX: 40,
    speedY: 0.1,
    maxY: 2
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

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000000);
    camera.position.y = -50;
    camera.position.z = 0;
    camera.setLens(28);

    scene = new THREE.Scene();

    scene.fog = new THREE.FogExp2(0x000000, 0.00025);

    for (var i = 0; i < slab_texture_count; i++) {
        var slab_material = new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture('img/slab'+i+'.png')
        });
        slab_material.map.needsUpdate = true;
        slab_materials[i] = slab_material;
    }

    slab_geometry = new THREE.PlaneGeometry(1000, 130);

    for (var i = 0; i < slabs_initial; i++) {
        render_slab();
    }
    position_slabs();

    renderer = new THREE.WebGLRenderer({clearColor: 0x000000, clearAlpha: 1});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMapEnabled = true;


    document.body.appendChild(renderer.domElement);


    composer = new THREE.EffectComposer(renderer);
    renderPass = new THREE.RenderPass(scene, camera);
    copyPass = new THREE.ShaderPass(THREE.CopyShader);

    composer.addPass(renderPass);

//    bloomPass = new THREE.BloomPass(1,25,4.0,256);
//    composer.addPass(bloomPass);

    vignettePass = new THREE.ShaderPass(THREE.VignetteShader);
    vignettePass.uniforms.darkness.value = 2.3;
    vignettePass.uniforms.offset.value = 1.3;
    composer.addPass(vignettePass);

    focusPass = new THREE.ShaderPass(THREE.FocusShader);
    focusPass.uniforms.sampleDistance.value = 0.5;
    focusPass.uniforms.waveFactor.value = 0.0025;
    composer.addPass(focusPass);

    composer.addPass(copyPass);
    copyPass.renderToScreen = true;
}

var slab_material_i = 0;

function render_slab() {
    if (slab_material_i > slab_texture_count-1) {
        slab_material_i = 0;
    }

    var material = slab_materials[slab_material_i];

    var slab = new THREE.Mesh(slab_geometry, material);
    slabs.push(slab);
    scene.add(slab);

    slab_material_i++;
}

function position_slabs() {
    for (i in slabs) {
        var slab = slabs[i];
        slab.position.z = road.startZ - (i * road.stepZ);
        slab.position.y = road.startY + (i * road.stepY);
        slab.rotation.x = slab_rotation;
    }
}

var dist = 0, prev_dist = 0;

var camOffsetX = 0;
var swayX = 'right';

var camOffsetY = 0;
var swayY = 'up';

function animate() {

    requestAnimationFrame(animate);

    if (camOffsetX < random(sway.maxX/2, sway.maxX) && swayX === 'right') {
        camOffsetX += sway.speedX;
    } else {
        swayX = 'left';
    }
    if (camOffsetX > -random(sway.maxX/2, sway.maxX) && swayX === 'left') {
        camOffsetX -= sway.speedX;
    } else {
        swayX = 'right';
    }

    if (camOffsetY < random(sway.maxY/2, sway.maxY) && swayY === 'up') {
        camOffsetY += sway.speedY;
    } else {
        swayY = 'down';
    }
    if (camOffsetY > -random(sway.maxY/2, sway.maxY) && swayY === 'down') {
        camOffsetY -= sway.speedY;
    } else {
        swayY = 'up';
    }

    camera.position.x = camOffsetX;
    camera.position.y += (road.speed * (road.stepY / road.stepZ)) + camOffsetY;
    camera.position.z -= road.speed;

    dist = Math.floor(camera.position.z / road.stepZ);

    if (dist < prev_dist) {
        render_slab();
        position_slabs();
        prev_dist = dist;
    }

    composer.render(0.1);

//    renderer.render(scene, camera);
}

function random(from, to) {
    return Math.floor(Math.random() * (to - from + 1) + from);
}