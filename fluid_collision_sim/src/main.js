import * as THREE from 'three';

var scene, camera, renderer, dt;

var displayConfig = {
    // BASIC DISPLAY OPTIONS WITH PLACEHOLDER VALUES -> ADD MORE + DECIDE ON DEFAULT VALUES LATER
    CURL: 1,
    PRESSURE: 1,
    PRESSURE_ITERATIONS: 10,
    PAUSED: false,
    NUM_PARTICLES: 150000
    // Cont.
    // TODO
};

initGUI();
initScene();

function initGUI() {
    var gui = new dat.GUI( { width: 300 } );

    // Add display options and toggleables here
    gui.add(displayConfig, 'CURL').name("Curl");
    gui.add(displayConfig, 'PRESSURE').name("Pressure");
    gui.add(displayConfig, 'PRESSURE_ITERATIONS', 0, 10).name("Pressure Iterations");
    gui.add(displayConfig, 'NUM_PARTICLES', 10000, 15000).name("Number of Particles");
    gui.add(displayConfig, 'PAUSED').name("Pause?");
    // Cont.
    // TODO
}

function initScene() {
    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha : true,
        preserveDrawingBuffer: true 
    });
    renderer.autoClear = false;
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set( 0, 0, 100 );
    camera.lookAt( 0, 0, 0 );

    displayConfig.PAUSED = false;
    dt = 0;
}

function start() {
    displayConfig.PAUSED = false;
}

function stop() {
    displayConfig.PAUSED = true;
}



//////////////////////////////////////////////////////////////////////////////
//// PARTICLE STUFF, PURELY FOR VISUALS, NOT NEEDED FOR GRID COMPUTATIONS ////
//////////////////////////////////////////////////////////////////////////////

// Will modularize this later and rework shader logic to update particle positions based on the 
// velocity vectors in the velocity field/grid

let particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { type: "f", value: dt },
        velocity: { type: "f", value: 2.2 }
    },
    vertexShader: document.getElementById( 'particleVert' ).innerHTML,
    fragmentShader: document.getElementById( 'particleFrag' ).innerHTML,
    transparent: true,
    depthWrite: false,
    depthTest: false
});
let numP = displayConfig.NUM_PARTICLES;
let positions = [];
let lifespan = [];
let offset = [];

for (let i = 0; i < numP; i++) {
    positions.push(THREE.MathUtils.randFloatSpread( 2000 ) * 0.2, THREE.MathUtils.randFloatSpread( 2000 ) * 0.2, 0.0);
    lifespan.push(THREE.MathUtils.randFloatSpread(10) * 5);
    offset.push(THREE.MathUtils.randFloatSpread(30) * 1000)
}

let geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
geometry.setAttribute('lifespan', new THREE.Float32BufferAttribute(lifespan, 1));
geometry.setAttribute('offset', new THREE.Float32BufferAttribute(offset, 1))

let particles = new THREE.Points(geometry, particleMaterial);
scene.add(particles);

let clearPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(window.innerWidth, window.innerHeight),
    new THREE.MeshBasicMaterial({
        transparent: true,
        color: 0xffffff,
        opacity: 0.05
    })
)

scene.add(clearPlane);

///////////////////////////////
//// END OF PARTICLE STUFF ////
///////////////////////////////

function render() {
    // Probably implement main simulation step below, update relevant grids/buffers
    // TODO

    // Render updated scene.
    if (!displayConfig.PAUSED) {
        dt += 0.5;
        particleMaterial.uniforms.time.value = dt;
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    } else {
        return;
    }
}

render();