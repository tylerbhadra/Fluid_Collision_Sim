import * as THREE from 'three';
import AttributeField from './AttributeField.js';
import ParticleTracers from './ParticleTracers.js';
import ConfigInator from './Config-inator.js';
import GridCellRender from './GridCellRender.js';
import ParticleSim from './ParticleSim.js';
import ParticleRender from './ParticleRender.js';

var scene, camera, renderer, dt;
const BOX_SIZE = 4;
var grid, gridHelper;
var grid_resolution = new THREE.Vector2(512, 256);

/* Attribute Fields */
var velocityField;
var boundaryField;

/* Simulation shader loaders */
var v_conf_inator;
var particleTracers;

/* Particle simulation shader & particle position buffer */
var particleSim;
var particlePositions;

/* Shader loaders for final render + texture variables */
var particleRender;
var gridCellRender;
var particleTex;
var gridCellTex;

/* Variables for canvas/screen render */
var canvasTex;
var canvasMaterial;
var canvasGeometry;
var canvas;

var displayConfig = {
    // BASIC DISPLAY OPTIONS WITH PLACEHOLDER VALUES -> ADD MORE + DECIDE ON DEFAULT VALUES LATER
    CURL: 1,
    PRESSURE: 1,
    PRESSURE_ITERATIONS: 10,
    PAUSED: false,
    NUM_PARTICLES: 15000,
    PARTICLES_ON: true,
    SHOW_GRID: false, //For debugging
    // Cont.
    // TODO
};


class GridBox {
    constructor() {
        //TODO: add grid properties here
        this.velocity = 0;
        this.density = 0;
        this.vorticity = 0;
    }
}


initGUI();
initScene();
initGrid();
init_attrib_fields();

function initGUI() {
    var gui = new dat.GUI( { width: 300 } );

    // Add display options and toggleables here
    gui.add(displayConfig, 'CURL').name("Curl");
    gui.add(displayConfig, 'PRESSURE').name("Pressure");
    gui.add(displayConfig, 'PRESSURE_ITERATIONS', 0, 10).name("Pressure Iterations");
    gui.add(displayConfig, 'PARTICLES_ON').name("Toggle Particles?");
    gui.add(displayConfig, 'PAUSED').name("Pause?");
    gui.add(displayConfig, 'SHOW_GRID').name("Grid");
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
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    displayConfig.PAUSED = false;
    dt = 0;
}


function initGrid() {
    var gridWidth = window.innerWidth;
    var gridHeight = window.innerHeight;
    //n by n pixel box per grid square
    //+1 might push it off the screen but doesn't really matter, and it 
    //prevents it being short
    grid = new Array(Math.floor(gridHeight/BOX_SIZE) + 1);
    for (var i = 0; i < grid.length; i++) {
        grid[i] = new Array(Math.floor(gridWidth/BOX_SIZE) + 1);
        for (var j = 0; j < grid[i].length; j++) {
            var newGridBox = new GridBox();
            grid[i][j] = newGridBox;
        }
    }
    var size = gridWidth/4;
    var divisions = grid.length;
    //gridHelper is not directly tied to grid, this is currently just for display purposes
    //gridHelper is currently forced to be a square, which is inefficient unless you're using
    //a square window. Might refactor into a rectangle later but it's not a simple 
    //implementation like calling gridhelper is.
    gridHelper = new THREE.GridHelper( size, divisions );
}

/* Get the grid square tied to the (x, y) coordinate. 
    If only 1 argument, get the square in row major order. */
function getGridSquare(x, y) {
    if(typeof y !== "undefined") {
        return grid[y][x];
    }
    var row = Math.floor(x/(grid[0].length));
    var col = x - row * grid[0].length;
    return grid[row][col];
}

function init_attrib_fields() {

    /* Initialize attribute fields */
    velocityField = new AttributeField(grid_resolution);
    boundaryField = new AttributeField(grid_resolution);

    /* This just initializes the velocityField with v = < 1,0,0,1 > (i.e fluid initially flows to the right) */
    v_conf_inator = new ConfigInator(grid_resolution);
    v_conf_inator.configure_field(renderer, velocityField.read_buf);

    /* Initialize fluid simulation shader loaders */

    /* Initialize particle simulation shader loader and particle positions buffer */
    // particleTracers = new ParticleTracers(displayConfig.NUM_PARTICLES, grid_resolution);
    var particleSpan = Math.sqrt(displayConfig.NUM_PARTICLES);
    var particleSpanVec2 = new THREE.Vector2(particleSpan, particleSpan);
    particleSim = new ParticleSim(grid_resolution, particleSpan, 1.0);
    particlePositions = new AttributeField(particleSpanVec2);
    // particlePositions = new THREE.WebGLRenderTarget( particleSpan, particleSpan, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, type: THREE.FloatType });

    /* Initialize the shader loaders for the canvas/screen render */
    particleRender = new ParticleRender(grid_resolution, displayConfig.NUM_PARTICLES);
    gridCellRender = new GridCellRender(grid_resolution);
    particleTex = new THREE.WebGLRenderTarget( grid_resolution.x, grid_resolution.y, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, type: THREE.FloatType });
    gridCellTex = new THREE.WebGLRenderTarget( grid_resolution.x, grid_resolution.y, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, type: THREE.FloatType });


    /* This is for the actual render to the canvas. The canvasTex will be written to by the gridCellRender (which runs the
       shader that visualizes one of the grid attributes as colored cells in the grid) or particleRender (which loads the shader
       that visualizes the movement of the fluid using particles) */
    // canvasTex = gridCellTex.texture;
    canvasGeometry = new THREE.PlaneGeometry( 2, 2 );
    canvasMaterial =  new THREE.MeshBasicMaterial({map: gridCellTex.texture});
    canvas = new THREE.Mesh( canvasGeometry, canvasMaterial );
    scene.add(canvas);
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

// let particleMaterial = new THREE.ShaderMaterial({
//     uniforms: {
//         time: { type: "f", value: dt },
//         velocity: { type: "f", value: 2.2 }
//     },
//     vertexShader: document.getElementById( 'particleVert' ).innerHTML,
//     fragmentShader: document.getElementById( 'particleFrag' ).innerHTML,
//     transparent: true,
//     depthWrite: false,
//     depthTest: false
// });
// let numP = displayConfig.NUM_PARTICLES;
// let positions = [];
// let lifespan = [];
// let offset = [];

// for (let i = 0; i < numP; i++) {
//     positions.push(THREE.MathUtils.randFloatSpread( 2000 ) * 0.2, THREE.MathUtils.randFloatSpread( 2000 ) * 0.2, 0.0);
//     lifespan.push(THREE.MathUtils.randFloatSpread(10) * 5);
//     offset.push(THREE.MathUtils.randFloatSpread(30) * 1000)
// }

// let geometry = new THREE.BufferGeometry();
// geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
// geometry.setAttribute('lifespan', new THREE.Float32BufferAttribute(lifespan, 1));
// geometry.setAttribute('offset', new THREE.Float32BufferAttribute(offset, 1))

// let particles = new THREE.Points(geometry, particleMaterial);
// scene.add(particles);
// gridHelper.rotation.x=Math.PI/2;
// // scene.add(gridHelper);

// let clearPlane = new THREE.Mesh(
//     new THREE.PlaneGeometry(window.innerWidth, window.innerHeight),
//     new THREE.MeshBasicMaterial({
//         transparent: true,
//         color: 0xffffff,
//         opacity: 0.1
//     })
// )

// scene.add(clearPlane);

///////////////////////////////
//// END OF PARTICLE STUFF ////
///////////////////////////////

// var obstacleScene = new THREE.Scene();
// let circle_geometry = new THREE.CircleGeometry( 10, 32 );
// let circle_material = new THREE.ShaderMaterial({
//     uniforms: {
//         time: { type: "f", value: dt },
//         boundaryField: { type: "t", value: boundaryField }
//     },
//     fragmentShader: document.getElementById( 'boundaryFrag' ).innerHTML,
//     transparent: true,
//     depthWrite: false,
//     depthTest: false
// });
// const circle = new THREE.Mesh( circle_geometry, circle_material );
// obstacleScene.add( circle );

function render() {
    /* Implement main simulation step below, update relevant grids/buffers */
    if (!displayConfig.PAUSED) {
    
        /* START 

        Update grid attribute fields here

        END */

        /* Update particle states */
        particleSim.renderToTarget(renderer, velocityField.read_buf, particlePositions.write_buf, 1.0);
        particlePositions.update_read_buf();
        particleSim.update_positions(particlePositions.read_buf);

        /* Render updated scene to approriate texture render targets. */
        particleRender.renderToTarget(renderer, particlePositions.read_buf, particleTex);
        gridCellRender.renderToTarget(renderer, velocityField.read_buf, gridCellTex);
    }

    if (displayConfig.PARTICLES_ON) {
        canvasMaterial.map = particleTex.texture;
    } else {
        canvasMaterial.map = gridCellTex.texture;
    }

    renderer.render(scene, camera);

    requestAnimationFrame(render);
    // gridHelper.visible = displayConfig.SHOW_GRID;
}

render()