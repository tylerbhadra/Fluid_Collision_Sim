import * as THREE from 'three';

/**
 * Renders only the boundaries to the boundaryScene which sits on top of the fluidScene 
 * (Which is rendered using particleTex or gridCellTex).
 */
export default class BoundaryRender {
    constructor(res) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );

        this.uniforms = {
            gridRes: {type: "v2", value: res},
            boundaryField: {type: "t", value: null},
            inputTexture: {type: "t", value: null }
        }

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: document.getElementById( 'boundaryRenderFrag' ).innerHTML,
            depthWrite: false,
            depthTest: false,
            blending: THREE.NoBlending
        })

        this.geometry = new THREE.PlaneGeometry( 2, 2 );
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);
    }

    renderToTarget(renderer, currRenderTex, boundaryField, output) {
        this.uniforms.boundaryField.value = boundaryField.texture;
        this.uniforms.inputTexture.value = currRenderTex.texture;

        renderer.setRenderTarget(output);
        renderer.render(this.scene, this.camera);
        renderer.setRenderTarget(null);
    }
}