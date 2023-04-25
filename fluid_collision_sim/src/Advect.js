import * as THREE from 'three';

/** 
 *  Takes in a texture and advects its values across the texture. 
 */
export default class Advector {
    constructor(delta_t, res) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
        this.gridRes = res;

        this.uniforms = {
            velocity: {type: 't', value: null},
            advected: {type: 't', value: null},
            gridSize: {type: 'v2', value: this.gridRes},
            gridScale: {type: 'f', value: 1.0},
            timestep: {type: 'f', value: delta_t},
            dissipation: {type: 'f', value: null}
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

    update_timestep(delta_t) {
        this.uniforms.timestep.value += delta_t;
        console.log(this.uniforms.timestep.value);
    }

    advect_texture(renderer, input_velocity, input_advected, output) {
        this.renderer = renderer;
        this.uniforms.velocity.value = input_velocity.texture;
        this.uniforms.advected.value = input_advected.texture;
        this.renderer.setRenderTarget(output);
        this.renderer.render(this.scene, this.camera);
        this.renderer.setRenderTarget(null);
    }
}