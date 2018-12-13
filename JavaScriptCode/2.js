BABYLON.PolygonMeshBuilder.prototype.wallBuilder = function (w0, w1) {
    var positions = [];
    var iuvs = [];
    var euvs = [];
    var icolors = [];
    var ecolors = [];
    var direction = w1.corner.subtract(w0.corner).normalize();
    var angle = Math.acos(direction.x);
    if(direction.z !=0) {
        angle *= direction.z/Math.abs(direction.z);
    }	
    this._points.elements.forEach(function (p) {
        positions.push(p.x * Math.cos(angle) + w0.corner.x, p.y, p.x * Math.sin(angle) + w0.corner.z);
    });
    var indices = [];		
    var res = Earcut.earcut(this._epoints, this._eholes, 2);
    for (var i = res.length; i > 0; i--) {
        indices.push(res[i - 1]);
    };			
    return {positions: positions, indices: indices};
};
        

var createScene = function() {
var scene = new BABYLON.Scene(engine);

// camera
var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI/2, Math.PI / 3, 25, new BABYLON.Vector3(0, 0, 4.5), scene);
camera.attachControl(canvas, true);

var light = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(5, 10, 0), scene);

var corner = function (x, y) {
    return new BABYLON.Vector3(x, 0, y);
}


var wall = function(corner) {
    this.corner = corner;
    this.doorSpaces = [];
    this.windowSpaces = []; 
}

var map = function(walls, ply, height, options, scene) {
    
    //Tepe pozisyonları için arraylar ve indisler
    var positions = [];
    var indices = [];
    var uvs = [];
    var colors = [];
    
    var interiorUV = options.interiorUV || new BABYLON.Vector4(0, 0, 1, 1);
    var exteriorUV = options.exteriorUV || new BABYLON.Vector4(0, 0, 1, 1);
    
    var interiorColor = options.interiorColor || new BABYLON.Color4(1, 1, 1, 1);
    var exteriorColor = options.exteriorColor || new BABYLON.Color4(1, 1, 1, 1);		
    var interior = options.interior || false;
    if(!interior) {
        walls.push(walls[0]);
    }
    
    var interiorIndex;
    
    //Köşe data arraylari
    var innerBaseCorners = [];
    var outerBaseCorners = [];
    var innerTopCorners = [];
    var outerTopCorners = [];
    
    var angle = 0;
    var direction = 0;

    var line = BABYLON.Vector3.Zero();
    var nextLine = BABYLON.Vector3.Zero();		

    var nbWalls = walls.length;
    if(nbWalls === 2) {
        walls[1].corner.subtractToRef(walls[0].corner, line);
        lineNormal = new BABYLON.Vector3(line.z, 0, -1 * line.x).normalize();
        line.normalize();
        innerBaseCorners[0] = walls[0].corner;
        outerBaseCorners[0] = walls[0].corner.add(lineNormal.scale(ply));
        innerBaseCorners[1] = walls[1].corner;
        outerBaseCorners[1] = walls[1].corner.add(lineNormal.scale(ply));
    }
    else if(nbWalls > 2) { 
        for(var w = 0; w < nbWalls - 1; w++) {
            walls[w + 1].corner.subtractToRef(walls[w].corner, nextLine);
            angle = Math.PI - Math.acos(BABYLON.Vector3.Dot(line, nextLine)/(line.length() * nextLine.length()));			
            direction = BABYLON.Vector3.Cross(nextLine, line).normalize().y;			
            lineNormal = new BABYLON.Vector3(line.z, 0, -1 * line.x).normalize();
            line.normalize();
            innerBaseCorners[w] = walls[w].corner
            outerBaseCorners[w] = walls[w].corner.add(lineNormal.scale(ply)).add(line.scale(direction * ply/Math.tan(angle/2)));		
            line = nextLine.clone();
        } 
        if(interior) {
            lineNormal = new BABYLON.Vector3(line.z, 0, -1 * line.x).normalize();
            line.normalize();
            innerBaseCorners[nbWalls - 1] = walls[nbWalls - 1].corner
            outerBaseCorners[nbWalls - 1] = walls[nbWalls - 1].corner.add(lineNormal.scale(ply));
            walls[1].corner.subtractToRef(walls[0].corner, line);
            lineNormal = new BABYLON.Vector3(line.z, 0, -1 * line.x).normalize();
            line.normalize();
            innerBaseCorners[0] = walls[0].corner;
            outerBaseCorners[0] = walls[0].corner.add(lineNormal.scale(ply));
        }
        else {
            walls[1].corner.subtractToRef(walls[0].corner, nextLine);
            angle = Math.PI - Math.acos(BABYLON.Vector3.Dot(line, nextLine)/(line.length() * nextLine.length()));			
            direction = BABYLON.Vector3.Cross(nextLine, line).normalize().y;			
            lineNormal = new BABYLON.Vector3(line.z, 0, -1 * line.x).normalize();
            line.normalize();
            innerBaseCorners[0] = walls[0].corner
            outerBaseCorners[0] = walls[0].corner.add(lineNormal.scale(ply)).add(line.scale(direction * ply/Math.tan(angle/2)));
            innerBaseCorners[nbWalls - 1] = innerBaseCorners[0];
            outerBaseCorners[nbWalls - 1] = outerBaseCorners[0]

        }       
    }

    // iç ve dış üst köşeleri
    for(var w = 0; w < nbWalls; w++) {
        innerTopCorners.push(new BABYLON.Vector3(innerBaseCorners[w].x, height, innerBaseCorners[w].z));
        outerTopCorners.push(new BABYLON.Vector3(outerBaseCorners[w].x, height, outerBaseCorners[w].z));
    }
    
    var maxL = 0;
    for(w = 0; w < nbWalls - 1; w++) {
        maxL = Math.max(innerBaseCorners[w + 1].subtract(innerBaseCorners[w]).length(), maxL);
    }
    
    var maxH = height;
    
    //Meshlerin oluşturulması
    
    // Dvuar oluşturma
    var polygonCorners;
    var polygonTriangulation;
    var wallData;
    var wallDirection = BABYLON.Vector3.Zero();
    var wallNormal = BABYLON.Vector3.Zero(); 
    var wallLength;
    var exteriorWallLength;
    var uvx, uvy;
    var wallDiff;
    
    for(var w = 0; w < nbWalls - 1; w++) {
        walls[w + 1].corner.subtractToRef(walls[w].corner, wallDirection);
        wallLength = wallDirection.length();
        wallDirection.normalize();
        wallNormal.x = wallDirection.z;
        wallNormal.z = -1 * wallDirection.x;
        exteriorWallLength = outerBaseCorners[w + 1].subtract(outerBaseCorners[w]).length();
        wallDiff = exteriorWallLength - wallLength;
        var gableHeight = 0;
        
        

        var a = walls[w].length;
        
        //Duvar verilerini kullanarak (0,0)'dan başlayan iç duvar polygonunu oluştur 
        polygonCorners = [];
        polygonCorners.push(new BABYLON.Vector2(0, 0));
        
        for (var d = 0; d < walls[w].length; d++) {			
            polygonCorners.push(new BABYLON.Vector2(walls[w].left, 0));
            polygonCorners.push(new BABYLON.Vector2(walls[w].left, walls[w].height));
            polygonCorners.push(new BABYLON.Vector2(walls[w].left + walls[w].width, walls[w].height));
            polygonCorners.push(new BABYLON.Vector2(walls[w].left + walls[w].width, 0));			
        }

        polygonCorners.push(new BABYLON.Vector2(wallLength, 0));
        polygonCorners.push(new BABYLON.Vector2(wallLength, height));
        polygonCorners.push(new BABYLON.Vector2(0, height));
        
        //Köşelerini kullanarak polygonun triangülasyonunu oluştur
        polygonTriangulation = new BABYLON.PolygonMeshBuilder("", polygonCorners, scene);
        
        
        // wallBuilder metodu şimdiki ve sonraki duvarı kullanarak tepe pozisyonlarını doğru yere çevirip döndürerek duvar tepe pozisyonları ve indislerinin arraylerini oluşturur. 
        wallData = polygonTriangulation.wallBuilder(walls[w], walls[w + 1]);	

        nbIndices = positions.length/3; // şu anki indis sayısı
        
        polygonTriangulation._points.elements.forEach(function (p)  {
            uvx = interiorUV.x + p.x * (interiorUV.z - interiorUV.x) / maxL;
            uvy = interiorUV.y + p.y * (interiorUV.w - interiorUV.y) / height;
            uvs.push(uvx, uvy);					
            colors.push(interiorColor.r, interiorColor.g, interiorColor.b, interiorColor.a);
        });
        
        //İç duvar pozisyonlarını ekle
        positions = positions.concat(wallData.positions);
        
        interiorIndex = positions.length/3;

        indices = indices.concat(wallData.indices.map(function(idx){
            return idx + nbIndices;
        }));
        
        //İç duvar'dan dış duvar yön pozisyonlarını oluştur
        //Dış duvar köşe pozisyonlarını wallData pozisyonlarına geri ekle
        wallData.positions = [];
        
        wallData.positions.push(outerBaseCorners[w].x, outerBaseCorners[w].y, outerBaseCorners[w].z);
        wallData.positions = wallData.positions.concat();			
        wallData.positions.push(outerBaseCorners[w + 1].x, outerBaseCorners[w + 1].y, outerBaseCorners[(w + 1) % nbWalls].z);
        wallData.positions.push(outerTopCorners[w + 1].x, outerTopCorners[w + 1].y, outerTopCorners[(w + 1) % nbWalls].z);
        wallData.positions.push(outerTopCorners[w].x, outerTopCorners[w].y, outerTopCorners[w].z);
        wallData.positions = wallData.positions.concat();
        
        //Dış duvar uvlerini hesapla
        polygonTriangulation._points.elements.forEach(function (p)  {
            if (p.x == 0) {
                uvx = exteriorUV.x;
            }
            else if (wallLength - p.x < 0.000001) {
                uvx = exteriorUV.x + (wallDiff + p.x) * (exteriorUV.z - exteriorUV.x) / (maxL + wallDiff)
            }
            else {
                uvx = exteriorUV.x + (0.5 * wallDiff + p.x) * (exteriorUV.z - exteriorUV.x) / (maxL + wallDiff);
            }
            uvy = exteriorUV.y + p.y * (exteriorUV.w - exteriorUV.y) / height;
            uvs.push(uvx, uvy);					
        });
    
        nbIndices = positions.length/3; // şu anki indis sayısı
        
        //Dış duvar pozisyonlarını ve uvleri ekle
        positions = positions.concat(wallData.positions);

        
        //Normalleri düzeltmek için indisleri ters çevir
        wallData.indices.reverse();
        
        indices = indices.concat(wallData.indices.map(function(idx){
            return idx + nbIndices;
        }));
                
        
        
        
        //Duvar üstlerinin yüzlerinin oluşturulması
        nbIndices = positions.length/3; // şu anki indis sayısı
        
        positions.push(innerTopCorners[w].x, innerTopCorners[w].y, innerTopCorners[w].z); //sol üst
        positions.push(innerTopCorners[w + 1].x, innerTopCorners[w + 1].y, innerTopCorners[w + 1].z); //sağ üst
        positions.push(outerTopCorners[w].x, outerTopCorners[w].y, outerTopCorners[w].z); //sol alt
        positions.push(outerTopCorners[w + 1].x, outerTopCorners[w + 1].y, outerTopCorners[w + 1].z); //sağ alt
        
        uvx = exteriorUV.x + 0.5 * wallDiff * (exteriorUV.z - exteriorUV.x)/maxL;
        uvs.push(uvx, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * ply/maxH); //sol üst
    
        uvx = exteriorUV.x + (0.5 * wallDiff + wallLength) * (exteriorUV.z - exteriorUV.x)/maxL;
        uvs.push(uvx, exteriorUV.y + (exteriorUV.w - exteriorUV.y) * ply/maxH); //sağ üst
    
        uvs.push(exteriorUV.x, exteriorUV.y); //sol alt	
        uvs.push(exteriorUV.x + (exteriorUV.z - exteriorUV.x) * exteriorWallLength/(maxL + wallDiff), exteriorUV.y); // sağ alt
    
        indices.push(nbIndices + 1, nbIndices, nbIndices + 3, nbIndices + 2, nbIndices + 3, nbIndices); 
        
        for(var p = interiorIndex; p < positions.length/3; p++) {
            colors.push(exteriorColor.r, exteriorColor.g, exteriorColor.b, exteriorColor.a);
        }

        var compareLeft = function(a, b) {
            return a.left - b.left
        }
        
    }

    var normals = [];

    BABYLON.VertexData.ComputeNormals(positions, indices, normals);
    BABYLON.VertexData._ComputeSides(BABYLON.Mesh.FRONTSIDE, positions, indices, normals, uvs);

    
    //Custom mesh yarat
    var customMesh = new BABYLON.Mesh("custom", scene);

    //VertexData(TepeData) nesnesi yarat
    var vertexData = new BABYLON.VertexData();

    //Pozisyonları ve indisleri VertexData'ya ata
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.uvs = uvs;
    vertexData.colors = colors;

    //VertexData'yı custom mesh'e ekle
    vertexData.applyToMesh(customMesh);
    
    return customMesh;
    
}
//***********************************************************************************

var baseData = [-3, -3, -3 , -4, 4,-4, 4, 0, 2, 0, 1.9, 0, 2, 2, 2, 3, -3, 3];


var corners = [];
for(b = 0; b < baseData.length/2; b++) {
    corners.push(new corner(baseData[2*b], baseData[2*b + 1]));
}


var walls = [];
for(c=0; c<corners.length; c++) {
    walls.push(new wall(corners[c]));
}



var ply = 0.3;
var height = 3.2;
          
 map(walls, ply, height, {interiorUV: new BABYLON.Vector4(0.167, 0, 1, 1), exteriorUV: new BABYLON.Vector4(0, 0, 0.16, 1)}, scene);

return scene;

}