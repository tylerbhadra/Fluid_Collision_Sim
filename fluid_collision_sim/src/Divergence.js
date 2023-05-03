import * as THREE from 'three';

/** 
 *  Takes in the inntermediate velocity vector field and caluclates its divergence. Renders
 *  the output to a texture (divergenceField.write_buf) which will be passed into the Jacobi
 *  shader program when calculating the pressure values.
 */
export default class Divergence {
    constructor(res) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
        this.gridRes = res;

        this.uniforms = {
            w: {type: 't', value: null},                    // velocity vector field
            gridSize: {type: 'v2', value: this.gridRes},
            gridScale: {type: 'f', value: 1.0},
          }

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: document.getElementById( 'divergenceFrag' ).innerHTML,
            depthWrite: false,
            depthTest: false,
            blending: THREE.NoBlending
        })

        this.geometry = new THREE.PlaneGeometry( 2, 2 );
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);
    }

    compute_divergence(renderer, w, output) {
        this.uniforms.w.value = w.texture;
  
        renderer.setRenderTarget(output);
        renderer.render(this.scene, this.camera);
        renderer.setRenderTarget(null);
    }
}