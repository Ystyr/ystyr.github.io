let isMouseDown = false;
let mousePos = [0, 0];
let canvMousePos = [0, 0];

let onMouseUpd = () => {};

function setMouseDown (isDown) {
    isMouseDown = isDown;
}

function updateMouse(event) {
    mousePos = [event.clientX, event.clientY];
    onMouseUpd();
    const size = [300, 150];
    
}

function updateCanvMouse (canvas, event) {
    let rect = canvas.getBoundingClientRect();
    canvMousePos = [
        event.clientX - rect.left,
        event.clientY - rect.top
    ];
}