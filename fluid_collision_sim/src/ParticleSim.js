import * as THREE from 'three';

/**
 * Simulates the movement of particles over the velocityField by updating the current positions
 * of the particles in the particleSimFrag shader and writing the output to a render target. Positions
 * are passed into the shader as a texture uniform and indexed by vUv. 
 */
export default class ParticleSim {
    constructor(res, dt) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );

        //populate a Float32Array of random positions
        var data = getRandomData( width, height, 256 );
        //convertes it to a FloatTexture
        var positions = new THREE.DataTexture( data, width, height, THREE.RGBFormat, THREE.FloatType );
        positions.needsUpdate = true;

        this.uniforms = {
            gridRes: {type: "v2", value: res},
            dt: {type: "f", value: dt},
            particlePositions: {type: "t", value: null},
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
        this.geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( [-1,-1,0,  1,-1,0,  1,1,0,  -1,-1,0,  1, 1, 0,  -1,1,0] ), 3 ) );
        this.geometry.addAttribute( 'uv', new THREE.BufferAttribute( new Float32Array( [0,1, 1,1, 1,0,   0,1, 1,0, 0,0] ), 2 ) );
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);
    }

    //returns an array of random 3D coordinates
    getRandomData(width, height, size){
        var len = width * height * 3;
        var data = new Float32Array(len);
        while( len-- ) {
            data[len] = ( Math.random() * 2 - 1 ) * size ;
        }
        return data;
    }

    renderToTarget(renderer, input, output) {
        this.renderer = renderer;
        this.uniforms.particlePositions.value = input.texture;

        this.renderer.setRenderTarget(output);
        this.renderer.render(this.scene, this.camera);
        this.renderer.setRenderTarget(null);
    }
}