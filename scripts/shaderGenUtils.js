const REMOTE_ROOT = 'https://ystyr.github.io/';

function resolveAssetUrl(url) {
    if (!url) return url;
    if (url.startsWith(REMOTE_ROOT)) {
        return url.slice(REMOTE_ROOT.length);
    }
    return url;
}

function isExternalShaderSource(str) {
    return typeof str === 'string' && (
        str.startsWith('https://') ||
        str.startsWith('http://') ||
        str.startsWith('data/') ||
        str.endsWith('.src')
    );
}

async function fetchText(url) {
    const resolved = resolveAssetUrl(url);
    const res = await fetch(resolved);
    if (!res.ok) {
        throw new Error(`Failed to load ${resolved}: ${res.status}`);
    }
    return res.text();
}

async function fetchJSON(url) {
    const resolved = resolveAssetUrl(url);
    const res = await fetch(resolved);
    if (!res.ok) {
        throw new Error(`Failed to load ${resolved}: ${res.status}`);
    }
    return res.json();
}

function resolveDefines(obj) {
    const defines = obj.defines;
    for (const key in defines) {
        const val = defines[key];
        if (typeof val === 'string' && val.charAt(0) === '$') {
            const link = val.slice(2, -1);
            const adr = link.split('.');
            const root = obj[adr[0]];
            defines[key] = adr.length === 2 ? root[adr[1]] : root;
        }
    }
}

async function loadMethodSources(methods) {
    const pending = [];
    for (const key in methods) {
        const variants = methods[key];
        for (let i = 0; i < variants.length; i++) {
            const metSrc = variants[i];
            if (isExternalShaderSource(metSrc)) {
                pending.push(
                    fetchText(metSrc).then(src => { variants[i] = src; })
                );
            }
        }
    }
    await Promise.all(pending);
}

async function loadShaderSharedInfo(url) {
    const obj = await fetchJSON(url);
    resolveDefines(obj);
    await loadMethodSources(obj.methods);
    return obj;
}

function buildShaderSources(shaderInfo, shaderSharedInfo) {
    const version = '300 es';
    const precision = 'mediump float';
    const a_names = shaderSharedInfo.a_names;
    const v_names = shaderSharedInfo.v_names;
    const u_names = shaderSharedInfo.u_names;
    const outFrag = shaderSharedInfo.outFrag;
    const sharedDefines = shaderSharedInfo.defines;
    const sharedMethods = shaderSharedInfo.methods;
    const includes = shaderInfo.include || [];
    const mapsInfo = shaderInfo.mapsInfo || [];
    const inVert = a_names.vertPos;
    const outVertInFrag = v_names.uv;

    const vert =
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
        frag += `#define ${key} ${sharedDefines[key]}\n`;
    }
    frag += '\n';
    includes.forEach(name => {
        const variants = sharedMethods[name];
        if (!variants) {
            throw new Error(`Missing shader method: ${name}`);
        }
        for (let i = 0; i < variants.length; i++) {
            frag += variants[i];
            frag += '\n\n';
        }
    });

    return { vert, frag, mapsInfo };
}

async function renderDataInit(shaderInfo, shaderSharedInfo) {
    const { vert, frag } = buildShaderSources(shaderInfo, shaderSharedInfo);
    const body = await fetchText(shaderInfo.body);
    return { vert, frag: frag + body };
}

function buildMapsData(gl, mapsInfo) {
    return (mapsInfo || []).map(item => ({
        format: gl[item.format],
        filter: gl[item.filter],
        url: resolveAssetUrl(item.url)
    }));
}

async function initGlWithShader(gl, shaderSharedInfoUrl, shaderInfoUrl, onGLDone) {
    const shared = await loadShaderSharedInfo(shaderSharedInfoUrl);
    const shadInfo = await fetchJSON(shaderInfoUrl);
    const { vert, frag } = await renderDataInit(shadInfo, shared);
    const buffersNames = {
        attributes: shared.a_names,
        uniforms: shared.u_names,
        varyings: shared.v_names
    };
    const mapsData = buildMapsData(gl, shadInfo.mapsInfo);
    onGLDone(new webGLRender(gl, vert, frag, mapsData, buffersNames));
}

async function initGlsContent(gls, shaderSharedInfoUrl, shaderInfoUrls, onGLReadyEvents, onLoaded) {
    const shared = await loadShaderSharedInfo(shaderSharedInfoUrl);
    await Promise.all(gls.map(async (gl, i) => {
        if (!gl) {
            throw new Error(`WebGL2 is not available for canvas ${i}`);
        }
        const shadInfo = await fetchJSON(shaderInfoUrls[i]);
        onLoaded(shadInfo, i);
        const { vert, frag } = await renderDataInit(shadInfo, shared);
        const buffersNames = {
            attributes: shared.a_names,
            uniforms: shared.u_names,
            varyings: shared.v_names
        };
        const mapsData = buildMapsData(gl, shadInfo.mapsInfo);
        const wglRend = new webGLRender(gl, vert, frag, mapsData, buffersNames);
        onGLReadyEvents[i](wglRend, i);
    }));
}

let cachedShaderShared = null;

async function getShaderShared(shaderSharedInfoUrl) {
    if (!cachedShaderShared) {
        cachedShaderShared = await loadShaderSharedInfo(shaderSharedInfoUrl);
    }
    return cachedShaderShared;
}

async function createRenderer(gl, shaderSharedInfoUrl, shaderInfoUrl) {
    if (!gl) {
        throw new Error('WebGL2 is not supported in this browser');
    }
    const shared = await getShaderShared(shaderSharedInfoUrl);
    const shadInfo = await fetchJSON(shaderInfoUrl);
    const { vert, frag } = await renderDataInit(shadInfo, shared);
    const buffersNames = {
        attributes: shared.a_names,
        uniforms: shared.u_names,
        varyings: shared.v_names
    };
    const mapsData = buildMapsData(gl, shadInfo.mapsInfo);
    const renderer = new webGLRender(gl, vert, frag, mapsData, buffersNames);
    return { renderer, shadInfo };
}
