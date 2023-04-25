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
            mode: {type: "f", value: 0.0},
            gridRes: {type: "v2", value: this.gridRes},
            // dataTex: {type: "t"}
            initialVal: {type: "f"}
        }

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: document.getElementById( 'configVelocityFrag' ).innerHTML,
            depthWrite: false,
            depthTest: false,
            blending: THREE.NoBlending
        })

        // this.geometry = new THREE.PlaneGeometry( 2 * (res.x - 2) / res.x, 2 * (res.y - 2) / res.y );
        this.geometry = new THREE.PlaneGeometry( 2, 2 );
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);
    }

    // /**
    //  *  Initializes data array for the DataTexture with value.
    //  */
    // initialize_values(v) {
    //     const length = this.gridRes.x * this.gridRes.y * 4;
    //     const data = new Float32Array(length);

    //     for (let i = 0; i < length; i++) {
    //         const stride = i * 4;

    //         data[ stride ] = v/10.0;
    //         data[ stride + 1 ] = 0.0;
    //         data[ stride + 2 ] = 0.0;
    //         data[ stride + 3 ] = 1.0;
    //     }

    //     return data;
    // }

    configure_field(renderer, color_mode, output) {
        this.uniforms.mode.value = color_mode;
        this.renderer = renderer;
        // this.uniforms.initialVal.value = value;
        // this.input = input;

        // var dataTex = new THREE.DataTexture(
        //     this.initialize_values(value),
        //     this.gridRes.x,
        //     this.gridRes.y,
        //     THREE.RGBAFormat,
        //     THREE.FloatType
        // )
        // dataTex.needsUpdate = true;

        // this.uniforms.attributeValues = dataTex;
        this.renderer.setRenderTarget(output);
        this.renderer.render(this.scene, this.camera);
        this.renderer.setRenderTarget(null);
    }
}