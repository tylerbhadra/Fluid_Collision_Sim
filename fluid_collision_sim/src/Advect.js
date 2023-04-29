import * as THREE from 'three';

/** 
 *  Takes in a texture and advects its values across the texture. 
 */
export default class Advector {
    constructor(res) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
        this.gridRes = res;

        this.uniforms = {
            velocity: {type: 't', value: null},
            advected: {type: 't', value: null},
            gridSize: {type: 'v2', value: this.gridRes},
            gridScale: {type: 'f', value: 1.0},
            dissipation: {type: 'f', value: null},
            timestep: {type: 'f', value: 1.0},
          }

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: document.getElementById( 'advectFrag' ).innerHTML,
            depthWrite: false,
            depthTest: false,
            blending: THREE.NoBlending
        })

        // this.geometry = new THREE.PlaneGeometry( 2 * (res.x - 2) / res.x, 2 * (res.y - 2) / res.y );
        this.geometry = new THREE.PlaneGeometry( 2, 2 );
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);
    }

    advect_texture(renderer, input_velocity, input_advected, dissipation, delta_t, output) {
        this.renderer = renderer;
        this.uniforms.velocity.value = input_velocity.texture;
        this.uniforms.advected.value = input_advected.texture;
        this.uniforms.dissipation.value = dissipation;
        this.uniforms.timestep.value = delta_t;
        this.renderer.setRenderTarget(output);
        this.renderer.render(this.scene, this.camera);
        this.renderer.setRenderTarget(null);
    }
}