import * as THREE from 'three';
import AttributeField from './AttributeField.js';
import GridCellRender from './GridCellRender.js';
import ParticleSim from './ParticleSim.js';
import ParticleRender from './ParticleRender.js';
import ParticleAge from './ParticleAge.js';
import Advector from './Advect.js';
import ExternalForce from './External-Forces.js';
import Divergence from './Divergence.js';
import Jacobi from './Jacobi.js';
import Gradient from './Gradient.js';
import Boundary from './Boundary.js';
import BoundaryRender from './BoundaryRender.js';
import ArbitraryBoundary from './Arbitrary-Boundaries.js';

var fluidScene, camera, renderer;
var grid_resolution = new THREE.Vector2(640, 360);

/* Attribute Fields */
var velocityField;
var divergenceField;
var boundaryField;
var pressureField;

/* Simulation shader loaders */
var advector;
var externalVelocity;
var arbitraryBoundary;
var divergence2D;
var jacobi;
var projector;
var boundary;

/* Particle simulation shader & particle position buffer */
var particleAge;
var particleSim;
var particlePositions;
var particleAgeState;

/* Shader loaders for final render + texture variables */
var particleRender;
var gridCellRender;
var boundaryRender;
var particleTex;
var gridCellTex;
var velocityCellScale;
var velocityCellBias;
var pressureCellScale;
var pressureCellBias;
var divergenceCellScale;
var divergenceCellBias;

/* Variables for canvas/screen render */
var canvasMaterial;
var canvasGeometry;
var canvas;
var canvasTex;

var displayConfig = {
    /* Initial display values and configuration terms */
    JACOBI_ITERATIONS: 30,
    PAUSED: false,
    NUM_PARTICLES: 49000,
    NUM_RENDER_STEPS: 5,
    MAX_PARTICLE_AGE: 100,
    V_SCALE: 30,
    DELTA_TIME: 1.0,
    PARTICLES_ON: true,
    VISCOUS_DIFFUSION_ON: false,
    INPUT_MODE: "Drag Fluid",
    LAYER: "Fluid",
    RADIUS: 4,
    RESET_FLUID: false,
    CLEAR_BOUNDARIES: false,
    VISCOSITY: 5
};

function clearBoundFunc() {
    displayConfig.CLEAR_BOUNDARIES = true;
}

function resetFluidFunc() {
    displayConfig.RESET_FLUID = true;
}

var buttonFuncs = {
    CLEAR_BOUND_FUNC: clearBoundFunc,
    RESET_FLUID_FUNC: resetFluidFunc
};

function initGUI() {
    var gui = new dat.GUI( { width: 350 } );

    /* Display options */
    gui.add(displayConfig, 'V_SCALE', 20, 100).name("Particle Speed");
    gui.add(displayConfig, 'NUM_PARTICLES', 10000, 100000).name("Particle Count");
    gui.add(displayConfig, 'JACOBI_ITERATIONS', 20, 60).name("Jacobi Iterations");
    gui.add(displayConfig, 'VISCOSITY', 0, 30).name("Viscous Diffusion Iterations");
    gui.add(displayConfig, 'RADIUS', 2, 10).name("Radius/Brush Size");
    gui.add(displayConfig, 'INPUT_MODE', [
        "Drag Fluid",
        "Draw Boundaries",
        "Erase Boundaries"
    ]).name("Input Mode");
    gui.add(displayConfig, "LAYER", [
        "Fluid",
        "Velocity",
        "Pressure",
        "Divergence"
    ]).name("Layer");
    gui.add(displayConfig, 'VISCOUS_DIFFUSION_ON').name("Enable Viscous Diffusion");
    gui.add(displayConfig, 'PAUSED').name("Pause");
    gui.add(buttonFuncs, 'RESET_FLUID_FUNC').name("Reset Fluid");
    gui.add(buttonFuncs, 'CLEAR_BOUND_FUNC').name("Clear Boundaries");
}

function initScene() {
    fluidScene = new THREE.Scene();

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

function initAttributeFields() {

    /* Initialize attribute fields */
    velocityField = new AttributeField(grid_resolution);
    divergenceField = new AttributeField(grid_resolution);
    pressureField = new AttributeField(grid_resolution);
    boundaryField = new AttributeField(grid_resolution);
    velocityCellScale = new THREE.Vector3(2.0, 2.0, 2.0);
    velocityCellBias = new THREE.Vector3(0.6, 0.6, 0.6);
    pressureCellScale = new THREE.Vector3(4.0, 4.0, 4.0);
    pressureCellBias = new THREE.Vector3(0.6, 0.6, 0.6);
    divergenceCellScale = new THREE.Vector3(4.0, 4.0, 4.0);
    divergenceCellBias = new THREE.Vector3(0.6, 0.6, 0.6);
}

function initParticles() {
    /* Initialize particle simulation shader loader, particle positions buffer and particle age buffer */
    var particleSpan = Math.sqrt(displayConfig.NUM_PARTICLES);
    var particleSpanVec2 = new THREE.Vector2(particleSpan, particleSpan);
    particleSim = new ParticleSim(grid_resolution, particleSpan, displayConfig.NUM_RENDER_STEPS, displayConfig.DELTA_TIME);
    particleAge = new ParticleAge(grid_resolution, displayConfig.MAX_PARTICLE_AGE, particleSpan, displayConfig.DELTA_TIME);
    particlePositions = new AttributeField(particleSpanVec2);
    particleAgeState = new AttributeField(particleSpanVec2);

    /* Initialize shader loader and texture for rendering particles */
    particleRender = new ParticleRender(grid_resolution, displayConfig.NUM_PARTICLES);
    particleTex = new THREE.WebGLRenderTarget( grid_resolution.x, grid_resolution.y, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, type: THREE.FloatType });
}

function initShaderLoaders() {
    /* Initialize fluid simulation shader loaders */
    advector = new Advector(grid_resolution);
    externalVelocity = new ExternalForce(grid_resolution);
    arbitraryBoundary = new ArbitraryBoundary(grid_resolution);
    divergence2D = new Divergence(grid_resolution);
    jacobi = new Jacobi(grid_resolution);
    projector = new Gradient(grid_resolution);
    boundary = new Boundary(grid_resolution);

    /* Initialize the shader loaders for the canvas/screen render */
    boundaryRender = new BoundaryRender(grid_resolution);
    gridCellRender = new GridCellRender(grid_resolution);
    gridCellTex = new THREE.WebGLRenderTarget( grid_resolution.x, grid_resolution.y, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, type: THREE.FloatType });

    /* This is for the actual render to the canvas. The canvasTex will be written to by boundaryRender, which takes in
       a texture created by gridCellRender (which runs the shader that visualizes one of the grid attributes as
       colored cells in the grid) or particleRender (which loads the shader that visualizes the movement of the fluid 
       using particles) and overlays gray boundary cells onto that texture, storing the new consolidated texture in
       canvasTex. */
    canvasTex = new THREE.WebGLRenderTarget( grid_resolution.x, grid_resolution.y, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, type: THREE.FloatType });
    canvasGeometry = new THREE.PlaneGeometry( 2, 2 );
    canvasMaterial =  new THREE.MeshBasicMaterial({map: canvasTex.texture});
    canvas = new THREE.Mesh( canvasGeometry, canvasMaterial );
    fluidScene.add(canvas);
}

/* INTERACTABLITY */
var prevTime = null;
var lastX = null;
var lastY = null;
function UpdateMousePosition(X,Y){
    var currentTime = Date.now();
    var deltaTime = currentTime - prevTime;

    externalVelocity.source.x = X * grid_resolution.x / window.innerWidth;
    externalVelocity.source.y = Y * grid_resolution.y / window.innerHeight;

    externalVelocity.sourceDirection.x = Math.round((X-lastX) / deltaTime * 100);
    externalVelocity.sourceDirection.y = Math.round((Y-lastY) / deltaTime * 100);

    arbitraryBoundary.source.x = X * grid_resolution.x / window.innerWidth;
    arbitraryBoundary.source.y = Y * grid_resolution.y / window.innerHeight;

    prevTime = currentTime;
    lastX = X;
    lastY = Y;
}

document.onmousemove = function(event){
    UpdateMousePosition(event.clientX, window.innerHeight - event.clientY);
}

document.onmousedown = function(event) {
    prevTime = Date.now();
    lastX = event.clientX;
    lastY = window.innerHeight - event.clientY;
    externalVelocity.source.z = 1.0;
    arbitraryBoundary.source.z = 1.0;
}

document.onmouseup = function(event) {
    externalVelocity.source.z = 0;
    arbitraryBoundary.source.z = 0;
}

function resetFluid() {
    initParticles();
    renderer.setRenderTarget(velocityField.read_buf);
    renderer.clear();
    renderer.setRenderTarget(pressureField.read_buf);
    renderer.clear();
    renderer.setRenderTarget(divergenceField.read_buf);
    renderer.clear();
    renderer.setRenderTarget(null);
}

function clearBoundaries() {
    renderer.setRenderTarget(boundaryField.read_buf);
    renderer.clear();
    renderer.setRenderTarget(null);
}

/* MAIN SIMULATION LOOP */
function runSimulation() {
    /* Implement main simulation step below, update relevant grids/buffers */
    if (!displayConfig.PAUSED) {

        /* Advect velocity through the fluid */
        advector.advect_texture(renderer, velocityField.read_buf, velocityField.read_buf, 0.999, 1.0, velocityField.write_buf);
        velocityField.update_read_buf();

        /* Diffusion Step */
        if (displayConfig.VISCOUS_DIFFUSION_ON) {
            for (let i = 0; i < displayConfig.VISCOSITY; i++) {
                jacobi.compute(renderer, 1.0, 0.2, velocityField.read_buf, velocityField.read_buf, velocityField.write_buf);
                velocityField.update_read_buf();
            }
        }   
        
        /* Apply external forces */
        if (displayConfig.INPUT_MODE === "Drag Fluid") {
            externalVelocity.apply_force(renderer, velocityField.read_buf, displayConfig.RADIUS, velocityField.write_buf);
            velocityField.update_read_buf();
        }

        /* Draw/Erase boundaries */
        if (displayConfig.INPUT_MODE === "Draw Boundaries") {
            arbitraryBoundary.draw_boundary(renderer, boundaryField.read_buf, displayConfig.RADIUS, 1.0, boundaryField.write_buf);
            boundaryField.update_read_buf();
        } else if (displayConfig.INPUT_MODE === "Erase Boundaries") {
            arbitraryBoundary.draw_boundary(renderer, boundaryField.read_buf, displayConfig.RADIUS, 0.0, boundaryField.write_buf);
            boundaryField.update_read_buf();
        }

        /* Apply no-slip velocity boundary conditions */
        boundary.setModeVelocity();
        boundary.apply_boundary_conditions(renderer, velocityField.read_buf, boundaryField.read_buf, velocityField.write_buf);
        velocityField.update_read_buf();

        /* Calculate the divergence of the intermediate velocity field. */
        divergence2D.compute_divergence(renderer, velocityField.read_buf, divergenceField.write_buf);
        divergenceField.update_read_buf();

        /* Using the divergence field, compute the pressure values within each grid cell using Jacobi iteration. */
        renderer.setRenderTarget(pressureField.read_buf);
        renderer.clear();
        renderer.setRenderTarget(null);
        for (let i = 0; i < displayConfig.JACOBI_ITERATIONS; i++) {
            jacobi.compute(renderer, -1.0, 0.25, pressureField.read_buf, divergenceField.read_buf, pressureField.write_buf);
            pressureField.update_read_buf();
        }

        /* Apply pure Neumann pressure boundary conditions */
        boundary.setModePressure();
        boundary.apply_boundary_conditions(renderer, pressureField.read_buf, boundaryField.read_buf, pressureField.write_buf);
        pressureField.update_read_buf();

        /* Projection step => Subract the pressure gradient from the intermediate velocity field to enforce incompressibility. */
        projector.subtract_gradient(renderer, pressureField.read_buf, velocityField.read_buf, velocityField.write_buf);
        velocityField.update_read_buf();

        /* Apply no-slip velocity boundary conditions */
        boundary.setModeVelocity();
        boundary.apply_boundary_conditions(renderer, velocityField.read_buf, boundaryField.read_buf, velocityField.write_buf);
        velocityField.update_read_buf();

        /* Age particles */
        particleAge.renderToTarget(renderer, particleAgeState.write_buf);
        particleAgeState.update_read_buf();
        particleAge.update_ages(particleAgeState.read_buf);

        /* Advect particles using forward integration with velocityField */
        for (let i = 0; i < displayConfig.NUM_RENDER_STEPS; i++) {

            /* Render to particle texture displayConfig.NUM_RENDER_STEPS times for smoother trails in the case that a 
               particle travels more than 1px in one timestep */
            particleSim.renderToTarget(renderer, velocityField.read_buf, particleAgeState.read_buf, displayConfig.V_SCALE, particlePositions.write_buf);
            particlePositions.update_read_buf();
            particleSim.update_positions(particlePositions.read_buf);

            /* Render particlePositions to the particleTex render target. */
            particleRender.renderToTarget(renderer, particlePositions.read_buf, velocityField.read_buf, particleTex);
        }

        /* Render boundaries on top of the desired fluid texture (i.e. particles, velocity, etc). Store in finalTex. */
        var toRender = displayConfig.LAYER;
        switch(toRender) {
            case "Fluid":
                displayConfig.PARTICLES_ON = true;
                boundaryRender.renderToTarget(renderer, particleTex, boundaryField.read_buf, canvasTex);
                break;
            case "Velocity":
                displayConfig.PARTICLES_ON = false;
                gridCellRender.renderToTarget(renderer, velocityField.read_buf, velocityCellScale, velocityCellBias, gridCellTex);
                boundaryRender.renderToTarget(renderer, gridCellTex, boundaryField.read_buf, canvasTex);
                break;
            case "Pressure":
                displayConfig.PARTICLES_ON = false;
                gridCellRender.renderToTarget(renderer, pressureField.read_buf, pressureCellScale, pressureCellBias, gridCellTex);
                boundaryRender.renderToTarget(renderer, gridCellTex, boundaryField.read_buf, canvasTex);
                break;
            case "Divergence":
                displayConfig.PARTICLES_ON = false;
                gridCellRender.renderToTarget(renderer, divergenceField.read_buf, divergenceCellScale, divergenceCellBias, gridCellTex);
                boundaryRender.renderToTarget(renderer, gridCellTex, boundaryField.read_buf, canvasTex);
                break;
            default:
                break;
        }
    }

    if (displayConfig.RESET_FLUID) {
        resetFluid();
        displayConfig.RESET_FLUID = false;
    }

    if (displayConfig.CLEAR_BOUNDARIES) {
        clearBoundaries();
        displayConfig.CLEAR_BOUNDARIES = false;
    }

    if (!displayConfig.RESET_FLUID && !displayConfig.CLEAR_BOUNDARIES) {
        renderer.render(fluidScene, camera);
    }

    requestAnimationFrame(runSimulation);
}

initGUI();
initScene();
initParticles();
initAttributeFields();
initShaderLoaders();
runSimulation();