const buffersNames = {
    attributes: {
        vertPos: "a_position"
    },
    uniforms: {
        resolution: "u_resolution",
        mouse: "u_mouse",
        time: "u_time",
        sampler: "u_sampler",
        transforms: "u_transform"
    },
    varyings: {
        uv: "u_texCoord"
    }
}
const a_names = buffersNames.attributes;
const u_names = buffersNames.uniforms;
const v_names = buffersNames.varyings;

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

class webGLRender 
{
    constructor(canvas, vertShaderSrc, fragShaderSrc, texUrl) 
    { 
        const gl = canvas.getContext("webgl");
        const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertShaderSrc);
        const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragShaderSrc);
        const program = this.createProgram(gl, vertexShader, fragmentShader);
        const positionAttributeLocation = gl.getAttribLocation(program, buffersNames.attributes.vertPos);
        const positionBuffer = gl.createBuffer();
        const verts = [
            -1, -1,  -1, 1,  1, 1, 
            -1, -1,  1, 1,  1, -1,
        ];
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(
            positionAttributeLocation,
            2,        //size: 2 components per iteration
            gl.FLOAT, //type: the data is 32bit floats
            false,    //normalize: don't normalize the data
            0,        //stride: 0 = move forward size * sizeof(type) each iteration to get the next position
            0         //offset:start at the beginning of the buffer
        );
        this.positionAttributeLocation = positionAttributeLocation;
        this.resolutionUniformLocation = gl.getUniformLocation(program, u_names.resolution);
        this.mouseUniformLocation = gl.getUniformLocation(program, u_names.mouse);
        this.timeUniformLocation = gl.getUniformLocation(program, u_names.time);
        this.uSamplerLocation = gl.getUniformLocation(program, u_names.sampler);
        this.texture = this.loadTexture(gl, texUrl);
        this.request;
        this.startTime = Date.now();
        this.primitiveType = gl.TRIANGLES;
        this.offset = 0;
        this.count = 6;
        this.then = 0;
        this.gl = gl;
        this.getMsePos = () => mousePos;
    }

    setMousePosGetter (getter) {
        this.getMsePos = getter;
    }

    loadTexture(gl, url) 
    {
        const texture = gl.createTexture();
        const image = new Image();
       
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, 
            gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255])
            );

        image.onload = function() {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
            } 
            else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.BILINEAR);
            }
        };
        image.crossOrigin = 'anonymous';
        image.src = url;
        return texture;
    }

    render (time) { 
        const gl = this.gl;
        const msePos = this.getMsePos();
        gl.uniform1f(this.timeUniformLocation, time);
        gl.uniform2f(this.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
        gl.uniform2f(this.mouseUniformLocation, msePos[0], msePos[1]);
        gl.uniform1i(this.uSamplerLocation, 0);
        gl.drawArrays(this.primitiveType, this.offset, this.count); 
    }

    play (time) {
        time *= 0.001;
        this.then = time;
        this.render(time);
        this.request = requestAnimationFrame(t => this.play(t));
    }

    stop () {
        cancelAnimationFrame(this.request);
        this.clearRequest();
    }

    createShader(gl, type, source) {
        let shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) {
            return shader;
        }
        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }

    createProgram(gl, vertexShader, fragmentShader) {
        let program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        let success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success) {
            return program;
        }
        console.log(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    }

    clearRequest () {
        this.request = undefined;
    }
}