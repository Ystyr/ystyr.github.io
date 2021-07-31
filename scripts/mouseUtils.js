let isMouseDown = false;
let mousePos = [];

function setMouseDown (isDown) {
    isMouseDown = isDown;
}

function updateMouse(event) {
    if (! isMouseDown) return;
    mousePos = [event.clientX, event.clientY];
}