const shaderSharedInfoUrl = 'data/shaders/shaderShared.json';

const galleryShaderUrls = [
    'data/shaders/chtulhu/chtulhu.json',
    'data/shaders/obsidian/obsidian.json',
    'data/shaders/procerock/procerock.json',
    'data/shaders/KIFSFract/KIFSFract.json',
    'data/shaders/spaceShooter/spaceShooter.json',
    'data/shaders/hexgrid/hexgrid.json',
    'data/shaders/digital/digital.json'
];

const glOptions = { alpha: false, antialias: false, preserveDrawingBuffer: true };

let shaderSharedCache = null;

async function loadRenderer(gl, shaderSharedInfoUrl, shaderInfoUrl) {
    if (!gl) {
        throw new Error('WebGL2 is not supported in this browser');
    }
    if (!shaderSharedCache) {
        shaderSharedCache = await loadShaderSharedInfo(shaderSharedInfoUrl);
    }
    const shadInfo = await fetchJSON(shaderInfoUrl);
    const { vert, frag } = await renderDataInit(shadInfo, shaderSharedCache);
    const buffersNames = {
        attributes: shaderSharedCache.a_names,
        uniforms: shaderSharedCache.u_names,
        varyings: shaderSharedCache.v_names
    };
    const mapsData = buildMapsData(gl, shadInfo.mapsInfo);
    const renderer = new webGLRender(gl, vert, frag, mapsData, buffersNames);
    return { renderer, shadInfo };
}

function showShaderError(message) {
    const demos = document.getElementById('demos');
    if (demos && !demos.querySelector('.shader-error')) {
        const note = document.createElement('p');
        note.className = 'shader-error';
        note.textContent = `WebGL demos could not load: ${message}`;
        demos.querySelector('.gallery-wrap').appendChild(note);
    }
    console.error(message);
}

async function onLoad() {
    const layout = document.querySelector('.horizontalLayout');
    const galleryTitle = document.createElement('h3');
    const galleryDesc = document.createElement('p');
    const textbox = document.createElement('div');
    const galleryCanv = document.createElement('canvas');
    const btnPrev = document.createElement('button');
    const btnNext = document.createElement('button');

    textbox.className = 'textbox';
    galleryTitle.className = 'title';
    galleryDesc.className = 'description';
    galleryCanv.className = 'gallery';
    galleryCanv.width = 1024;
    galleryCanv.height = 768;
    galleryCanv.onmousemove = e => updateCanvMouse(galleryCanv, e);

    textbox.appendChild(galleryTitle);
    textbox.appendChild(galleryDesc);

    const galleryContent = document.createElement('div');
    galleryContent.className = 'gallery-content';
    galleryContent.appendChild(textbox);
    galleryContent.appendChild(galleryCanv);

    btnPrev.className = 'layoutControl left';
    btnNext.className = 'layoutControl right';
    btnPrev.type = 'button';
    btnNext.type = 'button';
    btnPrev.setAttribute('aria-label', 'Previous demo');
    btnNext.setAttribute('aria-label', 'Next demo');
    const chevron = (points) =>
        `<svg class="layoutControl-icon" aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="${points}"/></svg>`;
    btnPrev.innerHTML = chevron('15 18 9 12 15 6');
    btnNext.innerHTML = chevron('9 18 15 12 9 6');

    layout.appendChild(btnPrev);
    layout.appendChild(galleryContent);
    layout.appendChild(btnNext);

    const galleryGl = galleryCanv.getContext('webgl2', glOptions);
    if (!galleryGl) {
        showShaderError('WebGL2 is not supported in this browser');
        return;
    }

    let galleryRender = null;
    let currentGalleryIdx = 0;

    const disable = btn => {
        btn.enabled = false;
        btn.classList.add('disabled');
    };
    const enable = btn => {
        btn.enabled = true;
        btn.classList.remove('disabled');
    };

    const setGalleryMeta = shadInfo => {
        galleryTitle.textContent = shadInfo.title || 'Demo';
        galleryDesc.innerHTML = shadInfo.description || '';
    };

    const loadGallerySlide = async idx => {
        if (galleryRender) {
            galleryRender.stop();
            galleryRender = null;
        }
        const { renderer, shadInfo } = await loadRenderer(
            galleryGl, shaderSharedInfoUrl, galleryShaderUrls[idx]
        );
        galleryRender = renderer;
        setGalleryMeta(shadInfo);
        galleryRender.setMousePosGetter(() => canvMousePos);
        galleryRender.play(1);
    };

    try {
        await loadGallerySlide(0);
    } catch (err) {
        showShaderError(err.message);
        return;
    }

    btnNext.onclick = async () => {
        if (!btnNext.enabled) return;
        const idx = currentGalleryIdx + 1;
        try {
            await loadGallerySlide(idx);
            currentGalleryIdx = idx;
            if (idx === galleryShaderUrls.length - 1) disable(btnNext);
            enable(btnPrev);
        } catch (err) {
            showShaderError(err.message);
        }
    };

    btnPrev.onclick = async () => {
        if (!btnPrev.enabled) return;
        const idx = currentGalleryIdx - 1;
        try {
            await loadGallerySlide(idx);
            currentGalleryIdx = idx;
            if (idx === 0) disable(btnPrev);
            enable(btnNext);
        } catch (err) {
            showShaderError(err.message);
        }
    };

    disable(btnPrev);
    btnNext.enabled = true;
}

document.addEventListener('DOMContentLoaded', onLoad);
