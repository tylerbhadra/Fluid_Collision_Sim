import * as THREE from 'three';

/** 
 *  Boundary conditions
 */
export default class Boundary {
    constructor(res) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
        this.gridRes = res;

        this.uniforms = {
            scale: {type: 'f', value: null},  // scale parameter
            x: {type: 't', value: null},      // state field

            gridSize: {type: 'v2', value: this.gridRes},
            gridScale: {type: 'f', value: 1.0},
          }

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: document.getElementById( 'boundaryFrag' ).innerHTML,
            depthWrite: false,
            depthTest: false,
            blending: THREE.NoBlending
        })

        this.geometry = new THREE.PlaneGeometry( 2, 2 );
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);
    }

    compute(renderer, scale, x, output) {
        this.uniforms.scale = scale;
        this.uniforms.x.value = x.texture;
  
        renderer.setRenderTarget(output);
        renderer.render(this.scene, this.camera);
        renderer.setRenderTarget(null);
    }
}