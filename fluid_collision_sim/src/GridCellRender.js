import * as THREE from 'three';

/**
 * Represents what is actually drawn to the screen. Following all grid computations for the current simulation step, maps 
 * the vertex attribute data from one of the relevant attribute field read buffers (such as velocity or pressure, or
 * boundaries/obstacles) to the output buffer, which will be used as a texture material for the canvas.
 */
export default class GridCellRender {
    constructor(res) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );

        this.uniforms = {
            gridRes: {type: "v2", value: res},
            inputTexture: {type: "t", value: null }
        }

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: document.getElementById( 'gridCellRenderFrag' ).innerHTML,
            depthWrite: false,
            depthTest: false,
            blending: THREE.NoBlending
        })

        // this.geometry = new THREE.PlaneGeometry( 2 * (res.x - 2) / res.x, 2 * (res.y - 2) / res.y );
        this.geometry = new THREE.PlaneGeometry( 2, 2 );
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);
    }

    renderToTarget(renderer, input, output) {
        this.uniforms.inputTexture.value = input.texture;

        renderer.setRenderTarget(output);
        renderer.render(this.scene, this.camera);
        renderer.setRenderTarget(null);
    }
}