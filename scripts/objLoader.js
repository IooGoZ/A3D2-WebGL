(function (window, document, undefined) {
  'use strict';
  // Thanks to CMS for the startsWith function
  // http://stackoverflow.com/questions/646628/javascript-startswith/646643#646643
  if (typeof String.prototype.startsWith !== 'function') {
    String.prototype.startsWith = function (str) {
      return this.slice(0, str.length) === str;
    };
  }
  var OBJ = {};
  window.OBJ = OBJ;

  /**
   * The main Mesh class. The constructor will parse through the OBJ file data
   * and collect the vertex, vertex normal, texture, and face information. This
   * information can then be used later on when creating your VBOs. See
   * OBJ.initMeshBuffers for an example of how to use the newly created Mesh
   *
   * @class Mesh
   * @constructor
   *
   * @param {String} objectData a string representation of an OBJ file with newlines preserved.
   */
  OBJ.Mesh = function (objectData) {
    /*
     The OBJ file format does a sort of compression when saving a model in a
     program like Blender. There are at least 3 sections (4 including textures)
     within the file. Each line in a section begins with the same string:
       * 'v': indicates vertex section
       * 'vn': indicates vertex normal section
       * 'f': indicates the faces section
       * 'vt': indicates vertex texture section (if textures were used on the model)
     Each of the above sections (except for the faces section) is a list/set of
     unique vertices.

     Each line of the faces section contains a list of
     (vertex, [texture], normal) groups
     Some examples:
         // the texture index is optional, both formats are possible for models
         // without a texture applied
         f 1/25 18/46 12/31
         f 1//25 18//46 12//31

         // A 3 vertex face with texture indices
         f 16/92/11 14/101/22 1/69/1

         // A 4 vertex face
         f 16/92/11 40/109/40 38/114/38 14/101/22

     The first two lines are examples of a 3 vertex face without a texture applied.
     The second is an example of a 3 vertex face with a texture applied.
     The third is an example of a 4 vertex face. Note: a face can contain N
     number of vertices.

     Each number that appears in one of the groups is a 1-based index
     corresponding to an item from the other sections (meaning that indexing
     starts at one and *not* zero).

     For example:
         `f 16/92/11` is saying to
           - take the 16th element from the [v] vertex array
           - take the 92nd element from the [vt] texture array
           - take the 11th element from the [vn] normal array
         and together they make a unique Vertex.
     Using all 3+ unique Vertices from the face line will produce a polygon.

     Now, you could just go through the OBJ file and create a new Vertex for
     each face line and WebGL will draw what appears to be the same model.
     However, vertices will be overlapped and duplicated all over the place.

     Consider a cube in 3D space centered about the origin and each side is
     2 units long. The front face (with the positive Z-axis pointing towards
     you) would have a Top Right vertex (looking orthogonal to its normal)
     mapped at (1,1,1) The right face would have a Top Left vertex (looking
     orthogonal to its normal) at (1,1,1) and the top face would have a Bottom
     Right vertex (looking orthogonal to its normal) at (1,1,1). Each face
     has a vertex at the same coordinates, however, three distinct vertices
     will be drawn at the same spot.

     To solve the issue of duplicate Vertices (the `(vertex, [texture], normal)`
     groups), while iterating through the face lines, when a group is encountered
     the whole group string ('16/92/11') is checked to see if it exists in the
     packed.hashindices object, and if it doesn't, the indices it specifies
     are used to look up each attribute in the corresponding attribute arrays
     already created. The values are then copied to the corresponding unpacked
     array (flattened to play nice with WebGL's ELEMENT_ARRAY_BUFFER indexing),
     the group string is added to the hashindices set and the current unpacked
     index is used as this hashindices value so that the group of elements can
     be reused. The unpacked index is incremented. If the group string already
     exists in the hashindices object, its corresponding value is the index of
     that group and is appended to the unpacked indices array.
     */
    var verts = [], vertNormals = [], textures = [], unpacked = {};
    // unpacking stuff
    unpacked.verts = [];
    unpacked.norms = [];
    unpacked.textures = [];
    unpacked.hashindices = {};
    unpacked.indices = [];
    unpacked.index = 0;
    // array of lines separated by the newline
    var lines = objectData.split('\n'), i;
    for (i = 0; i < lines.length; i++) {
      // if this is a vertex
      var line;
      if (lines[i].trim().startsWith('v ')) {
        line = lines[i].trim().split(/\s+/);
        line.shift();
        verts.push(line[0]);
        verts.push(line[1]);
        verts.push(line[2]);
      } else if (lines[i].trim().startsWith('vn')) {
        // if this is a vertex normal
        line = lines[i].trim().split(/\s+/);
        line.shift();
        vertNormals.push(line[0]);
        vertNormals.push(line[1]);
        vertNormals.push(line[2]);
      } else if (lines[i].trim().startsWith('vt')) {
        // if this is a texture
        line = lines[i].trim().split(/\s+/);
        line.shift();
        textures.push(line[0]);
        textures.push(line[1]);
      } else if (lines[i].trim().startsWith('f ')) {
        // if this is a face
        /*
        split this face into an array of Vertex groups
        for example:
           f 16/92/11 14/101/22 1/69/1
        becomes:
          ['16/92/11', '14/101/22', '1/69/1'];
        */
        line = lines[i].trim().split(/\s+/);
        line.shift();
        var quad = false;
        for (var j=0; j<line.length; j++){
            // Triangulating quads
            // quad: 'f v0/t0/vn0 v1/t1/vn1 v2/t2/vn2 v3/t3/vn3/'
            // corresponding triangles:
            //      'f v0/t0/vn0 v1/t1/vn1 v2/t2/vn2'
            //      'f v2/t2/vn2 v3/t3/vn3 v0/t0/vn0'
            if(j === 3 && !quad) {
                // add v2/t2/vn2 in again before continuing to 3
                j = 2;
                quad = true;
            }
            if(line[j] in unpacked.hashindices){
                unpacked.indices.push(unpacked.hashindices[line[j]]);
            }
            else{
                /*
                Each element of the face line array is a Vertex which has its
                attributes delimited by a forward slash. This will separate
                each attribute into another array:
                    '19/92/11'
                becomes:
                    Vertex = ['19', '92', '11'];
                where
                    Vertex[0] is the vertex index
                    Vertex[1] is the texture index
                    Vertex[2] is the normal index
                 Think of faces having Vertices which are comprised of the
                 attributes location (v), texture (vt), and normal (vn).
                 */
                var Vertex = line[ j ].split( '/' );
                /*
                 The verts, textures, and vertNormals arrays each contain a
                 flattend array of coordinates.

                 Because it gets confusing by referring to Vertex and then
                 vertex (both are different in my descriptions) I will explain
                 what's going on using the vertexNormals array:

                 Vertex[2] will contain the one-based index of the vertexNormals
                 section (vn). One is subtracted from this index number to play
                 nice with javascript's zero-based array indexing.

                 Because vertexNormal is a flattened array of x, y, z values,
                 simple pointer arithmetic is used to skip to the start of the
                 vertexNormal, then the offset is added to get the correct
                 component: +0 is x, +1 is y, +2 is z.

                 This same process is repeated for verts and textures.
                 */
                // vertex position
                unpacked.verts.push(verts[(Vertex[0] - 1) * 3 + 0]);
                unpacked.verts.push(verts[(Vertex[0] - 1) * 3 + 1]);
                unpacked.verts.push(verts[(Vertex[0] - 1) * 3 + 2]);
                // vertex textures
                unpacked.textures.push(textures[(Vertex[1] - 1) * 2 + 0]);
                unpacked.textures.push(textures[(Vertex[1] - 1) * 2 + 1]);
                // vertex normals
                unpacked.norms.push(vertNormals[(Vertex[2] - 1) * 3 + 0]);
                unpacked.norms.push(vertNormals[(Vertex[2] - 1) * 3 + 1]);
                unpacked.norms.push(vertNormals[(Vertex[2] - 1) * 3 + 2]);
                // add the newly created vertex to the list of indices
                unpacked.hashindices[line[j]] = unpacked.index;
                unpacked.indices.push(unpacked.index);
                // increment the counter
                unpacked.index += 1;
            }
            if(j === 3 && quad) {
                // add v0/t0/vn0 onto the second triangle
                unpacked.indices.push( unpacked.hashindices[line[0]]);
            }
        }
      }
    }
    this.vertices = unpacked.verts;
    this.vertexNormals = unpacked.norms;
    this.textures = unpacked.textures;
    this.indices = unpacked.indices;
  }

  var Ajax = function(){
    // this is just a helper class to ease ajax calls
    var _this = this;
    this.xmlhttp = new XMLHttpRequest();

    this.get = function(url, callback){
      _this.xmlhttp.onreadystatechange = function(){
        if(_this.xmlhttp.readyState === 4){
          callback(_this.xmlhttp.responseText, _this.xmlhttp.status);
        }
      };
      _this.xmlhttp.open('GET', url, true);
      _this.xmlhttp.send();
    }
  };

  /**
   * Takes in an object of `mesh_name`, `'/url/to/OBJ/file'` pairs and a callback
   * function. Each OBJ file will be ajaxed in and automatically converted to
   * an OBJ.Mesh. When all files have successfully downloaded the callback
   * function provided will be called and passed in an object containing
   * the newly created meshes.
   *
   * **Note:** In order to use this function as a way to download meshes, a
   * webserver of some sort must be used.
   *
   * @param {Object} nameAndURLs an object where the key is the name of the mesh and the value is the url to that mesh's OBJ file
   *
   * @param {Function} completionCallback should contain a function that will take one parameter: an object array where the keys will be the unique object name and the value will be a Mesh object
   *
   * @param {Object} meshes In case other meshes are loaded separately or if a previously declared variable is desired to be used, pass in a (possibly empty) json object of the pattern: { '<mesh_name>': OBJ.Mesh }
   *
   */
  OBJ.downloadMeshes = function (nameAndURLs, completionCallback, meshes){
    // the total number of meshes. this is used to implement "blocking"
    var semaphore = Object.keys(nameAndURLs).length;
    // if error is true, an alert will given
    var error = false;
    // this is used to check if all meshes have been downloaded
    // if meshes is supplied, then it will be populated, otherwise
    // a new object is created. this will be passed into the completionCallback
    if(meshes === undefined) meshes = {};
    // loop over the mesh_name,url key,value pairs
    for(var mesh_name in nameAndURLs){
      if(nameAndURLs.hasOwnProperty(mesh_name)){
        new Ajax().get(nameAndURLs[mesh_name], (function(name) {
          return function (data, status) {
            if (status === 200) {
              meshes[name] = new OBJ.Mesh(data);
            }
            else {
              error = true;
              console.error('An error has occurred and the mesh "' +
                name + '" could not be downloaded.');
            }
            // the request has finished, decrement the counter
            semaphore--;
            if (semaphore === 0) {
              if (error) {
                // if an error has occurred, the user is notified here and the
                // callback is not called
                console.error('An error has occurred and one or meshes has not been ' +
                  'downloaded. The execution of the script has terminated.');
                throw '';
              }
              // there haven't been any errors in retrieving the meshes
              // call the callback
              completionCallback(meshes);
            }
          }
        })(mesh_name));
      }
    }
  };

  /**
   * Takes in the WebGL context and a Mesh, then creates and appends the buffers
   * to the mesh object as attributes.
   *
   * @param {WebGLRenderingContext} gl the `canvas.getContext('webgl')` context instance
   * @param {Mesh} mesh a single `OBJ.Mesh` instance
   *
   * The newly created mesh attributes are:
   *
   * Attrbute | Description
   * :--- | ---
   * **normalBuffer**       |contains the model&#39;s Vertex Normals
   * normalBuffer.itemSize  |set to 3 items
   * normalBuffer.numItems  |the total number of vertex normals
   * |
   * **textureBuffer**      |contains the model&#39;s Texture Coordinates
   * textureBuffer.itemSize |set to 2 items
   * textureBuffer.numItems |the number of texture coordinates
   * |
   * **vertexBuffer**       |contains the model&#39;s Vertex Position Coordinates (does not include w)
   * vertexBuffer.itemSize  |set to 3 items
   * vertexBuffer.numItems  |the total number of vertices
   * |
   * **indexBuffer**        |contains the indices of the faces
   * indexBuffer.itemSize   |is set to 1
   * indexBuffer.numItems   |the total number of indices
   *
   * A simple example (a lot of steps are missing, so don't copy and paste):
   *
   *     var gl   = canvas.getContext('webgl'),
   *         mesh = OBJ.Mesh(obj_file_data);
   *     // compile the shaders and create a shader program
   *     var shaderProgram = gl.createProgram();
   *     // compilation stuff here
   *     ...
   *     // make sure you have vertex, vertex normal, and texture coordinate
   *     // attributes located in your shaders and attach them to the shader program
   *     shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
   *     gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
   *
   *     shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
   *     gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
   *
   *     shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
   *     gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
   *
   *     // create and initialize the vertex, vertex normal, and texture coordinate buffers
   *     // and save on to the mesh object
   *     OBJ.initMeshBuffers(gl, mesh);
   *
   *     // now to render the mesh
   *     gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
   *     gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
   *
   *     gl.bindBuffer(gl.ARRAY_BUFFER, mesh.textureBuffer);
   *     gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
   *
   *     gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
   *     gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
   *
   *     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.mesh.indexBuffer);
   *     gl.drawElements(gl.TRIANGLES, model.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
   */
  OBJ.initMeshBuffers = function( gl, mesh ){
		mesh.vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW);
		mesh.vertexBuffer.itemSize = 3;
		mesh.vertexBuffer.numItems = mesh.vertices.length / 3;

    mesh.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertexNormals), gl.STATIC_DRAW);
    mesh.normalBuffer.itemSize = 3;
    mesh.normalBuffer.numItems = mesh.vertexNormals.length / 3;

    mesh.textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.textures), gl.STATIC_DRAW);
    mesh.textureBuffer.itemSize = 2;
    mesh.textureBuffer.numItems = mesh.textures.length / 2;

    mesh.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(mesh.indices), gl.STATIC_DRAW);
    mesh.indexBuffer.itemSize = 1;
    mesh.indexBuffer.numItems = mesh.indices.length;
  }
})(this, document);


