var camera, scene, renderer;

var composer, renderPass, copyPass;

var effects = true;

var slabs = {
    slabs: [],
    count: 750,
    texture_count: 3,
    geometry: null,
    materials: {}
};

var road = {
    y: -100,
    z: 0,
    stepZ: 125,
    speed: 80
};

var sway = {
    speedX: 0.2,
    maxX: 40,
    speedY: 0.5,
    maxY: 10
};

var swing = {
    speedX: 0.3,
    maxX: 10,
    speedY: 0.1,
    maxY: 20
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
    camera.position.y = 0;
    camera.position.z = 0;
    camera.rotation.x = -0.1;
    camera.setLens(28);

    scene = new THREE.Scene();

    scene.fog = new THREE.FogExp2(0x000000, 0.00025);

    for (var i = 0; i < slabs.texture_count; i++) {
        var slab_material = new THREE.MeshBasicMaterial({
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

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMapEnabled = true;

    document.body.appendChild(renderer.domElement);

    if (effects) {
        composer = new THREE.EffectComposer(renderer);
        renderPass = new THREE.RenderPass(scene, camera);
        copyPass = new THREE.ShaderPass(THREE.CopyShader);
        composer.addPass(renderPass);

        vignettePass = new THREE.ShaderPass(THREE.VignetteShader);
        vignettePass.uniforms.darkness.value = 2.5;
        vignettePass.uniforms.offset.value = 1;
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

var camOffsetX = 0;
var swayX = 'right';

var camOffsetY = 0;
var swayY = 'up';

var camSwingX = 0;
var swingX = 'up';

var camSwingY = 0;
var swingY = 'right';

function animate() {
    requestAnimationFrame(animate);

    if (camOffsetX < random(0, sway.maxX) && swayX === 'right') {
        camOffsetX += sway.speedX;
    } else {
        swayX = 'left';
    }
    if (camOffsetX > -random(0, sway.maxX) && swayX === 'left') {
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

    if (camSwingX < random(swing.maxX/2, swing.maxX) && swingX === 'up') {
        camSwingX += swing.speedX;
    } else {
        swingX = 'down';
    }
    if (camSwingX > -random(swing.maxX/2, swing.maxX) && swingX === 'down') {
        camSwingX -= swing.speedX;
    } else {
        swingX = 'up';
    }

    if (camSwingY < random(swing.maxY/2, swing.maxY) && swingY === 'right') {
        camSwingY += swing.speedY;
    } else {
        swingY = 'left';
    }
    if (camSwingY > -random(swing.maxY/2, swing.maxY) && swingY === 'left') {
        camSwingY -= swing.speedY;
    } else {
        swingY = 'right';
    }

    camera.position.x = camOffsetX;
    camera.position.y = camOffsetY;

    camera.rotation.x = camSwingX/1000;
    camera.rotation.y = camSwingY/1000;

    camera.position.z -= road.speed;

    dist = Math.floor(camera.position.z / road.stepZ);

    if (dist < prev_dist) {
        progress++;

        if (progress > 500) {
            console.log('loop');
            progress = prev_dist = 0;
            camera.position.y = 0;
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