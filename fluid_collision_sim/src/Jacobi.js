import * as THREE from 'three';

/** 
 *  Takes in a texture and jacobi's it idk what jacobi is
 */
export default class Jacobi {
    constructor(res) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
        this.gridRes = res;

        this.uniforms = {
            alpha: {type: 'f', value: null},  // alpha
            rBeta: {type: 'f', value: null},  // reciprocal beta
            x: {type: 't', value: null},      // x vector (Ax = b)
            b: {type: 't', value: null},      // b vector (Ax = b)

            gridSize: {type: 'v2', value: this.gridRes},
            gridScale: {type: 'f', value: 1.0},
          }

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: document.getElementById( 'jacobiFrag' ).innerHTML,
            depthWrite: false,
            depthTest: false,
            blending: THREE.NoBlending
        })

        this.geometry = new THREE.PlaneGeometry( 2, 2 );
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);
    }

    compute(renderer, alpha, rBeta, x, b, output) {
        this.uniforms.alpha.value = alpha;
        this.uniforms.rBeta.value = rBeta;
        this.uniforms.x.value = x.texture;
        this.uniforms.b.value = b.texture;
  
        renderer.setRenderTarget(output);
        renderer.render(this.scene, this.camera);
        renderer.setRenderTarget(null);
    }
}