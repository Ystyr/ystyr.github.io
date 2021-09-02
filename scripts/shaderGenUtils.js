const testFrag = ``;

function numerateLines (text) {
    const lines = text.split('\n');
    let result = '';
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        result += `${i} ${line}\n`;
    }
    return result;
}

function renderDataInit (shaderInfo, shaderSharedInfo, success) 
{
    const version = '300 es';
    const precision = 'mediump float';
    const a_names = shaderSharedInfo.a_names;
    const v_names = shaderSharedInfo.v_names;
    const u_names = shaderSharedInfo.u_names;
    const outFrag = shaderSharedInfo.outFrag; 
    const sharedDefines = shaderSharedInfo.defines;
    const sharedMethods = shaderSharedInfo.methods;
    const includes = shaderInfo.include;
    const mapsInfo = shaderInfo.mapsInfo;
    const inVert = a_names.vertPos;
    const outVertInFrag = v_names.uv;
    
    let vert = 
    `#version ${version}
    precision ${precision};
    in vec4 ${inVert};
    out vec2 ${outVertInFrag};
    void main () {
        ${outVertInFrag} = ${inVert}.xy * .5 + .5;
        gl_Position = ${inVert};
    }
    `; 

    let frag = `#version ${version}
    precision ${precision};\n
    in vec2 ${outVertInFrag};
    out vec4 ${outFrag};
    uniform vec2 ${u_names.resolution};
    uniform vec2 ${u_names.mouse};
    uniform float ${u_names.time};
    \n`.replace(/  +/g, '');

    for (let i = 0; i < mapsInfo.length; i++) {
        frag += `uniform sampler2D ${u_names.sampler}${i};`; 
    }
    frag += '\n\n';
    for (const key in sharedDefines) {
        const value = sharedDefines[key];
        frag += `#define ${key} ${value}\n`; 
    }
    frag += '\n';
    includes.forEach(name => {
        const variants = sharedMethods[name];
        for (let i = 0; i < variants.length; i++) {
            frag += variants[i];   
            frag += '\n\n';  
        }
    });
    $.get(shaderInfo.body, body => {
        frag += body;
        success(vert, frag);
        //console.log(numerateLines(frag));
    });
}

function loadShaderSharedInfo (url, success) {
    $.getJSON(url, obj => {
        const defines = obj.defines;
        for (const key in defines) {
            const val = defines[key];
            ///!@ replace links to the buffer names
            if (typeof val == 'string' && val.charAt(0) == '$') {
                const link = val.slice(2, -1);
                const adr = link.split('.');
                const root = obj[adr[0]];
                if (adr.length == 2) {
                    defines[key] = root[adr[1]];
                    continue;
                }
                defines[key] = root;
            }
        }
        ///!@ replace urls on sources
        const methods = obj.methods;
        const pending = [];
        for (const key in methods) {
            const variants = methods[key];
            for (let i = 0; i < variants.length; i++) {
                const metSrc = variants[i];
                if (metSrc.slice(0, 5) === 'https') {
                    pending.push(
                        $.get(metSrc, async src => variants[i] = await src)
                    );
                }
            }
        }
        const loading = $.when(...pending);
        loading.done(() => success(obj));
        loading.always(() => console.log("loading"));
        loading.fail(() => console.log("method source failed"));
    });
} 

function initGlWithShader (gl, shaderSharedInfoUrl, shaderInfoUrl, onGLDone) {
    loadShaderSharedInfo(
        shaderSharedInfoUrl,
        shared => $.getJSON(
            shaderInfoUrl, 
            shadInfo => renderDataInit(
                shadInfo, shared, (vert, frag) => {
                    const buffersNames = {
                        attributes: shared.a_names,
                        uniforms: shared.u_names,
                        varyings: shared.v_names
                    };
                    const mapsData = [];
                    const mapsInfo = shadInfo.mapsInfo;
                    for (let i = 0; i < mapsInfo.length; i++) {
                        const map = mapsInfo[i];
                        mapsData.push({
                            format: gl[map.format], 
                            filter: gl[map.filter], 
                            url: map.url
                        });
                    }
                    const wglRend = new webGLRender(
                        gl, vert, frag, mapsData, buffersNames
                        );
                        onGLDone(wglRend);
                    }
                )
            )
        );
}


function initGlsContent (gls, shaderSharedInfoUrl, shaderInfoUrls, onGLReadyEvents, onLoaded) {
    loadShaderSharedInfo(
        shaderSharedInfoUrl,
        shared => {
            for (let i = 0; i < gls.length; i++) {
                const gl = gls[i];
                const shaderInfoUrl = shaderInfoUrls[i];
                const callback = onGLReadyEvents[i];
                $.getJSON(
                    shaderInfoUrl, 
                    shadInfo => {
                        onLoaded(shadInfo, i);
                        renderDataInit(
                            shadInfo, shared, 
                            (vert, frag) => {
                                const buffersNames = {
                                    attributes: shared.a_names,
                                    uniforms: shared.u_names,
                                    varyings: shared.v_names
                                };
                                const mapsData = [];
                                const mapsInfo = shadInfo.mapsInfo;
                                mapsInfo.forEach(item => {
                                    mapsData.push({
                                        format: gl[item.format], 
                                        filter: gl[item.filter], 
                                        url: item.url
                                    });
                                });
                                const wglRend = new webGLRender(
                                    gl, vert, frag, mapsData, buffersNames
                                    );

                                callback(wglRend, i);
                            }
                        )
                    }
                )
            }
        }
    );
}
