import * as THREE from 'three';

/** 
 *  Takes in the pressureField and intermediate velocityField. Calculates the pressure gradient
 *  for each cell and subtracts it from the velocity field to eliminate divergence from the vector field
 *  and enforce incompressibility.
 */
export default class Gradient {
    constructor(res) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
        this.gridRes = res;

        this.uniforms = {
            p: {type: 't', value: null},      // pressure field
            w: {type: 't', value: null},      // velocity field

            gridSize: {type: 'v2', value: this.gridRes},
            gridScale: {type: 'f', value: 1.0},
          }

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: document.getElementById( 'gradientFrag' ).innerHTML,
            depthWrite: false,
            depthTest: false,
            blending: THREE.NoBlending
        })

        this.geometry = new THREE.PlaneGeometry( 2, 2 );
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);
    }

    subtract_gradient(renderer, p, w, output) {
        this.uniforms.p.value = p.texture;
        this.uniforms.w.value = w.texture;
  
        renderer.setRenderTarget(output);
        renderer.render(this.scene, this.camera);
        renderer.setRenderTarget(null);
    }
}