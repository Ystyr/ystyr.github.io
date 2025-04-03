const shaderSharedInfoUrl = 'https://ystyr.github.io/data/shaders/shaderShared.json';

const shaderInfosUrls = [
    'https://ystyr.github.io/data/shaders/chtulhu/chtulhu.json',
    'https://ystyr.github.io/data/shaders/obsidian/obsidian.json',
    'https://ystyr.github.io/data/shaders/procerock/procerock.json',
    'https://ystyr.github.io/data/shaders/KIFSFract/KIFSFract.json',
    'https://ystyr.github.io/data/shaders/spaceShooter/spaceShooter.json',
    'https://ystyr.github.io/data/shaders/hexgrid/hexgrid.json',
    "https://ystyr.github.io/data/shaders/digital/digital.json",
    "https://ystyr.github.io/data/shaders/title/title.json"	
];

function onLoad () {

    const gls = [];
    const pages = [];
    const renders = []; 
    const pagesNum = shaderInfosUrls.length - 1;
    const layout = document.getElementsByClassName('horizontalLayout')[0];
    const titCanv = document.getElementById('title');
    const createGaleryPages = () => {
        for (let i = 0; i < pagesNum; i++) {
            const page = document.createElement('div');
            const canv = document.createElement('canvas');
            const textbox = document.createElement('div');
            const title = document.createElement('h3');
            const description = document.createElement('b');
            
            page.className = 'slidepage slideRight';

            textbox.className = 'textbox';
            title.className = 'title';
            title.innerHTML = "not loaded";
            description.className = 'description';
            description.innerHTML = 'not loaded';
            
            canv.width = 1024;
            canv.height = 768;
            canv.classList.add('gallery');
            canv.onmousemove = e => updateCanvMouse(canv, e);

            pages.push(page);

            textbox.appendChild(title);
            textbox.appendChild(description);
            page.appendChild(textbox);
            page.appendChild(canv);
            layout.appendChild(page);

            const gl = canv.getContext("webgl2");
            gls.push(gl);
        }
        pages[0].style.animationPlayState = 'running';
    }
    const getOnGLReadyEvents = () => {
        const result = [];
        result.push((rend, canvId) => {
            renders[canvId] = rend;
            rend.setMousePosGetter(() => canvMousePos);
            rend.play(1);
        });
        for (let i = 1; i < pagesNum; i++) {
            result.push((rend, canvId) => {
                renders[canvId] = rend;
                rend.setMousePosGetter(() => canvMousePos);
                rend.render(1);
            });
        }	
        //!@ title render callback	
        result.push(
            rend => {
                let isMouseOver;
                titCanv.onmouseover = () => isMouseOver = true;
                titCanv.onmouseout = () => isMouseOver = false;
                rend.setMousePosGetter(() => {
                    const nFunc = (func, v) => func(v) * .4 + .4;
                    const n_sin = t => nFunc(Math.sin, t * 2);
                    const n_cos = t => nFunc(Math.cos, t);
                    const time = rend.then;
                    const width = titCanv.clientWidth;
                    const height = titCanv.clientHeight;
                    const fakeMsePos = [n_sin(time) * width, n_cos(time) * height - height * .5];
                    const msePos = [canvMousePos[0] * .5, canvMousePos[1] * .5];
                    return isMouseOver? msePos: fakeMsePos;
                });
                rend.play(0);
            }
        )
        return result;
    }
    
    createGaleryPages();
    gls.push(titCanv.getContext("webgl2"));

    initGlsContent(
        gls, shaderSharedInfoUrl, shaderInfosUrls, 
        getOnGLReadyEvents(), (shadInfo, idx) => {
            if (idx < pagesNum) {
                const page = pages[idx];
                const h = page.getElementsByTagName('h3')[0];
                const b = page.getElementsByTagName('b')[0];
                h.innerHTML = shadInfo.title;
                b.innerHTML = shadInfo.description;
            }
        }
    );
    
    const galleryControls = {
        currentPageIdx: 0,
        init: () => {
            const btnPrev = document.createElement('img');
            const btnNext = document.createElement('img');
            const createArrows = () => {
                const space = document.createElement('h');
                btnPrev.className = btnNext.className = 'layoutControl';
                btnPrev.src = 'data/images/arrowL.png';
                btnNext.src = 'data/images/arrowR.png';
                btnPrev.classList.add('left');
                btnNext.classList.add('right');
                layout.appendChild(btnPrev);
                layout.appendChild(btnNext);
            };
            const disable = btn => {
                btn.enabled = false;
                btn.classList.add('disabled');
            };
            const enable = btn => {
                btn.enabled = true;
                btn.classList.remove('disabled');
            };
            const animatePages = (btn, idx, classInName, classOutName) => {
                if (! btn.enabled) return false;

                const currPage = pages[this.currentPageIdx];
                const nextPage = pages[idx];

                currPage.classList.add(classOutName);
                currPage.style.animationPlayState = 'running';
                
                nextPage.className = 'slidepage';
                nextPage.classList.add(classInName);
                nextPage.style.animationPlayState = 'running';
                nextPage.getAnimations()[0].onfinish = e => {
                    nextPage.style.animationPlayState = 'paused';
                    nextPage.className = 'slidepage';
                };	
                return true;
            } 
            const playControl = (toStopIdx, toPlayIdx) => {
                renders[toStopIdx].stop();
                renders[toPlayIdx].play();
            }
            const next = () => {
                if (! btnNext.enabled)
                    return;
                const idx = this.currentPageIdx + 1;
                if (animatePages(btnNext, idx, 'slideRight', 'hideRight')) {
                    if (idx == pages.length - 1) { 
                        disable(btnNext);
                    }
                    if (idx == 1) {
                        enable(btnPrev);
                    }
                    playControl(this.currentPageIdx, idx);
                }
                this.currentPageIdx = idx;
            }
            const prev = () => {
                if (! btnPrev.enabled)
                    return;
                const idx = this.currentPageIdx - 1;
                if (animatePages(btnPrev, idx, 'slideLeft', 'hideLeft')) {
                    if (idx == 0) { 
                        disable(btnPrev);
                    }
                    if (idx == pages.length - 2) {
                        enable(btnNext);
                    }
                    playControl(this.currentPageIdx, idx);
                }
                this.currentPageIdx = idx;
            }
            this.currentPageIdx = 0;

            createArrows();

            btnPrev.onclick = prev;
            disable(btnPrev);

            btnNext.enabled = true;
            btnNext.onclick = next; 
        }
    }
    galleryControls.init();
}		