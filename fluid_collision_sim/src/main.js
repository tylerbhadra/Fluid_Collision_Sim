import * as THREE from 'three';
import AttributeField from './AttributeField.js';
import ParticleTracers from './ParticleTracers.js';
import ConfigInator from './Config-inator.js';
import GridCellRender from './GridCellRender.js';

var scene, camera, renderer, dt;
const BOX_SIZE = 4;
var grid, gridHelper;
var grid_resolution = new THREE.Vector2(512, 256);

// Attribute Fields
var velocityField;
var boundaryField;
var particlePosField;

// Shaders
var v_conf_inator;
var particleTracers;
var finalRender;

// Variables for final render
var finalTexture;
var finalMaterial;
var finalGeometry;
var plane;

var displayConfig = {
    // BASIC DISPLAY OPTIONS WITH PLACEHOLDER VALUES -> ADD MORE + DECIDE ON DEFAULT VALUES LATER
    CURL: 1,
    PRESSURE: 1,
    PRESSURE_ITERATIONS: 10,
    PAUSED: false,
    NUM_PARTICLES: 150000,
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
    gui.add(displayConfig, 'NUM_PARTICLES', 10000, 15000).name("Number of Particles");
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
    document.body.appendChild(renderer.domElement);

    // camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    // camera.position.set( 0, 0, 100 );
    // camera.lookAt( 0, 0, 0 );

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

    // Initialize attribute fields
    velocityField = new AttributeField(grid_resolution);
    boundaryField = new AttributeField(grid_resolution);
    particlePosField = new AttributeField(grid_resolution);

    // This just initializes the velocityField with v = < 1,0,0,1 > (i.e fluid initially flows to the right)
    v_conf_inator = new ConfigInator(grid_resolution);
    v_conf_inator.configure_field(renderer, velocityField.read_buf);

    // Initialize shaders
    particleTracers = new ParticleTracers(displayConfig.NUM_PARTICLES, grid_resolution);
    // particleSim = new ParticleSim(grid_resolution)
    finalRender = new GridCellRender(grid_resolution);

    // This is for the actual render to the canvas. The finalTexture will be set equal to the values one of the attribute fields
    finalTexture = new THREE.WebGLRenderTarget( grid_resolution.x, grid_resolution.y, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, type: THREE.FloatType });
    finalGeometry = new THREE.PlaneGeometry( 2, 2 );
    finalMaterial =  new THREE.MeshBasicMaterial({map: finalTexture.texture});
    // finalMaterial = new THREE.ShaderMaterial({
    //     fragmentShader: document.getElementById( 'configVelocityFrag' ).innerHTML,
    //     depthWrite: false,
    //     depthTest: false,
    //     blending: THREE.NoBlending
    // })
    plane = new THREE.Mesh( finalGeometry, finalMaterial );
    scene.add(plane);
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
    // Probably implement main simulation step below, update relevant grids/buffers
    // TODO
    // particleTracers.renderToTarget(renderer, velocityField.read_buf, null, dt)
    // particlePosField.update_read_buf();

    // Render updated scene.


    // if (!displayConfig.PAUSED) {
    //     dt += 0.5;
    //     particleMaterial.uniforms.time.value = dt;
    //     renderer.render(scene, camera);  
    //     // renderer.render(obstacleScene, camera); 
    // }
    
    if (!displayConfig.PAUSED) {
        finalRender.renderToTarget(renderer, velocityField.read_buf, finalTexture);
        renderer.render(scene, camera);
    }
    gridHelper.visible = displayConfig.SHOW_GRID;
    requestAnimationFrame(render);
}

render()