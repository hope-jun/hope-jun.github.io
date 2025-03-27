/*-------------------------------------------------------------------------
hw03_2020163053.js
team : 12
name : 전희망 (2020163053), 김휘영 (2023148033)
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

// Global variables
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let isInitialized = false;  // main이 실행되는 순간 true로 change
// ㄴmain이 두번 실행되는 것을 방지함 => DOMContentLoaded event
let shader;
let vao;
let positionBuffer; // 2D position을 위한 VBO (Vertex Buffer Object)
let isDrawing = false; // mouse button을 누르고 있는 동안 true로 change

let isComplete = false; // 교차점 계산이 완료되었는지 여부를 나타내는 것
let intersection_points = []; // 교차점에 대한 (x,y)좌표를 저장하는 것

let startPoint = null;  // mouse button을 누른 위치(처음 마우스를 누른 위치)
let tempEndPoint = null; // mouse를 움직이는 동안의 위치(버튼을 떼지 않고 움직이는 동안 끝점을 계속 저장하는 var)
let lines = []; // 그려진 선분들의 끝점들을 저장하는 array
let textOverlay; // 1st line segment 정보 표시 => 상단에 text 표시
let textOverlay2; // 2nd line segment 정보 표시 => 상단에 text 표시
let textOverlay3; // 3rd line segment 정보 표시 => 상단에 text 표시
let axes = new Axes(gl, 0.85); // x, y axes 그려주는 object (see util.js)

// DOMContentLoaded event
// 가장 앞에 위치시킨 event
// 1) 모든 HTML 문서가 완전히 load되고 parsing된 후 발생
// 2) 모든 resource (images, css, js 등) 가 완전히 load된 후 발생
// 3) 모든 DOM 요소가 생성된 후 발생
// DOM: Document Object Model로 HTML의 tree 구조로 표현되는 object model 
// ㄴHTML 관련 obj들이 모두 로드 된 이후에 발생되는 event라고 생각하면 됨.
// 모든 code를 이 listener 안에 넣는 것은 mouse click event를 원활하게 처리하기 위해서임
// mouse input을 사용할 때 이와 같이 main을 call 한다. 

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) { // true인 경우는 main이 이미 실행되었다는 뜻이므로 다시 실행하지 않음
        console.log("Already initialized");
        return;
    }
    // 비동기적인 실행을 유지하기 위함
    // 모든 HTML 요소가 로드되기 이전에 main이 실행되는 것을 방지하는 차원에서의 처리라고 볼 수 있음

    main().then(success => { // call main function
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true; //main이 처음 실행될때 해당 var을 True로 바꿔서 재실행 방지
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;

    resizeAspectRatio(gl, canvas);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.2, 0.3, 1.0);

    return true;
}

function setupBuffers() {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0); // x, y 2D 좌표
    // point 좌표 이므로 위에 변수의 수를 2로 입력(2차원)
    gl.bindVertexArray(null);
}

// 좌표 변환 함수: 캔버스 좌표 => WebGL 좌표로 변환
// 캔버스 좌표와 WebGL 좌표가 다르므로 이를 변환해야할 필요가 있음
// 캔버스 좌표: 캔버스 좌측 상단이 (0, 0), 우측 하단이 (canvas.width, canvas.height)
// WebGL 좌표 (NDC): 캔버스 좌측 하단이 (-1, -1), 우측 상단이 (1, 1)
function convertToWebGLCoordinates(x, y) {
    return [
        (x / canvas.width) * 2 - 1,  // x/canvas.width 는 0 ~ 1 사이의 값, 이것을 * 2 - 1 하면 -1 ~ 1 사이의 값
        -((y / canvas.height) * 2 - 1) // y canvas 좌표는 상하를 뒤집어 주어야 하므로 -1을 곱함
        // y좌표의 방향을 바꾸기 위해 -1 곱해주는 과정 존재
    ];
}

function setupMouseEvents() {
    // 기존에는 anonymous func으로 했지만, 이와 같이 이름 지정도 가능함!
    // 1. MouseDown : 마우스 버튼을 눌렀을때
    function handleMouseDown(event) {
        event.preventDefault(); // 이미 존재할 수 있는 기본 동작을 방지
        event.stopPropagation(); // event가 상위 요소 (div, body, html, etc.)로 전파되지 않도록 방지

        const rect = canvas.getBoundingClientRect(); // canvas를 나타내는 rect 객체를 반환
        const x = event.clientX - rect.left;  // canvas 내 x 좌표
        const y = event.clientY - rect.top;   // canvas 내 y 좌표
        
        if (!isDrawing && lines.length <2) { // lines.length <2 조건 추가 확인하기
            // 1번 또는 2번 선분을 그리고 있는 도중이 아닌 경우 (즉, mouse down 상태가 아닌 경우)
            // 캔버스 좌표를 WebGL 좌표로 변환하여 선분의 시작점을 설정
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            startPoint = [glX, glY];
            isDrawing = true; // 이제 mouse button을 놓을 때까지 계속 true로 둠. 즉, mouse down 상태가 됨
            isCircle = false; // 첫번째 원을 그린 이후이므로...
        }
    }
    // 2. MouseMove : 누르고 이동하는 때
    function handleMouseMove(event) {
        if (isDrawing) { // 1번 또는 2번 선분을 그리고 있는 도중인 경우
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            tempEndPoint = [glX, glY]; // 임시 선분의 끝 point
            render(); // 임시 선분을 계속 그려주는 경우
        }
    }
    // 3. Mouse Up : 마우스 버튼을 땠을 때
    function handleMouseUp() {
        if (isDrawing && tempEndPoint) {

            // lines.push([...startPoint, ...tempEndPoint])
            //   : startPoint와 tempEndPoint를 펼쳐서 하나의 array로 합친 후 lines에 추가
            // ex) lines = [] 이고 startPoint = [1, 2], tempEndPoint = [3, 4] 이면,
            //     lines = [[1, 2, 3, 4]] 이 됨 => line array 안에 시작점과 끝점에 대한 각 좌표를 풀어서 저장하는 형태를 이용
            // ex) lines = [[1, 2, 3, 4]] 이고 startPoint = [5, 6], tempEndPoint = [7, 8] 이면,
            //     lines = [[1, 2, 3, 4], [5, 6, 7, 8]] 이 됨 => 두번째 선분을 그린 경우 2차원 array 형태로 저장되는 형태를 볼 수 있음.

            lines.push([...startPoint, ...tempEndPoint]); 

            // information을 print하기 위한 과정 진행
            // 	•	toFixed(2) => 소수점 이하 두 자리까지 반올림한 문자열을 반환
            if (lines.length == 1) {
                const radius = Math.sqrt((lines[0][2]-lines[0][0])**2 + (lines[0][3]-lines[0][1])**2);
                updateText(textOverlay, "Circle: center (" + lines[0][0].toFixed(2) + ", " + lines[0][1].toFixed(2) + 
                    ") radius = " + radius.toFixed(2));
                // updateText(textOverlay2, "Click and drag to draw the line segment");
            }
            else { // lines.length == 2
                updateText(textOverlay2, "Line segment: (" + lines[1][0].toFixed(2) + ", " + lines[1][1].toFixed(2) + 
                    ") ~ (" + lines[1][2].toFixed(2) + ", " + lines[1][3].toFixed(2) + ")");
            }
            isDrawing = false;
            startPoint = null;
            tempEndPoint = null;
            render();
        }
    }

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.use();
    
    // 저장된 lines를 이용하여 그리기

    let num = 0;  // num은 현재 그려진 element의 갯수를 의미하도록 지정함.

    for (let line of lines) {
        // 1st circle render 하는 경우(num=0)
        if(num == 0){
            shader.setVec4("u_color", [1.0, 0.0, 1.0, 1.0]); // 첫번째 원 color는 red
            // uniform var로 color를 받아오는 경우
            let vertices =[];
            let numSegments = 100;
            //원을 그리기 100개로 쪼개서 2*pi / numSegments
            for (let i =0 ; i< numSegments ; i++){
                //원의 중심 = (cx,cy)
                let cx = lines[0][0];
                let cy = lines[0][1];
                //원의 반지름 계산
                let r =  Math.sqrt((lines[0][2]-lines[0][0])**2 + (lines[0][3]-lines[0][1])**2);
    
                //원 계산
                let theta = (i / numSegments) * 2 * Math.PI;
                let x = cx + r * Math.cos(theta);
                let y = cy + r * Math.sin(theta);
                let line = [];
                vertices.push(x, y);
            }
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINE_LOOP, 0, numSegments);
        }
         // 2nd line render 하는 경우(num=1)
        else{
            let line = lines[1];
            shader.setVec4("u_color", [0.0, 0.0, 1.0, 1.0]); // 두번째 line의 색 => Blue
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINES, 0, 2);
            isComplete = true;
        }
        num++
    }

    // 임시 선 그리기 - 1st circle(num==0인 경우)
    if (isDrawing && startPoint && tempEndPoint&& num==0) {
        shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]); // 임시 선분의 color는 회색
        let vertices =[];
        let numSegments = 100;
        //원을 그리기 100개로 쪼개서 2*pi / numSegments
        for (let i =0 ; i< numSegments ; i++){
            //원의 중심 = (cx,cy)
            let cx = startPoint[0];
            let cy = startPoint[1];

            //원의 반지름 계산
            let r =  Math.sqrt((tempEndPoint[0]-startPoint[0])**2 + (tempEndPoint[1]-startPoint[1])**2);

            //원 계산
            let theta = (i / numSegments) * 2 * Math.PI;
            let x = cx + r * Math.cos(theta);
            let y = cy + r * Math.sin(theta);
            let line = [];
            vertices.push(x, y);
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINE_LOOP, 0, numSegments);
    }

    // 임시 선 그리기 - 2nd line(num==1인 경우)
    if (isDrawing && startPoint && tempEndPoint && num ==1) {
        shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]); // 임시 선분의 color는 회색
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...startPoint, ...tempEndPoint]), 
                        gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINES, 0, 2);
    }

    // intersection point 계산 및 점 표현
    // circle과 line 2개를 모두 입력받은 경우이므로 num=2
    if(isComplete){
        /*
        이용할 수식 정리
        A = a^2 + c^2, B = 2(ab-ae+cd-cf), C = b^2+d^2+e^2+f^2-r^2-2(be+df)
        => 판별식 D = B^2 -4AC
    
        1. 원의 방정식_implicit form : (x-e)^2 + (y-f)^2 -r^2 =0
            center = (e,f), r = radius
    
        2. 직선의 방정식_parametric form : x(t)=at +b, y(t) = ct +d
            a = x2-x1, b=x1, c = y2-y1, d= y1
        */
       let a = lines[1][2] - lines[1][0];
       let b = lines[1][0];
       let c = lines[1][3] - lines[1][1];
       let d = lines[1][1];
    
       let e = lines[0][0];
       let f = lines[0][1];
       let r = Math.sqrt((lines[0][2]-lines[0][0])**2 + (lines[0][3]-lines[0][1])**2);
    
       let A = a**2 + c**2;
       let B = 2*(a*b-a*e+c*d-c*f);
       let C = b**2 + d**2 + e**2 + f**2 - r**2 - 2*(b*e+d*f);
    
       let D = B**2 - 4*A*C;
        
       if (D<0){ // 접점이 없는 경우
        textOverlay3 = setupText(canvas, "No intersection", 3);
       }
       else if(D>0){ // 2개 접점인 경우
        let t1 = (-1*B + Math.sqrt(D)) / (2*A);
        let t2 = (-1*B - Math.sqrt(D)) / (2*A);

        // 각 t1, t2가 0~1 범위에 유효하게 있는지 알아보는 변수
        let t1_valid = (t1 >= 0 && t1 <=1); 
        let t2_valid = (t2 >= 0 && t2 <=1);

        if(t1_valid && t2_valid){ //둘다 유효한 경우
            intersection_points.push(a*t1 + b, c*t1 +d);
            intersection_points.push(a*t2 + b, c*t2 +d);
            textOverlay3 = setupText(canvas, "Intersection Points: 2 Point 1: (" + intersection_points[0].toFixed(2) + ", " + intersection_points[1].toFixed(2) + 
                        ") Point 2: (" + intersection_points[2].toFixed(2) + ", " + intersection_points[3].toFixed(2)+")", 3);
            
            shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]); // Points의 색 => Yellow
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(intersection_points), gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.POINTS, 0, 2);
        }
        else if(!t1_valid && !t2_valid){ //둘다 유효하지 않은 경우 = 접점 없는 경우
            textOverlay3 = setupText(canvas, "No intersection", 3);
        }
        else{ 
            let t;
            if(t1_valid && !t2_valid){
                t = t1;
            }
            else{
                t = t2
            }
            intersection_points.push(a*t + b, c*t +d);
            textOverlay3 = setupText(canvas, "Intersection Points: 1 Point 1: (" + intersection_points[0].toFixed(2) + ", " + intersection_points[1].toFixed(2) + 
            ")", 3);
            
            shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]); // Points의 색 => Yellow
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(intersection_points), gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.POINTS, 0, 1);
        }

       }
       else if(D == 0){ // 1개 접점인 경우
        let t = (-1*B) / (2*A);
        intersection_points.push(a*t + b, c*t +d);
        textOverlay3 = setupText(canvas, "Intersection Points: 1 Point 1: (" + intersection_points[0].toFixed(2) + ", " + intersection_points[1].toFixed(2) + 
        ")", 3);
        
        shader.setVec4("u_color", [1.0, 0.0, 1.0, 1.0]); // Points의 색 => Yellow
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(intersection_points), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.POINTS, 0, 2);
       }
    }

    // axes 그리기
    // transformation matrix 관련 내용(다음 시간에 살펴볼 내용) _ 일단은 알고만 있기
    axes.draw(mat4.create(), mat4.create()); // 두 개의 identity matrix를 parameter로 전달
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
            return false; 
        }

        // 셰이더 초기화
        await initShader();
        
        // 나머지 초기화
        setupBuffers();
        shader.use();

        // 텍스트 초기화
        textOverlay = setupText(canvas, "", 1);
        textOverlay2 = setupText(canvas, "", 2);

        // 마우스 이벤트 설정
        setupMouseEvents();
        
        // 초기 렌더링
        render();

        return true;
        
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
