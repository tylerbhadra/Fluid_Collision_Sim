import * as THREE from 'three';

/** 
 *  Will function as a grid for some attribute (velocity, density, temperature, etc...).
 *  Read buffer should be passed in as a uniform for a shader (of type sampler2D, i.e a texture).
 *  Write buffer will be set as the render target using renderer.setRenderTarget(). A fragment shader 
 *  will populate the write buffer with new updated attribute values (i.e simulation step is done
 *  in the fragment shaders on the GPU). 
 */
export default class AttributeField {
    read_buf;
    // read_bufWithInitializer = "instance read_buf";
    write_buf;
    // write_bufWithInitializer = "instance write_buf";
    constructor(gridRes) {
        this.read_buf = new THREE.WebGLRenderTarget(gridRes.x, gridRes.y, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, type: THREE.FloatType });
        this.write_buf = new THREE.WebGLRenderTarget(gridRes.x, gridRes.y, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, type: THREE.FloatType });
    }

    // get read_buf() {
    //     return this.read_buf;
    // }

    // get write_buf() {
    //     return this.write_buf;
    // }

    update_read_buf() {
        var tmp = this.read_buf;
        this.read_buf = this.write_buf;
        this.write_buf = tmp;
    }
}