import * as THREE from 'three';
import AttributeField from './AttributeField.js';
import ConfigInator from './Config-inator.js';
import GridCellRender from './GridCellRender.js';
import ParticleSim from './ParticleSim.js';
import ParticleRender from './ParticleRender.js';
import ParticleAge from './ParticleAge.js';
import Advector from './Advect.js';

var scene, camera, renderer;
var grid_resolution = new THREE.Vector2(512, 256);

/* Attribute Fields */
var velocityField;
var boundaryField;

/* Simulation shader loaders */
var v_conf_inator;
var advector;

/* Particle simulation shader & particle position buffer */
var particleAge;
var particleSim;
var particlePositions;
var particleAgeState;

/* Shader loaders for final render + texture variables */
var particleRender;
var gridCellRender;
var particleTex;
var gridCellTex;

/* Variables for canvas/screen render */
var canvasMaterial;
var canvasGeometry;
var canvas;

var displayConfig = {
    // BASIC DISPLAY OPTIONS WITH PLACEHOLDER VALUES -> ADD MORE + DECIDE ON DEFAULT VALUES LATER
    CURL: 1,
    PRESSURE: 1,
    PRESSURE_ITERATIONS: 10,
    PAUSED: false,
    NUM_PARTICLES: 36000,
    NUM_RENDER_STEPS: 5,
    MAX_PARTICLE_AGE: 100,
    DELTA_TIME:  1.0,
    PARTICLES_ON: true,
    // Cont.
    // TODO
};

function initGUI() {
    var gui = new dat.GUI( { width: 300 } );

    // Add display options and toggleables here
    gui.add(displayConfig, 'CURL').name("Curl");
    gui.add(displayConfig, 'PRESSURE').name("Pressure");
    gui.add(displayConfig, 'PRESSURE_ITERATIONS', 0, 10).name("Pressure Iterations");
    gui.add(displayConfig, 'PARTICLES_ON').name("Toggle Particles?");
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
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
}

function init_attrib_fields() {

    /* Initialize attribute fields */
    velocityField = new AttributeField(grid_resolution);
    boundaryField = new AttributeField(grid_resolution);

    /* This just initializes the velocityField with v = < 1,0,0,1 > (i.e fluid initially flows to the right) */
    v_conf_inator = new ConfigInator(grid_resolution);
    v_conf_inator.configure_field(renderer, velocityField.read_buf);
    v_conf_inator.configure_field(renderer, velocityField.write_buf);

    /* Initialize fluid simulation shader loaders */
    advector = new Advector(grid_resolution);

    /* Initialize particle simulation shader loader, particle positions buffer and particle age buffer */
    var particleSpan = Math.sqrt(displayConfig.NUM_PARTICLES);
    var particleSpanVec2 = new THREE.Vector2(particleSpan, particleSpan);
    particleSim = new ParticleSim(grid_resolution, particleSpan, displayConfig.NUM_RENDER_STEPS, displayConfig.DELTA_TIME);
    particleAge = new ParticleAge(grid_resolution, displayConfig.MAX_PARTICLE_AGE, particleSpan, displayConfig.DELTA_TIME);
    particlePositions = new AttributeField(particleSpanVec2);
    particleAgeState = new AttributeField(particleSpanVec2);

    /* Initialize the shader loaders for the canvas/screen render */
    particleRender = new ParticleRender(grid_resolution, displayConfig.NUM_PARTICLES);
    gridCellRender = new GridCellRender(grid_resolution);
    particleTex = new THREE.WebGLRenderTarget( grid_resolution.x, grid_resolution.y, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, type: THREE.FloatType });
    gridCellTex = new THREE.WebGLRenderTarget( grid_resolution.x, grid_resolution.y, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, type: THREE.FloatType });


    /* This is for the actual render to the canvas. The canvasTex will be written to by the gridCellRender (which runs the
       shader that visualizes one of the grid attributes as colored cells in the grid) or particleRender (which loads the shader
       that visualizes the movement of the fluid using particles) */
    canvasGeometry = new THREE.PlaneGeometry( 2, 2 );
    canvasMaterial =  new THREE.MeshBasicMaterial({map: particleTex.texture});
    canvas = new THREE.Mesh( canvasGeometry, canvasMaterial );
    scene.add(canvas);
}

function render() {
    /* Implement main simulation step below, update relevant grids/buffers */
    if (!displayConfig.PAUSED) {
    
        /* Update grid attributes here */
        advector.advect_texture(renderer, velocityField.read_buf, velocityField.read_buf, 1.0, 1.0, velocityField.write_buf);
        velocityField.update_read_buf();

        /* Age particles */
        particleAge.renderToTarget(renderer, particleAgeState.write_buf);
        particleAgeState.update_read_buf();
        particleAge.update_ages(particleAgeState.read_buf);

        /* Advect particles using forward integration with velocityField */
        for (let i = 0; i < displayConfig.NUM_RENDER_STEPS; i++) {

            /* Render to particle texture displayConfig.NUM_RENDER_STEPS times for smoother trails in the case that a 
               particle travels more than 1px in one timestep */
            particleSim.renderToTarget(renderer, velocityField.read_buf, particleAgeState.read_buf, particlePositions.write_buf);
            particlePositions.update_read_buf();
            particleSim.update_positions(particlePositions.read_buf);

            /* Render particlePositions to the particleTex render target. */
            particleRender.renderToTarget(renderer, particlePositions.read_buf, particleTex);
        }

        /* Render the desired grid attribute values to the gridCellTex render target. */
        gridCellRender.renderToTarget(renderer, velocityField.read_buf, gridCellTex);
    }

    if (displayConfig.PARTICLES_ON) {
        canvasMaterial.map = particleTex.texture;
    } else {
        canvasMaterial.map = gridCellTex.texture;
    }

    renderer.render(scene, camera);

    requestAnimationFrame(render);
}

initGUI();
initScene();
init_attrib_fields();
render()