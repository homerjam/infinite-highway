var effects = true;
var controls_enabled = false;

var options = {
    road_speed: 100
};

$.fn.ready(function() {

    $(document).on('keydown', function(e) {
        if (e.keyCode === 32) {
            road.speed = road.speed === 0 ? options.road_speed : 0;
        }
    });

});

var camera, scene, renderer, controls;

var composer, renderPass, copyPass;

var light1, light2;

var slabs = {
    slabs: [],
    y: 0,
    w: 1500,
    h: 1500,
    count: 300,
    texture_path: 'img3',
    texture_format: 'jpg',
    texture_count: 1,
    geometry: null,
    materials: {}
};

var linesGroup;

var lines = {
    lines: [],
    y: 2,
    w: 30,
    h: 750,
    count: 300,
    geometry: null
};

var cam = {
    rotateX: Math.PI/30,
    posY: 60
};

var roadGroup;

var road = {
    speed: options.road_speed,
    speedIncrement: 2,
    speedDirectionMax: 50
};

var sway = {
    speedX: 0.3,
    maxX: 10,
    speedY: 0.3,
    maxY: 20
};

var swing = {
    speedX: 0.1,
    maxX: 10,
    speedY: 0.2,
    maxY: 20
};

var potholes = {
    potholes: [],
    y: 1,
    textures: [{
        filename: 'pothole0.png',
        w: 1100,
        h: 1400,
        map: null
    }]
};

var euler = new THREE.Euler(-Math.PI/2, 0, 0, 'XYZ');

var group, material, textGeo, textMesh1;

window.addEventListener('load', function() {
    init();
    animate();
});

window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
});

function init() {

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    camera.rotation.x = cam.rotateX;
    camera.position.y = cam.posY;
    camera.position.z = 0;
    camera.setLens(35);

    controls = new THREE.TrackballControls(camera);
    controls.target.set(0, 0, 0);

    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;

    controls.noZoom = false;
    controls.noPan = false;

    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;

    controls.keys = [65, 83, 68];

    controls.addEventListener('change', render);

    scene = new THREE.Scene();

    scene.fog = new THREE.FogExp2(0x000000, 0.0002);

    scene.add(new THREE.AmbientLight(0xffffff));

    light1 = new THREE.SpotLight(0xffffff, 50, 3000);
    light1.target.position.x = -400;
    light1.target.position.y = 50;
    light1.exponent = 120;
    scene.add(light1);

    light2 = new THREE.SpotLight(0xffffff, 50, 3000);
    light2.target.position.x = 400;
    light2.target.position.y = 50;
    light2.exponent = 120;
    scene.add(light2);

    light1.position.x = -60;
    light2.position.x = 60;
    light1.position.y = light2.position.y = 50;
    light1.position.z = light2.position.z = 0;
    light1.target.position.z = light2.target.position.z = -3000;

    var sphere = new THREE.SphereGeometry(10, 16, 8);

    // var l1 = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({color: 0xff0000}));
    // l1.position = light1.position;
    // scene.add(l1);

    // var l2 = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({color: 0x00ff00}));
    // l2.position = light2.position;
    // scene.add(l2);

    var i;

    for (i = 0; i < slabs.texture_count; i++) {
        var slab_material = new THREE.MeshPhongMaterial({
            ambient: 0x444444,
            specular: 0x000000,
            shading: THREE.SmoothShading,
            map: THREE.ImageUtils.loadTexture(slabs.texture_path + '/slab' + i + '.' + slabs.texture_format)
        });
        slab_material.map.needsUpdate = true;
        slabs.materials[i] = slab_material;
    }

    slabs.geometry = new THREE.PlaneGeometry(slabs.w, slabs.h);

    roadGroup = new THREE.Object3D();

    var randomTextureInt = function() {
        return random(3, 15);
    };

    var n = 0;
    var tI = randomTextureInt();

    for (i = 0; i < slabs.count; i++) {
        t = 0;

        if (n === tI) {
            n = 0;
            tI = randomTextureInt();
            t = random(0, slabs.texture_count - 1);
        }


        var slab = new THREE.Mesh(slabs.geometry, slabs.materials[t]);
        slab.doubleSided = true;
        slab.rotation.x = -Math.PI/2;
        // slab.position.applyEuler(euler);
        slab.position.y = slabs.y;
        slab.position.z = 0 - (i * slabs.h);
        slabs.slabs.push(slab);
        roadGroup.add(slab);

        n++;
    }

    scene.add(roadGroup);

    linesGroup = new THREE.Object3D();

    lines.material = new THREE.MeshPhongMaterial({
        color: 0xffff00,
        specular: 0xffff00,
        ambient: 0x444444,
        shading: THREE.SmoothShading,
        map: THREE.ImageUtils.loadTexture('img/rough_yellow.jpg'),
        transparent: true,
        opacity: 0.8
    });

    lines.geometry = new THREE.PlaneGeometry(lines.w, lines.h);

    for (i = 0; i < lines.count; i++) {
        var line = new THREE.Mesh(lines.geometry, lines.material);
        line.doubleSided = true;
        line.rotation.x = -Math.PI/2;
        // line.position.applyEuler(euler);        
        line.position.y = lines.y;
        line.position.z = 0 - (i * (lines.h * 2));
        lines.lines.push(line);
        linesGroup.add(line);
    }

    roadGroup.add(linesGroup);


    textGeo = new THREE.TextGeometry("Hello World", {
        size: 100,
        height: 0,
        font: "boston traffic",
        weight: "normal",
        style: "normal",
        bevelenabled: false
        // curvesegments: 4
    });

    textGeo.computeBoundingBox();
    textGeo.computeVertexNormals();

    material = new THREE.MeshPhongMaterial({
        color: 0xffff00,
        specular: 0xffff00,
        ambient: 0xffff00,
        shading: THREE.FlatShading,
        map: THREE.ImageUtils.loadTexture('img/rough_yellow.jpg'),
        transparent: true,
        opacity: 0.8
    });

    var centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);

    textMesh1 = new THREE.Mesh(textGeo, material);
    textMesh1.position.x = centerOffset;
    textMesh1.position.y = 150;
    textMesh1.position.z = -20000;
    textMesh1.rotation.y = Math.PI * 2;
    scene.add(textMesh1);


    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setClearColor(scene.fog.color, 1);
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
        focusPass.uniforms.sampleDistance.value = 0.15;
        focusPass.uniforms.waveFactor.value = 0.001;
        composer.addPass(focusPass);

        composer.addPass(copyPass);
        copyPass.renderToScreen = true;

        tweak_focus(true);
    }

    load_potholes();

    generate_pothole();
}

var progress = 0;

var dist = 0,
    prev_dist = 0;

var swayDirectionX, swayOffsetX = 0,
    swayOffsetTargetX = 0;
var swayDirectionY, swayOffsetY = 0,
    swayOffsetTargetY = 0;

var swingDirectionX, swingOffsetX = 0,
    swingOffsetTargetX = 0;
var swingDirectionY, swingOffsetY = 0,
    swingOffsetTargetY = 0;

var speedDirection, speedOffset = 0,
    speedTarget = 0;

function animate() {
    requestAnimationFrame(animate);

    if (controls_enabled) {
        controls.update();

    } else {

        if (swayOffsetX < swayOffsetTargetX && swayDirectionX === 'right') {
            swayOffsetX += sway.speedX;
        } else if (swayOffsetX > swayOffsetTargetX && swayDirectionX === 'left') {
            swayOffsetX -= sway.speedX;
        } else if (swayDirectionX === 'right') {
            swayOffsetTargetX = -random(0, sway.maxX);
            swayDirectionX = 'left';
        } else {
            swayOffsetTargetX = random(0, sway.maxX);
            swayDirectionX = 'right';
        }

        if (swayOffsetY < swayOffsetTargetY && swayDirectionY === 'up') {
            swayOffsetY += sway.speedY;
        } else if (swayOffsetY > swayOffsetTargetY && swayDirectionY === 'down') {
            swayOffsetY -= sway.speedY;
        } else if (swayDirectionY === 'up') {
            swayOffsetTargetY = -random(0, sway.maxY);
            swayDirectionY = 'down';
        } else {
            swayOffsetTargetY = random(0, sway.maxY);
            swayDirectionY = 'up';
        }

        if (swingOffsetX < swingOffsetTargetX && swingDirectionX === 'up') {
            swingOffsetX += swing.speedX;
        } else if (swingOffsetX > swingOffsetTargetX && swingDirectionX === 'down') {
            swingOffsetX -= swing.speedX;
        } else if (swingDirectionX === 'up') {
            swingOffsetTargetX = -random(0, swing.maxX);
            swingDirectionX = 'down';
        } else {
            swingOffsetTargetX = random(0, swing.maxX);
            swingDirectionX = 'up';
        }

        if (swingOffsetY < swingOffsetTargetY && swingDirectionY === 'right') {
            swingOffsetY += swing.speedY;
        } else if (swingOffsetY > swingOffsetTargetY && swingDirectionY === 'left') {
            swingOffsetY -= swing.speedY;
        } else if (swingDirectionY === 'right') {
            swingOffsetTargetY = -random(0, swing.maxY);
            swingDirectionY = 'left';
        } else {
            swingOffsetTargetY = random(0, swing.maxY);
            swingDirectionY = 'right';
        }

        if (speedOffset < speedTarget && speedDirection === 'faster') {
            speedOffset += road.speedIncrement;
        } else if (speedOffset > speedTarget && speedDirection === 'slower') {
            speedOffset -= road.speedIncrement;
        } else if (speedDirection === 'faster') {
            speedTarget = -random(0, road.speedIncrementMax);
            speedDirection = 'slower';
        } else {
            speedTarget = random(0, road.speedIncrementMax);
            speedDirection = 'faster';
        }

        roadGroup.rotation.x = (swingOffsetX / 100000);
        roadGroup.rotation.y = (swingOffsetY / 100000);

        // var euler2 = new THREE.Euler( swingOffsetX / 100000, swingOffsetY / 100000, 0, 'XYZ' );
        // roadGroup.position.applyEuler(euler2);


        roadGroup.position.x = swayOffsetX;
        roadGroup.position.y = swayOffsetY;

        roadGroup.position.z += road.speed + speedOffset;

        textMesh1.position.z += road.speed + speedOffset;

        if (textMesh1.position.z > 0) {
            textMesh1.position.z = -20000;
        }

        dist = Math.floor(roadGroup.position.z / slabs.h);

        if (dist > prev_dist) {
            progress++;

            if (progress > Math.floor(slabs.count * 0.8)) {
                console.log('loop');
                progress = prev_dist = 0;
                roadGroup.position.z = 0;

            } else {
                prev_dist = dist;
            }
        }

        // if (textMesh1.position.z >= camera.position.z - 1000) {
        //     textMesh1.position.z = camera.position.z - 1000;

        //     var centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);

        //     textMesh1.position.x = centerOffset + swayOffsetX;
        //     textMesh1.position.y = 130 + swayOffsetY;
        // }

        if (effects) {
            composer.render(0.1);
        } else {
            render();
        }
    }
}

function render() {
    renderer.render(scene, camera);
}

function tweak_focus(_on) {
    setTimeout(function() {
        var tweak_int = setInterval(function() {
            if (_on) {
                focusPass.uniforms.waveFactor.value += 0.01;
            } else {
                focusPass.uniforms.waveFactor.value -= 0.01;
            }

            if (focusPass.uniforms.waveFactor.value >= 0.1) {
                _on = false;
            } else if (focusPass.uniforms.waveFactor.value <= 0.001) {
                clearInterval(tweak_int);
            }
        }, 100);

        tweak_focus(true);

    }, random(10000, 40000));
}

function load_potholes() {
    for (var i in potholes.textures) {
        potholes.textures[i].map = THREE.ImageUtils.loadTexture('img/' + potholes.textures[i].filename);
    }
}

function generate_pothole() {
    setTimeout(function() {
        cleanup_potholes();

        if (potholes.potholes.length < 50) {
            var texture = potholes.textures[random(0, potholes.textures.length - 1)];

            var pothole_material = new THREE.MeshPhongMaterial({
                ambient: 0x444444,
                specular: 0x000000,
                shading: THREE.SmoothShading,
                map: texture.map,
                transparent: true,
                opacity: 0.8
            });

            var pothole_scale = random(3, 6);

            var pw = (texture.w / pothole_scale);
            var ph = (texture.h / pothole_scale);
            pothole_geometry = new THREE.PlaneGeometry(pw, ph);

            var pothole = new THREE.Mesh(pothole_geometry, pothole_material);

            pothole.rotation.x = -Math.PI/2;
            // pothole.position.applyEuler(euler);

            var px = random(-((slabs.w * 0.5) + pw), (slabs.w * 0.5) - pw);
            pothole.position.x = px;
            pothole.position.y = potholes.y;
            pothole.position.z = -roadGroup.position.z - 6000;

            potholes.potholes.push(pothole);
            roadGroup.add(pothole);
        }

        generate_pothole();

    }, random(500, 2000));
}

function cleanup_potholes() {
    for (var i = potholes.potholes.length - 1; i > -1; i--) {
        var pothole = potholes.potholes[i];
        if (pothole !== undefined) {
            if (-roadGroup.position.z > pothole.position.z) {
                potholes.potholes.splice(i, 1);
                roadGroup.remove(pothole);
            }
        }
    }
}

function random(from, to) {
    return Math.floor(Math.random() * (to - from + 1) + from);
}

function difference(a, b) {
    return Math.abs(a - b);
}
