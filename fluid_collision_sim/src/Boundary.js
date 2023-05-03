import * as THREE from 'three';

/** 
 *  Applies boundary conditions (no-slip velocity conditions + pure Neumann pressure boundary conditions 
 *  to the input fields, using the boundaryField.
 */
export default class Boundary {
    constructor(res) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
        this.gridRes = res;
        this.source = new THREE.Vector3(0,0,0);
        this.sourceDirection = new THREE.Vector2(0,0);

        this.uniforms = {
            gridRes: {type: 'v2', value: res},
            inputField:  {type: 't', value: null},
            boundaryField: {type: 't', value: null},
            boundaryValue: {type: 'f', value: null}
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

    apply_boundary_conditions(renderer, input, boundaryField, boundaryVal, output) {
        this.uniforms.inputField.value = input.texture;
        this.uniforms.boundaryField.value = boundaryField.texture;
        this.uniforms.boundaryValue.value = boundaryVal;

        renderer.setRenderTarget(output);
        renderer.render(this.scene, this.camera);
        renderer.setRenderTarget(null);
    }
}