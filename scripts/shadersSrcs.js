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

	vec4 char(vec2 pos, vec2 letterPos, vec2 origin, vec2 size) {
		pos = (pos-origin)/size + letterPos;
		pos = clamp(pos,letterPos,(letterPos+1.));
		return texture2D(u_sampler, (pos/16.));
	}
	
	vec4 fontUnion(vec4 f1, vec4 f2){
		if(f1.w<f2.w)
			return f1;
		else
			return f2;
	}

	#define LETTER(x,y) font = fontUnion(font,char(uv,vec2(x,y),pos,vec2(0.3,0.3))); pos+=vec2(.16,0.);
	
	#define A LETTER(1.,4.)
	#define B LETTER(2.,4.)
	#define C LETTER(3.,4.)
	#define D LETTER(4.,4.)
	#define E LETTER(5.,4.)
	#define F LETTER(6.,4.)
	#define G LETTER(7.,4.)
	#define H LETTER(8.,4.)
	#define I LETTER(9.,4.)
	#define J LETTER(10.,4.)
	#define K LETTER(11.,4.)
	#define L LETTER(12.,4.)
	#define M LETTER(13.,4.)
	#define N LETTER(14.,4.)
	#define O LETTER(15.,4.)
	#define P LETTER(0.,5.)
	#define Q LETTER(1.,5.)
	#define R LETTER(2.,5.)
	#define S LETTER(3.,5.)
	#define T LETTER(4.,5.)
	#define U LETTER(5.,5.)
	#define V LETTER(6.,5.)
	#define W LETTER(7.,5.)
	#define X LETTER(8.,5.)
	#define Y LETTER(9.,5.)
	#define Z LETTER(10.,5.)
	#define A_ LETTER(1., 6.)
	#define B_ LETTER(2., 6.)
	#define C_ LETTER(3., 6.)
	#define D_ LETTER(4., 6.)
	#define E_ LETTER(5., 6.)
	#define F_ LETTER(6., 6.)
	#define G_ LETTER(7., 6.)
	#define H_ LETTER(8., 6.)
	#define I_ LETTER(9., 6.)
	#define J_ LETTER(10., 6.)
	#define K_ LETTER(11., 6.)
	#define L_ LETTER(12., 6.)
	#define M_ LETTER(13., 6.)
	#define N_ LETTER(14., 6.)
	#define O_ LETTER(15., 6.)
	#define P_ LETTER(0., 7.)
	#define Q_ LETTER(1., 7.)
	#define R_ LETTER(2., 7.)
	#define S_ LETTER(3., 7.)
	#define T_ LETTER(4., 7.)
	#define U_ LETTER(5., 7.)
	#define V_ LETTER(6., 7.)
	#define W_ LETTER(7., 7.)
	#define X_ LETTER(8., 7.)
	#define Y_ LETTER(9., 7.)
	#define Z_ LETTER(10., 7.)

	#define TS LETTER(0, 0)
	
	#define n0 pos = vec2(.01*sin(pos.y*u_time)-1.,pos.y-0.3);
	#define _ pos += vec2(.1,0.);

	void main() {
		float t = u_time * .5;
		vec2 texCo = vec2(u_texCoord.x, 1. - u_texCoord.y) * .55;
		vec2 uv = (texCo * u_resolution) / u_resolution.y;
		vec2 m = /*vec2(abs(sin(t)), abs(cos(t)));*/ u_mouse / u_resolution.xy;
		vec4 font = vec4(1.);
		vec2 pos = vec2(0, 0.13);//.41);

		// ====== use macro to make it as if you were typing =====
		A L A M A K // A L A B A L A
		// ======
		
		vec3 bgCol = vec3(47.,61.,76.) / 255.;//vec3(.3);
		vec3 inCol = vec3(1.2, .7 + uv.y * 1.5, 1.1) * vec3(max(font.z * 3., font.w * 3.)) + (cos(1. - font.xyz) * .5 - .5) * uv.y;
		vec3 outCol = max(vec3(.88,.75, 1.2), max(font.wzw, font.zwz));
		
		float outWidth = 0.05;
		float deepness = 0.3;
		
		font.yzw = 1. -2. * font.yzw; // center everything on 0, above 0 = in the font
		float inner = smoothstep(-.1, .007, font.w);
	
		font = (1.2-inner) * font; // everything in the font gets leveled to 0 (font.w <= 0)
		font.w += outWidth; // now everithing above 0 is in the outline
		float outer = smoothstep(-.01, inner * .2, font.w); // this is the inner + the outline
		font *= outer * deepness/outWidth;  // crop everything outside the outline, and map to height

		vec3 viewPos = vec3(font.wzx);//vec3(uv,font.w);
		vec3 lightPos = vec3(m.x, m.y, .4);//vec3(3.,2.,.4);
		vec3 lightDir = normalize(lightPos-viewPos);
		vec3 normal = normalize(vec3(-font.g, font.b, 1.));
		vec3 reflectDir = reflect(-lightDir, normal);
		
		vec3 viewDir = normalize(vec3(0.,0.,1.) - viewPos);
		float spec = pow(max(dot(viewDir, reflectDir),0.), 5.);
		
		float light = .5 + .8*max(dot(normal, lightDir), 0.) + 2.2 * spec;
		vec3 col = light * (inner * inCol + (outer - inner) * outCol + (1. - outer));
		col *= outer * deepness/outWidth * bgCol;
		col = max(col, bgCol);
		gl_FragColor = vec4(col, 1);
	}
	`
}
