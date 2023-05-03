import * as THREE from 'three';

/** 
 *  Draws boundary cells to the boundaryField for later processing
 *  in the simulation loop during boundary condition application and 
 *  boundary rendering (Based on mouse position and duration of click).
 */
export default class ArbitraryBoundary {
    constructor(res) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
        this.gridRes = res;
        this.source = new THREE.Vector3(0,0,0);

        this.uniforms = {
            inputTexture: {type: 't', value: null},
            source: {type: 'v3', value: this.source},
            gridSize: {type: 'v2', value: this.gridRes},
            radius: {type: 'f', value: null},
            scale: {type: 'f', value: null}
          }

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: document.getElementById( 'arbitraryBoundaryFrag' ).innerHTML,
            depthWrite: false,
            depthTest: false,
            blending: THREE.NoBlending
        })

        this.geometry = new THREE.PlaneGeometry( 2, 2 );
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);
    }

    draw_boundary(renderer, input, radius, mode, output) {
        this.uniforms.inputTexture.value = input.texture;
        this.uniforms.radius.value = radius;
        this.uniforms.scale.value = mode;
        renderer.setRenderTarget(output);
        renderer.render(this.scene, this.camera);
        renderer.setRenderTarget(null);
    }
}