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
            inputTexture:  {type: 't', value: null},
            boundaryField: {type: 't', value: null},
            boundaryValue: {type: 'f', value: null},
          }

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: document.getElementById( 'boundaryVelocityFrag' ).innerHTML,
            depthWrite: false,
            depthTest: false,
            blending: THREE.NoBlending
        })

        this.geometry = new THREE.PlaneGeometry( 2, 2 );
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);
    }

    setModeVelocity() {
        this.material.fragmentShader = document.getElementById( 'boundaryVelocityFrag' ).innerHTML;
        this.uniforms.boundaryValue.value = 0.0;
    }

    setModePressure() {
        this.material.fragmentShader = document.getElementById( 'boundaryPressureFrag' ).innerHTML;
        this.uniforms.boundaryValue.value = 1.0;
    }

    apply_boundary_conditions(renderer, input, boundaryField, output) {
        this.uniforms.inputTexture.value = input.texture;
        this.uniforms.boundaryField.value = boundaryField.texture;

        renderer.setRenderTarget(output);
        renderer.render(this.scene, this.camera);
        renderer.setRenderTarget(null);
    }
}