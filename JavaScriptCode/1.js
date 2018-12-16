var createScene = function() {
    var scene = new BABYLON.Scene(engine);
  
    // We create a camera to look to the room from different perspectives
    var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI/2, Math.PI / 3, 25, new BABYLON.Vector3(0, 0, 4.5), scene);
      camera.attachControl(canvas, true);
    
      //We create a light to differ our room's walls from the scene
      var light = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(5, 10, 0), scene);
      
      
      var corner = function (x, y) { //We create a corner function to create wall corners.
          return new BABYLON.Vector3(x, 0, y);
      }
      
      
      var wall = function(corner) { //We create a wall function to create walls to create a room. 
          this.corner = corner;
      }
      
      var map = function(walls, ply, height, scene) { // Map function creates the room with walls.
      
          var outerData = [];
          var angle = 0; 
          var direction = 0; 
          var line = BABYLON.Vector3.Zero();
          walls[1].corner.subtractToRef(walls[0].corner, line);
          var nextLine = BABYLON.Vector3.Zero();
          walls[2].corner.subtractToRef(walls[1].corner, nextLine);
          var nbWalls = walls.length;
          for(var w = 0; w <= nbWalls; w++) {	
              angle = Math.acos(BABYLON.Vector3.Dot(line, nextLine)/(line.length() * nextLine.length()));
              direction = BABYLON.Vector3.Cross(nextLine, line).normalize().y;
              lineNormal = new BABYLON.Vector3(line.z, 0, -1 * line.x).normalize();
              line.normalize();
              outerData[(w + 1) % nbWalls] = walls[(w + 1) % nbWalls].corner.add(lineNormal.scale(ply)).add(line.scale(direction * ply/Math.tan(angle/2)));		
              line = nextLine.clone();		
              walls[(w + 3) % nbWalls].corner.subtractToRef(walls[(w + 2) % nbWalls].corner, nextLine);	
          }
      
          var positions = []; //We create a positions array in order to create a mesh with two facets.
          var indices = []; //We create a indices array in order to store positions' data.
      
          for(var w = 0; w < nbWalls; w++) {
              positions.push(walls[w].corner.x, walls[w].corner.y, walls[w].corner.z); // creating inner base corners to create inner walls
          }
      
          for(var w = 0; w < nbWalls; w++) {
              positions.push(outerData[w].x, outerData[w].y, outerData[w].z); // creating outer base corners to create outer walls
          }
      
          for(var w = 0; w <nbWalls; w++) {
              indices.push(w, (w + 1) % nbWalls, nbWalls + (w + 1) % nbWalls, w, nbWalls + (w + 1) % nbWalls, w + nbWalls); // base indices
          }
  
          var currentLength = positions.length;  // now we need to create inner and outer top corners to create the wall
          for(var w = 0; w < currentLength/3; w++) {
              positions.push(positions[3*w]);
              positions.push(height);
              positions.push(positions[3*w + 2]);
          }
      
          currentLength = indices.length;
          for(var i = 0; i <currentLength/3; i++) {
              indices.push(indices[3*i + 2] + 2*nbWalls, indices[3*i + 1] + 2*nbWalls, indices[3*i] + 2*nbWalls ); // top indices
          }
      
          for(var w = 0; w <nbWalls; w++) {
              indices.push(w, w + 2 *nbWalls, (w + 1) % nbWalls + 2*nbWalls, w, (w + 1) % nbWalls + 2*nbWalls, (w + 1) % nbWalls); // inner wall indices
              indices.push((w + 1) % nbWalls + 3*nbWalls, w + 3 *nbWalls, w + nbWalls, (w + 1) % nbWalls + nbWalls, (w + 1) % nbWalls + 3*nbWalls, w + nbWalls); // outer wall indices
          }		
      
          var normals = []; // Normal to a plane is a vector that is at right angles to a plane. BabylonJS will calculate normals for a facet and for facets not sharing any vertices with another facet.
          
      
          BABYLON.VertexData.ComputeNormals(positions, indices, normals); // Normals are calculated on the vertexData object using the ComputeNormal method.
          BABYLON.VertexData._ComputeSides(BABYLON.Mesh.FRONTSIDE, positions, indices, normals); // Sides are calculated on the vertexData object using the _ComputeSides method.
      
          
          // Each and every shape in BabylonJS is built from a mesh of triangles or facets.Since we are creating walls we need to create a custom mesh.
          var customMesh = new BABYLON.Mesh("custom", scene);
  
          // We create a vertexData object to hold normals',indices' and positions' datas.
          var vertexData = new BABYLON.VertexData();
  
          // We assign positions,indices and normals to Vertexdata to hold them.
          vertexData.positions = positions;
          vertexData.indices = indices;
          vertexData.normals = normals;
          
  
          // By applying vertexData to customMesh we create the obtained datas
          vertexData.applyToMesh(customMesh);
          
          return customMesh;
          
      }
      
      var baseData = [-1, .65, .7, .65, .8, 5.55, .3, 5.55, .3, 7, -1, 7]; //We specify corner datas to form the walls in order to create the room.
      
      var corners = []; //Creating corners to form the walls.
      for(b = 0; b < baseData.length/2; b++) {
          corners.push(new corner(baseData[2*b], baseData[2*b + 1])); 
      }
      
      var walls = []; //Creating walls to form the room
      for(c=0; c<corners.length; c++) {
          walls.push(new wall(corners[c]));
      }
      
      var ply = 0.3; //ply is the thickness between the inner and outer walls.
      var height = 5; // This is our walls' height.
                
     map(walls, ply, height, scene)
      
      return scene;
  
  }
