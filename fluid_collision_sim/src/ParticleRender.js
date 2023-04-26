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
    constructor(res, num_particles) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
        var particle_span = Math.sqrt(num_particles);

        this.uniforms = {
            gridRes: {type: "v2", value: res},
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

        var len = particle_span * particle_span * 4;
        var vertices = [];
        for ( var i = 0; i < len; i++ ) {
 
            var i4 = i * 4;
            vertices[ i4 ] = ( i % particle_span ) / particle_span ;
            vertices[ i4 + 1 ] = ( i / particle_span ) / particle_span;
            vertices[ i4 + 2 ] = 0.0;
            vertices[ i4 + 3 ] = 1.0;
        }
 
        /* Create the particles and add them to the scene */
        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute( 'position',  new THREE.Float32BufferAttribute( vertices, 4 ) );
        this.particles = new THREE.Points( this.geometry, this.material );
        this.scene.add(this.particles);
    
        /* Add a fadePlane to get a trailing effect for the particles */
        this.fadePlane = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            new THREE.MeshBasicMaterial({
                transparent: true,
                color: 0xffffff,
                opacity: 0.1
            })
        )

        this.scene.add(this.fadePlane);
    }

    renderToTarget(renderer, input, output) {
        this.uniforms.particlePositions.value = input.texture;

        renderer.setRenderTarget(output);
        renderer.render(this.scene, this.camera);
        renderer.setRenderTarget(null);
    }
}