import * as THREE from 'three';

/**
 * Represents what is actually drawn to the screen. Following all grid computations for the current simulation step, maps 
 * the vertex/frag data from one of the relevant attribute field read buffers (such as particlePosField or pressureField) 
 * to the output buffer, which will be used as a texture material for the canvas. Handles extra particle specific rendering
 * calculations.
 */
export default class ParticleRender {
    constructor(res) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
        this.gridRres = res;

        this.uniforms = {
            res: {type: "v2", value: this.gridRes},
            particlePos: {type: "t"},

        }

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: document.getElementById( 'finalRenderFrag' ).innerHTML,
            depthWrite: false,
            depthTest: false,
            blending: THREE.NoBlending
        })

        this.geometry = new THREE.PlaneGeometry( 2 * (res.x - 2) / res.x, 2 * (res.y - 2) / res.y );
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);

        this.clearPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(window.innerWidth, window.innerHeight),
            new THREE.MeshBasicMaterial({
                transparent: true,
                color: 0xffffff,
                opacity: 0.1
            })
        )

        this.scene.add(this.clearPlane);
    }

    renderToTarget(renderer, input, output) {
        this.renderer = renderer;
        this.uniforms.texture = input;

        this.renderer.setRenderTarget(output);
        this.renderer.render(this.scene, this.camera);
        this.renderer.setRenderTarget(null);
    }
}