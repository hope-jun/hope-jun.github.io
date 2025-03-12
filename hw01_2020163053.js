// Global constants
const canvas = document.getElementById('glCanvas'); 
const gl = canvas.getContext('webgl2');

if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
}
halfWidth = canvas.width / 2;
halfHeight = canvas.height / 2;

renderQuadrants() ;

function renderQuadrants() {
    const halfWidth = canvas.width / 2;
    const halfHeight = canvas.height / 2;

    gl.enable(gl.SCISSOR_TEST);

    // 좌상 (Red)
    gl.clearColor(1, 0, 0, 1.0);
    gl.viewport(0, halfHeight, halfWidth, halfHeight);
    gl.scissor(0, halfHeight, halfWidth, halfHeight);
    render();

    // 우상 (Green)
    gl.clearColor(0, 1, 0, 1.0);
    gl.viewport(halfWidth, halfHeight, halfWidth, halfHeight);
    gl.scissor(halfWidth, halfHeight, halfWidth, halfHeight);
    render();

    // 좌하 (Blue)
    gl.clearColor(0, 0, 1, 1.0);
    gl.viewport(0, 0, halfWidth, halfHeight);
    gl.scissor(0, 0, halfWidth, halfHeight);
    render();

    // 우하 (Yellow)
    gl.clearColor(1, 1, 0, 1.0);
    gl.viewport(halfWidth, 0, halfWidth, halfHeight);
    gl.scissor(halfWidth, 0, halfWidth, halfHeight);
    render();

    gl.disable(gl.SCISSOR_TEST); // 끝나고 해제하는 함수
}

// Render loop
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);    
}

// Resize viewport when window size changes
window.addEventListener('resize', () => {
    const size = Math.min(window.innerWidth, window.innerHeight);
    canvas.width = size ;
    canvas.height = size ;
    gl.viewport(0, 0, canvas.width, canvas.height);
    renderQuadrants() ;
});

