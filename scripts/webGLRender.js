class webGLRender 
{
    constructor(gl, vertShaderSrc, fragShaderSrc, texData, buffersNames) 
    { 
        const a_names = buffersNames.attributes;
        const u_names = buffersNames.uniforms;
        const v_names = buffersNames.varyings;

        this.gl = gl;
        const vertexShader = this.createShader(gl.VERTEX_SHADER, vertShaderSrc);
        const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragShaderSrc);
        const program = this.createProgram(vertexShader, fragmentShader);
        const positionAttributeLocation = gl.getAttribLocation(program, a_names.vertPos);
        const positionBuffer = gl.createBuffer();
        const uSamplersLocations = [];
        const samplers = [];
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
        for (let i = 0; i < texData.length; i++) {
            samplers.push(
                this.loadTexture(texData[i], gl.TEXTURE0 + i)
                );
            uSamplersLocations.push(
                gl.getUniformLocation(program, u_names.sampler + i)
                );
        }
        this.positionAttributeLocation = positionAttributeLocation;
        this.resolutionUniformLocation = gl.getUniformLocation(program, u_names.resolution);
        this.mouseUniformLocation = gl.getUniformLocation(program, u_names.mouse);
        this.timeUniformLocation = gl.getUniformLocation(program, u_names.time);
        this.uSamplersLocations = uSamplersLocations;
        this.samplers = samplers;
        this.request;
        this.startTime = Date.now();
        this.primitiveType = gl.TRIANGLES;
        this.offset = 0;
        this.count = 6;
        this.then = 0;
        
        this.getMsePos = () => mousePos;

    }

    setMousePosGetter (getter) {
        this.getMsePos = getter;
    }

    doDefaultTesture () {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, 
            gl.RGBA, gl.UNSIGNED_BYTE,new Uint8Array([255, 0, 255, 255])
            );
        return texture;
    }

    loadTexture(texData, activeTexture) 
    {
        const gl = this.gl;
        const image = new Image();
        const texture = gl.createTexture();

        gl.activeTexture(activeTexture);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, 
            gl.RGBA, gl.UNSIGNED_BYTE,new Uint8Array([255, 0, 255, 255])
            );
        
        image.onload = function() {
            gl.activeTexture(activeTexture);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, texData.format, texData.format, gl.UNSIGNED_BYTE, image);

            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, texData.filter);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, texData.filter);
            } 
            else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, texData.filter);
            }
        };
        image.crossOrigin = 'anonymous';
        image.src = texData.url;
        return texture;
    }

    render (time) { 
        const gl = this.gl;
        const msePos = this.getMsePos();
        const samplersNum = this.uSamplersLocations.length;
        gl.uniform1f(this.timeUniformLocation, time);
        gl.uniform2f(this.mouseUniformLocation, msePos[0], msePos[1]);
        gl.uniform2f(this.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
        for (let i = 0; i < samplersNum; i++) {
            gl.uniform1i(this.uSamplersLocations[i], i);  
        }
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

    createShader(type, source) {
        const gl = this.gl;
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

    createProgram(vertexShader, fragmentShader) {
        const gl = this.gl;
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

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}
