/*-----------------------------------------------------------------------------
class squarePyramid
- team : 12
- name : 전희망 (2020163053), 김휘영 (2023148033)
-----------------------------------------------------------------------------*/

export class squarePyramid {
    constructor(gl, options = {}) {
        this.gl = gl;
        
        // Creating VAO and buffers
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        // Initializing data(각 vertex를 정의)
        // v0 = (0.5, 0.0 , 0.5) : 밑면 오른쪽 앞
        // v1 = (-0.5, 0.0 , 0.5) : 밑면 왼쪽 앞
        // v2 = (-0.5, 0.0 , -0.5) : 밑면 왼쪽 뒤
        // v3 = (0.5, 0.0 , -0.5) : 밑면 오른쪽 뒤
        // v4 = (0.0, 1.0 , 0.0) : 상단 꼭짓점
        // 총 18개 vertex : [밑면 사각형 (v0,v1,v2,v3) 6개] + [각 옆면 4개의 삼각형]* [삼각형 당 vertex 3개] = 18개
        this.vertices = new Float32Array([ 
            // bottom rectangle  (v0,v1,v2,v3)
            0.5, 0.0,  0.5,   -0.5, 0.0,  0.5,   -0.5, 0.0, -0.5,   // v0, v1, v2
            0.5, 0.0,  0.5,   -0.5, 0.0, -0.5,    0.5, 0.0, -0.5,   // v0, v2, v3
            // front triangle (v0,v4,v1)
            0.5, 0.0 , 0.5, 0.0, 1.0 , 0.0, -0.5, 0.0 , 0.5,
            // right triangle   (v0,v3,v4)
            0.5, 0.0 , 0.5, 0.5, 0.0 , -0.5, 0.0, 1.0 , 0.0,
            // back triangle   (v3,v2,v4)
            0.5, 0.0 , -0.5, -0.5, 0.0 , -0.5, 0.0, 1.0 , 0.0,
            // left triangle (v1,v4,v2)
            -0.5, 0.0 , 0.5, 0.0, 1.0 , 0.0, -0.5, 0.0 , -0.5
        ]);

        // 각 vertex의 Normal vector 정의(cross product으로 계산 진행)
        this.normals = new Float32Array([
        // bottom rectangle  (v0,v1,v2,v3)
        0, -1, 0,   0, -1, 0,   0, -1, 0,
        0, -1, 0,   0, -1, 0,   0, -1, 0,
        // front triangle (v0,v4,v1)
        0.0, 0.5, 1.0, 0.0, 0.5, 1.0, 0.0, 0.5, 1.0,
        // right triangle   (v0,v3,v4)
        1.0, 0.5, 0.0, 1.0, 0.5, 0.0, 1.0, 0.5, 0.0,
        // back triangle   (v3,v2,v4)
        0.0, 0.5, -1.0, 0.0, 0.5, -1.0, 0.0, 0.5, -1.0,
        // left triangle (v1,v4,v2)
        1.0, -0.5, 0.0, 1.0, -0.5, 0.0, 1.0, -0.5, 0.0
        ]);

        // squarePyramid.ver
        // if color is provided, set all vertices' color to the given color
        if (options.color) { // 총 18개의 정점 반영한 option color 
            for (let i = 0; i < 18 * 4; i += 4) {
                this.colors.set(options.color, i);
            }
        }
        else {
            this.colors = new Float32Array([
                // bottom face (v0,v1,v2,v3) - blue
                0, 0, 1, 1,   0, 0, 1, 1,   0, 0, 1, 1,
                0, 0, 1, 1,   0, 0, 1, 1,   0, 0, 1, 1,
                // front face - red
                1, 0, 0, 1,   1, 0, 0, 1,   1, 0, 0, 1,   
                // right face  - yellow
                1, 1, 0, 1,   1, 1, 0, 1,   1, 1, 0, 1,
                // back face - magenta 
                1, 0, 1, 1,   1, 0, 1, 1,   1, 0, 1, 1,
                // left face  - cyan
                0, 1, 1, 1,   0, 1, 1, 1,   0, 1, 1, 1
            ]);
        }

        this.texCoords = new Float32Array([
            // Bottom face (2 triangles)
            1, 1,   0, 1,   0, 0,
            1, 1,   0, 0,   1, 0,
            // Front face
            0, 0,   0.5, 1,   1, 0,
            // Right face
            0, 0,   0.5, 1,   1, 0,
            // Back face
            0, 0,   0.5, 1,   1, 0,
            // Left face
            0, 0,   0.5, 1,   1, 0
        ]);

        this.initBuffers();

    }

    copyVertexNormalsToNormals() {
        this.normals.set(this.vertexNormals);
    }

    copyFaceNormalsToNormals() {
        this.normals.set(this.faceNormals);
    }

    initBuffers() {
        const gl = this.gl;

        // 버퍼 크기 계산
        const vSize = this.vertices.byteLength;
        const nSize = this.normals.byteLength;
        const cSize = this.colors.byteLength;
        const tSize = this.texCoords.byteLength;
        // 전체 버퍼 사이즈
        const totalSize = vSize + nSize + cSize + tSize;

        gl.bindVertexArray(this.vao);

        // VBO에 데이터 복사
        // gl. bufferSubData(target, offset, data) : target buffer의
        //  offset 위치부터 data를 copy(즉, data를 buffer의 일부부에만 카피)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, totalSize, gl.STATIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals); // = vSize 만큼 뛰어남고, normal vec 정보 뭉치를 가져와라(카피)
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize, this.colors);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize + cSize, this.texCoords);

        // EBO에 인덱스 데이터 복사
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        // vertex attributes 설정
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);  // position
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, vSize);  // normal
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, vSize + nSize);  // color(4개 짜리 데이터)
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, vSize + nSize + cSize);  // texCoord

        // vertex attributes 활성화
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);
        gl.enableVertexAttribArray(3);

        // 버퍼 바인딩 해제
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    updateNormals() {
        const gl = this.gl;
        const vSize = this.vertices.byteLength;

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        
        // normals 데이터만 업데이트
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    draw(shader) {
        const gl = this.gl;
        shader.use();
        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLES, 0, 18); // 18개의 삼각형 정점 사용한 예시
        gl.bindVertexArray(null);
    }

    delete() {
        const gl = this.gl;
        gl.deleteBuffer(this.vbo);
        gl.deleteBuffer(this.ebo);
        gl.deleteVertexArray(this.vao);
    }
} 