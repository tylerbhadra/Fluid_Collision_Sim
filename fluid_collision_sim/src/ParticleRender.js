import * as THREE from 'three';

/**
 * Actually renders particles to the screen. An alternative to FinalRender which simply assigns a 
 * gl_FragColor to each of the gridRes.x by gridRes.y grid cells before writing to finalTexture.
 * 
 * NOTE: The vertex shader takes a vertex index (x, y), normalized by the grid resolution, 
 * and writes it to the varying vUv (i.e. vertex indices/coords are texture indices/coords. 
 * For vertex v_i, texture(v_i.x, v_i.y) yields the real position of particle i)
 */
export default class ParticleRender {
    constructor(res) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
        this.gridRres = res;

        this.uniforms = {
            gridRes: {type: "v2", value: this.gridRes},
            particlePositions: {type: "t", value: null}
        }

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: document.getElementById( 'particleRenderVert' ).innerHTML,
            fragmentShader: document.getElementById( 'particleRenderFrag' ).innerHTML,
            depthWrite: false,
            depthTest: false,
            blending: THREE.NoBlending
        })

        // this.geometry = new THREE.PlaneGeometry( 2 * (res.x - 2) / res.x, 2 * (res.y - 2) / res.y );
        // this.plane = new THREE.Mesh(this.geometry, this.material);
        // this.scene.add(this.plane);

        var length = this.gridRes.x * this.gridRes.y;
        var vertices = new Float32Array( length * 2 );
        for ( var i = 0; i < length; i++ ) {
 
            var i2 = i * 2;
            vertices[ i2 ] = ( i % this.gridRes.x ) / this.gridRes.x ;
            vertices[ i2 + 1 ] = ( i / this.gridRes.y ) / this.gridRes.y;
        }
 
        //create the particles geometry
        this.geometry = new THREE.BufferGeometry();
        this.geometry.addAttribute( 'position',  new THREE.BufferAttribute( vertices, 3 ) );

        this.particles = new THREE.Points( this.geometry, this.material );
        this.scene.add(particles);
    
        this.fadePlane = new THREE.Mesh(
            new THREE.PlaneGeometry(window.innerWidth, window.innerHeight),
            new THREE.MeshBasicMaterial({
                transparent: true,
                color: 0xffffff,
                opacity: 0.1
            })
        )

        this.scene.add(this.fadePlane);
    }

    renderToTarget(renderer, input, output) {
        this.renderer = renderer;
        this.uniforms.particlePositions.value = input.texture;

        this.renderer.setRenderTarget(output);
        this.renderer.render(this.scene, this.camera);
        this.renderer.setRenderTarget(null);
    }
}