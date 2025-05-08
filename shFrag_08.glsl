#version 300 es

precision highp float;

out vec4 FragColor;
in vec3 fragPos;  
in vec3 normal;  

struct Material {
    vec3 diffuse;      // diffuse 수정
    vec3 specular;     // 표면의 specular color
    float shininess;   // specular 반짝임 정도
};

struct Light {
    //vec3 position;
    vec3 direction;
    vec3 ambient; // ambient 적용 strength
    vec3 diffuse; // diffuse 적용 strength
    vec3 specular; // specular 적용 strength
};

uniform Material material;
uniform Light light;
uniform vec3 u_viewPos;

// 조건8. Toon shading을 위한 단계 값을 저장하는 변수
uniform int u_toonLevels;

// 조건8. 양자화 계산을 위한 함수 정의하는 부분
float quantize(float value, int levels) {
    float stepSize = 1.0 / float(levels);
    return stepSize * floor(value / stepSize);
}
void main() {
    // ambient
    vec3 ambient = light.ambient * material.diffuse;
  	
    // diffuse 
    vec3 norm = normalize(normal);
    //vec3 lightDir = normalize(light.position - fragPos);
    vec3 lightDir = normalize(light.direction);
    float dotNormLight = dot(norm, lightDir);

    //조건8. 양자화_ diff value에 대해 적용
    float diff = max(dotNormLight, 0.0);
    diff = quantize(diff, u_toonLevels); 

    vec3 diffuse = light.diffuse * diff * material.diffuse;  
    
    // specular
    vec3 viewDir = normalize(u_viewPos - fragPos);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = 0.0;
    
    //조건8. 양자화_ spec value에 대해 적용
    if (dotNormLight > 0.0) {
        spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
        spec = quantize(spec, u_toonLevels);

    }
    vec3 specular = light.specular * spec * material.specular;  
        
    vec3 result = ambient + diffuse + specular;
    FragColor = vec4(result, 1.0);
} 