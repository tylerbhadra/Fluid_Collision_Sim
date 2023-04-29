import * as THREE from 'three';

/**
 * Simulates the movement of particles over the velocityField by updating the current positions
 * of the particles in the particleSimFrag shader and writing the output to a render target. Positions
 * are passed into the shader as a texture uniform and indexed by vUv. 
 */
export default class ParticleSim {
    constructor(res, particle_span, num_steps, dt) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );

        /* Store random initial particle positions as DataTexture (of floats, specifically) */
        var data = this.initParticlePositions( particle_span );
        var positions = new THREE.DataTexture( data, particle_span, particle_span, THREE.RGBAFormat, THREE.FloatType );
        positions.needsUpdate = true;

        this.uniforms = {
            gridRes: {type: "v2", value: res},
            dt: {type: "f", value: dt},
            renderSteps: {type: "f", value: num_steps},
            initialPositions: {type: "t", value: positions},
            particlePositions: {type: "t", value: positions},
            particleAgeState: {type: "t", value: null},
            velocityField: {type: "t", value: null}
        }

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader:  document.getElementById( 'particleSimVert' ).innerHTML,
            fragmentShader: document.getElementById( 'particleSimFrag' ).innerHTML,
            depthWrite: false,
            depthTest: false,
            blending: THREE.NoBlending
        })

        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [-1,-1,0,  1,-1,0,  1,1,0,  -1,-1,0,  1, 1, 0,  -1,1,0] , 3 ) );
        this.geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( [0,1, 1,1, 1,0,   0,1, 1,0, 0,0], 2 ) );
        // this.geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( [0,0, 1,0, 1,1,   0,0, 1,1, 0,1], 2 ) );
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);
    }

    initParticlePositions(particle_span){
        var len = particle_span * particle_span * 4;
        var data = new Float32Array(len);
        for (let i = 0; i < len; i++) {
            const stride = i * 4;
            data[ stride ] = (Math.random() * 2 - 1);
            data[ stride + 1 ] = (Math.random() * 2 - 1);
            data[ stride + 2 ] = 0;
            data[ stride + 3 ] = 1.0;
        }
        return data;
    }

    update_positions(newPositions) {
        this.uniforms.particlePositions.value = newPositions.texture;
    }

    renderToTarget(renderer, velocityField, particleAgeState, output) {
        // this.uniforms.particlePositions.value = particlePos.texture;
        this.uniforms.velocityField.value = velocityField.texture;
        this.uniforms.particleAgeState.value = particleAgeState.texture;

        renderer.setRenderTarget(output);
        renderer.render(this.scene, this.camera);
        renderer.setRenderTarget(null);

        // /* Feed new particle positions back into sim shader */
        // var clone = output.clone();
        // this.uniforms.particlePositions.value = clone.texture;
        // clone.dispose();
    }
}