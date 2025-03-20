/*-------------------------------------------------------------------------
02hw_2020163053.js

1) 처음 실행했을 때, canvas의 크기는 600 x 600 이어야 합니다.
2) 처음 실행했을 때, 정사각형의 한 변의 길이는 0.2 이며, 정사각형은 canvas 중앙에 위치 합니다.
3) 화살표 key를 한번 누를 때 x 또는 y 방향으로 +0.01 또는 -0.01씩 이동합니다.
4) 이동된 사각형의 좌표는 vertex shader에서 uniform variable을 이용하여 수정합니다.
5) 정사각형은 index를 사용하지 않고 draw하며 primitive는 TRIANGLE_FAN을 사용합니다.
6) Shader 들은 독립된 파일로 저장하여 읽어 들여야 합니다.
7) “Use arrow keys to move the rectangle” message를 canvas 위에 표시합니다.
8) resizeAspectRatio() utility function을 이용하여 
가로와 세로의 비율이 1:1 을 항상 유지하도록 합니다.  
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText} from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;   // shader program
let vao;      // vertex array object

let moveX = 0.0; //방향키를 누를때마다 이동하는 수평 좌표 누적거리
let moveY = 0.0; //방향키를 누를때마다 이동하는 수직 좌표 누적거리

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }
    canvas.width = 600;
    canvas.height = 600; //조건1

    resizeAspectRatio(gl, canvas);

    // Initialize WebGL settings
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    return true;
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function setupKeyboardEvents() {
    //HINT
    // 꾹 키를 누르는 순간 동안 발생
    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowUp' && moveY<0.9 ){
            moveY += 0.01;
        } 
        else if(event.key === 'ArrowDown' && moveY>-0.9 ){
            moveY -= 0.01;
        }
        else if(event.key === 'ArrowLeft' && moveX>-0.9){
            moveX -= 0.01;
        }
        else if(event.key === 'ArrowRight' && moveX<0.9){
            moveX += 0.01;
        }
    });
    //누른 순간 발생하는 경우
    document.addEventListener('keyup', (event) => {
        if (event.key === 'ArrowUp' && moveY<0.9 ){
            moveY += 0.01;
        } 
        else if(event.key === 'ArrowDown' && moveY>-0.9 ){
            moveY -= 0.01;
        }
        else if(event.key === 'ArrowLeft' && moveX>-0.9){
            moveX -= 0.01;
        }
        else if(event.key === 'ArrowRight' && moveX<0.9){
            moveX += 0.01;
        }
    });
}

function setupBuffers() {
    const vertices = new Float32Array([
        -0.1, -0.1, 0.0,  // Bottom left
        -0.1,  0.1, 0.0,   // Top left
         0.1,  0.1, 0.0,   // Top right
         0.1, -0.1, 0.0  // Bottom right
    ]);

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    shader.setAttribPointer('aPos', 3, gl.FLOAT, false, 0, 0);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    let color = [1.0, 0.0, 0.0, 1.0];

    shader.setVec4("uColor", color);
    shader.setFloat("moveX",moveX);
    shader.setFloat("moveY",moveY);

    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    requestAnimationFrame(() => render());
}

async function main() {
    try {
        // WebGL 초기화
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }

        // 셰이더 초기화
        await initShader();

        // setup text overlay (조건7)
        setupText(canvas, "Use arrow keys to move the rectangle", 1);
        
        // 키보드 이벤트 설정
        setupKeyboardEvents();

        // 나머지 초기화
        setupBuffers(shader);
        shader.use();
        
        // 렌더링 시작
        render();

        return true;

    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}

// call main function
main().then(success => {
    if (!success) {
        console.log('프로그램을 종료합니다.');
        return;
    }
}).catch(error => {
    console.error('프로그램 실행 중 오류 발생:', error);
});
