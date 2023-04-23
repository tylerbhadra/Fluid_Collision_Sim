import * as THREE from 'three';

var scene, camera, renderer, dt;
const BOX_SIZE = 4;
var grid, gridHelper;

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
        this.velocity = 0.0;
        this.density = 0.0;
        this.vorticity = 0.0;
    }
}


initGUI();
initScene();
initGrid();

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

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set( 0, 0, 100 );
    camera.lookAt( 0, 0, 0 );

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
            newGridBox.velocity = i*j;
            grid[i][j] = newGridBox;
        }
    }
    var size = gridWidth/BOX_SIZE;
    var divisions = grid.length;
    //gridHelper is not directly tied to grid, this is currently just for display purposes
    //gridHelper is currently forced to be a square, which is inefficient unless you're using
    //a square window. Might refactor into a rectangle later but it's not a simple 
    //implementation like calling gridhelper is.
    gridHelper = new THREE.GridHelper( size, divisions );
    //I don't understand 3js so gonna focus on getting the grid math to work first
    //Display comes after
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
let grid_velocity = [];

for (let i = 0; i < numP; i++) {
    var newX = THREE.MathUtils.randFloatSpread( 2000 ) * 0.2;
    var newY = THREE.MathUtils.randFloatSpread( 2000 ) * 0.2;
    positions.push(newX, newY, 0.0);
    lifespan.push(THREE.MathUtils.randFloatSpread(10) * 5);
    offset.push(THREE.MathUtils.randFloatSpread(30) * 1000);
    //Need to figure out how to convert local position to on screen position 
    // or refactor grid to not be based on screen position
    var gridX = -1.0;
    var gridY = -1.0;
    // grid_velocity.push(getGridSquare(gridX, gridY).velocity);
    //Causes high x and y values (top right of screen) to have greater velocity
    var testScalingVelocity = Math.pow(1.25, ((newX)/25.0 + (newY)/25.0));
    grid_velocity.push(testScalingVelocity);
}

let geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
geometry.setAttribute('lifespan', new THREE.Float32BufferAttribute(lifespan, 1));
geometry.setAttribute('offset', new THREE.Float32BufferAttribute(offset, 1));
geometry.setAttribute('grid_velocity', new THREE.Float32BufferAttribute(grid_velocity, 1));

let particles = new THREE.Points(geometry, particleMaterial);
scene.add(particles);
gridHelper.rotation.x=Math.PI/2;
scene.add(gridHelper);

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
    }
    gridHelper.visible = displayConfig.SHOW_GRID;
    requestAnimationFrame(render);
}

render();