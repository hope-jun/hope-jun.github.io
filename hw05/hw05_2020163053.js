/*-------------------------------------------------------------------------
hw05_2020163053.js
- team : 12
- name : 전희망 (2020163053), 김휘영 (2023148033)
---------------------------------------------------------------------------*/

import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';
// 조건7. squarePyramid.js를 ../hw05/Homework05 폴더 안에 둠.
import { squarePyramid } from '../hw05/Homework05/squarePyramid.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let startTime;
let lastFrameTime;

let isInitialized = false;

let viewMatrix = mat4.create();
let projMatrix = mat4.create();
let modelMatrix = mat4.create(); 
const cameraCircleRadius = 3.0; // 조건4. 카메라 회전 반지름 = 3 (xz plane 상에서 회전)
const cameraCircleHeight = 5.0; // 조건4. 카메라 y축(높이) 0 ~ 10 반복 (sin함수 활용, r = 5)
const cameraCircleSpeed = 90.0; // 조건5. 카메라 xz 상 회전 속도 90 deg/sec
const cameraHeightSpeed = 45.0; // 조건5. 카메라 y 상 이동 속도 45 deg/sec

const pyramid = new squarePyramid(gl);
const axes = new Axes(gl, 1.8);

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('program terminated');
            return;
        }
        isInitialized = true;
    }).catch(error => {
        console.error('program terminated with error:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }
    // 조건 1. 초기 canvas 크기 700 * 700
    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.2, 0.3, 1.0);
    
    return true;
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert_05.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag_05.glsl');
    return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function render() {
    const currentTime = Date.now();
    // deltaTime = (현재 시각) - (지난 프레임의 시각)
    const deltaTime = (currentTime - lastFrameTime) / 1000.0; // convert to second
    // elapsed time = (시작부터의 누적시간)
    const elapsedTime = (currentTime - startTime) / 1000.0; // convert to second
    lastFrameTime = currentTime;

    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // Model transformation matrix(사각뿔을 위한 model matrix)
    mat4.identity(modelMatrix);

    // Viewing transformation matrix(COP 지정을 위함 = camX, camY, camZ로 지정)
    let camY = 5.0 + cameraCircleHeight * Math.sin(glMatrix.toRadian(cameraHeightSpeed * elapsedTime))
    let camX = cameraCircleRadius * Math.sin(glMatrix.toRadian(cameraCircleSpeed * elapsedTime));
    let camZ = cameraCircleRadius * Math.cos(glMatrix.toRadian(cameraCircleSpeed * elapsedTime));
    mat4.lookAt(viewMatrix, 
        vec3.fromValues(camX, camY, camZ), // camera position
        vec3.fromValues(0, 0, 0), // look at origin
        vec3.fromValues(0, 1, 0)); // up vector

    // drawing the squarePyramid
    shader.use();  // using the squarePyramid's shader
    shader.setMat4('u_model', modelMatrix);
    shader.setMat4('u_view', viewMatrix);
    shader.setMat4('u_projection', projMatrix);
    pyramid.draw(shader);

    // drawing the axes (using the axes's shader)
    axes.draw(viewMatrix, projMatrix);

    requestAnimationFrame(render);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL initialization failed');
        }
        
        shader = await initShader();

        // Projection transformation matrix(기존 예제10과 동일하게 적용)
        mat4.perspective(
            projMatrix,
            glMatrix.toRadian(60),  // field of view (fov, degree)
            canvas.width / canvas.height, // aspect ratio => resize되는 경우 projM을 제 계산해야하지만 현재는 생략
            0.1, // near
            100.0 // far
        );

        // starting time (global variable) for animation
        startTime = lastFrameTime = Date.now();

        // call the render function the first time for animation
        requestAnimationFrame(render);

        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('Failed to initialize program');
        return false;
    }
}
