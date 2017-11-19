#version 300 es
precision mediump float;

in vec3 H;
in vec3 N;

in vec4 SpecularColor;
in float SpecularExponent;
in vec4 Color;
in vec2 fTexCoord;
in vec3 LightPosition;
in vec4 Position;

out vec4 fColor;

uniform vec4 light_color;
uniform vec4 ambient_light;
uniform sampler2D colorMap;
uniform sampler2D nightMap;
uniform sampler2D specMap;
uniform int mode;

void main()
{
    vec3 e = normalize(-Position.xyz);
    vec3 l = normalize(LightPosition - Position.xyz);
    vec3 h = normalize(H);
    vec3 n = normalize(N);

    vec3 light_direction = normalize(-LightPosition);

    vec4 amb;
    vec4 diff;
    vec4 spec;

    // Cosine of 80º is -0.17; Cosine of 100º is 0.17. Using this, I made a weighted average to
    // create a gradient change. This allows my change from night to day appear as a slow shift
    if(mode == 0){
        if(dot(light_direction, n) <= cos(radians(80.0)) && dot(light_direction, n) >= cos(radians(100.0))) {
            amb = (texture(nightMap, fTexCoord) * ambient_light) * ((dot(light_direction, n) + 0.17) / 0.34);
            amb = amb + (texture(colorMap, fTexCoord) * ambient_light) * ((0.34 - (dot(light_direction, n) + 0.17)) / 0.34);
            diff = (max(dot(l,n), 0.0) * texture(nightMap, fTexCoord) * light_color) * ((dot(light_direction, n) + 0.17) / 0.34);
            diff = diff + (max(dot(l,n), 0.0) * texture(colorMap, fTexCoord) * light_color) * ((0.34 - (dot(light_direction, n) + 0.17)) / 0.34);
        } else if(dot(light_direction, n) >= cos(radians(80.0))) {
            amb = texture(nightMap, fTexCoord) * ambient_light; // ambient&diffuse properties for the light formula
            diff = max(dot(l,n), 0.0) * texture(nightMap, fTexCoord) * light_color; // diffuse term of the light formula
        } else if(dot(light_direction, n) <= cos(radians(100.0))) {
            amb = texture(colorMap, fTexCoord) * ambient_light; // ambient&diffuse properties for the light formula
            diff = max(dot(l,n), 0.0) * texture(colorMap, fTexCoord) * light_color; // diffuse term of the light formula
        }
        spec = texture(specMap, fTexCoord) * light_color * pow(max(dot(n,h), 0.0), texture(specMap, fTexCoord).a * SpecularExponent); // specular property of the light formula
    }
    if(mode == 1){
        amb = texture(specMap, fTexCoord) * ambient_light; // ambient&diffuse properties for the light formula
        diff = max(dot(l,n), 0.0) * texture(specMap, fTexCoord) * light_color; // diffuse term of the light formula
        spec = texture(specMap, fTexCoord) * light_color * pow(max(dot(n,h), 0.0), texture(specMap, fTexCoord).a * SpecularExponent); // specular property of the light formula
    }

    if(dot(l,n) < 0.0) {
        spec = vec4(0,0,0,1);
    }

    fColor = amb + diff + spec;
}