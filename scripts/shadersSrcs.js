const shaderSrc = {
	commonVert: 
	`
	precision mediump float;
	attribute vec4 a_position;
	varying vec2 u_texCoord;
	void main () {
		u_texCoord = a_position.xy  * .5 + .5;
		gl_Position = a_position;
	}
	`,
	testFrag: 
	`
	precision mediump float;
	uniform vec2 u_resolution;
	uniform vec2 u_mouse;
	uniform float u_time;
	uniform sampler2D u_sampler;
	varying vec2 u_texCoord;
	void main() {
		vec2 uv = u_texCoord;
		vec3 col = texture2D(u_sampler, uv).rgb;
		gl_FragColor = vec4(col, 1); 
	}
	`
}
