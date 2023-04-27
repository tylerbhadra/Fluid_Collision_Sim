import * as THREE from 'three';

/**
 * Ages particles. Writes new ages to a render target.
 */
export default class ParticleAge {
    constructor(res, maxAge, particle_span, dt) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
        this.maxAge = maxAge;

        /* Store random initial particle positions as DataTexture (of floats, specifically) */
        var data = this.initParticleAges( particle_span );
        var ageState = new THREE.DataTexture( data, particle_span, particle_span, THREE.RGBAFormat, THREE.FloatType );
        ageState.needsUpdate = true;

        this.uniforms = {
            gridRes: {type: "v2", value: res},
            dt: {type: "f", value: dt},
            particleAgeState: {type: "t", value: ageState}
        }

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader:  document.getElementById( 'particleSimVert' ).innerHTML,
            fragmentShader: document.getElementById( 'particleAgeFrag' ).innerHTML,
            depthWrite: false,
            depthTest: false,
            blending: THREE.NoBlending
        })

        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [-1,-1,0,  1,-1,0,  1,1,0,  -1,-1,0,  1, 1, 0,  -1,1,0] , 3 ) );
        this.geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( [0,1, 1,1, 1,0,   0,1, 1,0, 0,0], 2 ) );
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);
    }

    initParticleAges(particle_span){
        var len = particle_span * particle_span * 4;
        var data = new Float32Array(len);
        for (let i = 0; i < len; i++) {
            const stride = i * 4;

            /* Assign random starting ages so particles die and respawn at their initial positions at staggered intervals. 
               Should reduce the amount of empty empty/white space as particles are advected through fluid */
            data[ stride ] = THREE.MathUtils.randFloat(4950000.0, 5000000.0); // No idea why the numbers need to be this big. Super slow spawn rate otherwise.
            data[ stride + 1 ] = this.maxAge;
            data[ stride + 2 ] = 0.0;
            data[ stride + 3 ] = 1.0;
        }
        return data;
    }

    update_ages(newAgeState) {
        this.uniforms.particleAgeState.value = newAgeState.texture;
    }

    renderToTarget(renderer, output) {
        renderer.setRenderTarget(output);
        renderer.render(this.scene, this.camera);
        renderer.setRenderTarget(null);
    }
}