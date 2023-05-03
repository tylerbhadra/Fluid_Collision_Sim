import * as THREE from 'three';

/** 
 *  Applies an external force to the fluid (Based on mouse position and duration of click).
 */
export default class ExternalForce {
    constructor(res) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
        this.gridRes = res;
        this.source = new THREE.Vector3(0,0,0);
        this.sourceDirection = new THREE.Vector2(0,0);

        this.uniforms = {
            inputTexture: {type: 't', value: null},
            source: {type: 'v3', value: this.source},
            sourceDirection: {type: 'v2', value: this.sourceDirection},
            gridSize: {type: 'v2', value: this.gridRes},
            mousePress: {type: 'v2', value: null},
            radius: {type: 'f', value: null},
          }

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: document.getElementById( 'externalForceFrag' ).innerHTML,
            depthWrite: false,
            depthTest: false,
            blending: THREE.NoBlending
        })

        this.geometry = new THREE.PlaneGeometry( 2, 2 );
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);
    }

    apply_force(renderer, input, radius, output) {
        this.uniforms.inputTexture.value = input.texture;
        this.uniforms.radius.value = radius;
        
        renderer.setRenderTarget(output);
        renderer.render(this.scene, this.camera);
        renderer.setRenderTarget(null);
    }
}