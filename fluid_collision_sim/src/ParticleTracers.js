import * as THREE from 'three';

/**
 * Injects particles onto the canvas whose movement is defined by the velocities in the velocityField.
 * Used to visualize fluid flow as an alternative to the advected dye visualization.
 */
export default class ParticleTracers {
    constructor(num_particles, gridRes) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
        this.numP = num_particles;
        this.gridRes = gridRes;

        this.uniforms = {
            time: { type: "f" },
            res: {type: "v2", value: this.gridRes},
            velocityField: { type: "t"}
        }

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: document.getElementById( 'particleVert' ).innerHTML,
            fragmentShader: document.getElementById( 'particleFrag' ).innerHTML,
            transparent: true,
            depthWrite: false,
            depthTest: false
        })

        this.positions = [];
        this.lifespan = [];
        this.offset = [];
        for (let i = 0; i < this.numP; i++) {
            this.positions.push(THREE.MathUtils.randFloatSpread( 10 ) * 0.2, THREE.MathUtils.randFloatSpread( 10 ) * 0.2, 0.0);
            this.lifespan.push(THREE.MathUtils.randFloatSpread(10) * 5);
            this.offset.push(THREE.MathUtils.randFloatSpread(10) * 1000);
        }

        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('lifespan', new THREE.Float32BufferAttribute(this.lifespan, 1));
        this.geometry.setAttribute('offset', new THREE.Float32BufferAttribute(this.offset, 1))

        this.particles = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.particles);

        this.clearPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(window.innerWidth, window.innerHeight),
            new THREE.MeshBasicMaterial({
                transparent: true,
                color: 0xffffff,
                opacity: 0.1
            })
        )

        this.scene.add(this.clearPlane);
    }

    renderToTarget(renderer, input, output, dt) {
        this.renderer = renderer;
        this.uniforms.time = dt;
        this.uniforms.velocityField = input;

        this.renderer.setRenderTarget(output);
        this.renderer.render(this.scene, this.camera);
        this.renderer.setRenderTarget(null);
    }
}