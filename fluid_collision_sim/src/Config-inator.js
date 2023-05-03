import * as THREE from 'three';

/** 
 *  Handles the configuration of an AttributeField using a frag shader 
 *  to write those values to an output buffer (i.e. a WebGLRenderTarget. Our output 
 *  should be the read buffer of the desired attribute field, like the velocity field,
 *  for example)
 */
export default class ConfigInator {
    constructor(res) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
        this.gridRes = res;

        this.uniforms = {
            gridRes: {type: "v2", value: this.gridRes},
        }

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: document.getElementById( 'configVelocityFrag' ).innerHTML,
            depthWrite: false,
            depthTest: false,
            blending: THREE.NoBlending
        })

        this.geometry = new THREE.PlaneGeometry( 2, 2);
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);
    }

    configure_field(renderer, output) {
        renderer.setRenderTarget(output);
        renderer.render(this.scene, this.camera);
        renderer.setRenderTarget(null);
    }
}