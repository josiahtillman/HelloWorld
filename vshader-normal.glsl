#version 300 es

in vec4 vPosition;
in vec4 vNormal;
in vec4 vTangent;
in vec4 vSpecularColor;
in vec2 texCoord;

out vec3 H;
out vec3 N;
out vec3 vT;
out vec3 vN;
out vec2 fTexCoord;
out vec3 LightPosition;
out vec4 Position;

out vec4 SpecularColor;
out float SpecularExponent;

uniform mat4 model_view;
uniform mat4 projection;
uniform vec4 light_position;
uniform float specular_exponent;


void main() {
    vec4 veyepos = model_view*vPosition; // world to eye space

    // using .xyz is known as swizzling. Grabs the first three values in the vector
    vec3 L = normalize(light_position.xyz - veyepos.xyz); // light vector
    vec3 E = normalize(-veyepos.xyz); // vector pointing to camera
    H = normalize(L+E); // halfway vector
    N = normalize(model_view*vNormal).xyz; // normal vector

    vN = normalize(model_view * vNormal).xyz;
    vT = normalize(model_view * vTangent).xyz;

    fTexCoord = texCoord;

    SpecularColor = vSpecularColor;
    SpecularExponent = specular_exponent;
    LightPosition = light_position.xyz;
    Position = veyepos;

    gl_Position = projection * veyepos;
}