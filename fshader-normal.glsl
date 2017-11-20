#version 300 es
precision mediump float;

in vec3 H;
in vec3 N;
in vec3 vT;
in vec3 vN;

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
uniform sampler2D normMap;
uniform sampler2D cloudMap;
uniform int mode;

void main()
{
    vec3 e = normalize(-Position.xyz);
    vec3 l = normalize(LightPosition - Position.xyz);
    vec3 h = normalize(H);
    vec3 n = normalize(N);
    vec3 t = normalize(vT);
    vec3 norm = normalize(vN);

    vec3 light_direction = normalize(-LightPosition);

    vec4 amb;
    vec4 diff;
    vec4 spec;

    // Cosine of 80º is -0.17; Cosine of 100º is 0.17. Using this, I made a weighted average to
    // create a gradient change. This allows my change from night to day appear as a slow shift
    // Regular Globe
    if(mode == 0 || mode == 1){
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
    // Normal Map
    else if(mode == 2) {
        vec3 biN = normalize(cross(norm, t));
        mat4 coordMatrix = mat4(vec4(t, 0), vec4(biN, 0), vec4(norm, 0), Position);
        vec4 newN = texture(normMap, fTexCoord);
        newN = newN * 2.0 - 1.0;
        newN = coordMatrix * newN;

        amb = texture(normMap, fTexCoord) * ambient_light; // ambient&diffuse properties for the light formula
        diff = max(dot(l,newN.xyz), 0.0) * texture(normMap, fTexCoord) * light_color; // diffuse term of the light formula
        spec = SpecularColor * light_color * pow(max(dot(n,biN), 0.0), SpecularExponent); // specular property of the light formula
    }
    // Clouds
    else if(mode == 9){
        amb = texture(cloudMap, fTexCoord) * ambient_light;
        diff = max(dot(l,n), 0.0) * texture(cloudMap, fTexCoord) * light_color;
        spec = vec4(0,0,0,0); // Clouds aren't shiny
    }

    if(dot(l,n) < 0.0) {
        spec = vec4(0,0,0,0);
    }

    fColor = amb + diff + spec;
}