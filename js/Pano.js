
function report(str)
{
    console.log(str);
}

function getClockTime()
{
    return new Date().getTime()/1000.0;
}

function getParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

var photosphere = null;
var imageUrl = null;
var imNum = 0;
var t0 = getClockTime();
var numLoads = 0;
var numManagerLoads = 0;
var manager = null;
var textureLoader = null;
var prevTexture = null;
var PS = null;
var fuvs0 = null;
var playSpeed = 1.0;
var playTime = null;
var lastSeekTime = null;
var lastMark = null;
var container = null;
var onClickPosition = new THREE.Vector2();
var mousePos = new THREE.Vector2();
var raycaster = new THREE.Raycaster();

function setMark(t)
{
    if (!t)
	t = getClockTime(t);
    report("setMark "+t);
    lastMark = t;
}

function gotoMark()
{
    var t = lastMark;
    report("gotoMark t: "+t);
    setPlayTime(t);
}

function setRealTime()
{
    setPlayTime(null);
}

function setPlayTime(t)
{
    if (t == null) {
	report("*** set real time ***");
	playTime = null
	lastSeekTime = null;
	return;
    }
    if (t < 0)
	t = getClockTime() - t;
    playTime = t;
    lastSeekTime = getClockTime();
}

function getPlayTime()
{
    var t = getClockTime();
    var dt = t - lastSeekTime;
    playTime = playTime + playSpeed*dt;
    lastSeekTime = t;
    return playTime;
}


THREE.TextureLoader.prototype.crossOrigin = '';
THREE.ImageUtils.crossOrigin = '';

function initPano(imgUrl, useGyro) {
    if (imgUrl) {
	imageUrl = imgUrl;
    }
    else {
	imageUrl = "http://pollywss.paldeploy.com/getImage?camId=viewImage";
    }
    report("imageUrl: "+imageUrl);
    manager = new THREE.LoadingManager();
    textureLoader = new THREE.TextureLoader(manager);
	  
    //imageUrl = "stolanuten.jpg"
    //imageUrl = "http://platonia:8000/getImage?camId=viewImage";
    //imageUrl = "http://platonia/getImage?camId=viewImage";
    //imageUrl = "http://pollywss.paldeploy.com/getImage?camId=viewImage";
    //var speed = 0.00000001;
    //var speed = getParameterByName('speed');
    var speed = 0.01;
    photosphere = THREE.Photosphere(document.getElementById('sphere'), imageUrl, {
	view: getParameterByName('view'),
	speed: speed,
	useGyro: useGyro,
	y: getParameterByName('y')
    });
    window.onresize = photosphere.resize;
    PS = THREE.PhSp;
    setTimeout(updateImage, 1000);
}

function setupDecorations()
{
    if (!PS) {
	report("No photosphere initialized");
    }
    //var mat = new THREE.MeshBasicMaterial({});
    //var mat = new THREE.MeshPhongMaterial({
    //	color: 0xdaaddd, specular: 0x009900, shininess: 30, shading: THREE.FlatShading
    //});
    var redMat = new THREE.MeshBasicMaterial({
	color: 0xff0000 , transparent: true, opacity: 0.9
    });
    var material = new THREE.MeshBasicMaterial({
	color: 0xff6600 , transparent: true, opacity: 0.2
    });
    var sphereGeo = new THREE.SphereGeometry(0.5, 20, 20);
    var sphere = new THREE.Mesh( sphereGeo, redMat );
    report("pos: "+sphere.position);
    sphere.scale.x = -1;
    //sphere.position = new THREE.Vector3(5,2,1);
    sphere.position.x = 5;
    sphere.position.y = 0;
    sphere.position.z = 2;
    PS.scene.add( sphere );

    var geometry = new THREE.BoxGeometry( 1.5, 10, 0.25 );
    var box = new THREE.Mesh( geometry, material );
    box.position.x = 5;
    box.scale.x = -1;
    PS.scene.add( box );

    light1 = new THREE.PointLight( 0xff0040, 2, 50 );
    light1.add( new THREE.Mesh( sphereGeo, new THREE.MeshBasicMaterial( { color: 0xff0040 } ) ) );
    light1.position = new THREE.Vector3(5,5,5);
    PS.scene.add( light1 );
}

function dump()
{
    report("sphere: "+photosphere);
    report("texture: "+PS.texture);
    report("material: "+PS.material);
}

function updateImage()
{
    imNum += 1;
    //PS.controls.autoRotate = false;
    //report("updatingImage...");
    var url;
    if (playTime == null) {
	// real time
	url = imageUrl + "&imNumX="+imNum + "&t="+getClockTime();
    }
    else {
	url = imageUrl + "&t="+getPlayTime();
    }
    //report("updateImage url: "+url);

    textureLoader.load(url, function (texture) {
	var t = getClockTime();
	var dt = t - t0;
	numLoads += 1;
	//report("numLoads: "+numLoads+" "+numLoads/dt);
        PS.material.map = texture;
	//var prevTexture = PS.texture;
        PS.texture = texture;
        PS.material.map.needsUpdate = true; // probably bogus
	PS.material.needsUpdate = true;
	PS.sphere.needsUpdate = true;
	PS.scene.needsUpdate = true;
	//photosphere.render();
	PS.renderer.render(PS.scene, PS.camera);
	if (1 && prevTexture) {
	    //report("deallocating texture");
	    prevTexture.dispose();
	}
	prevTexture = texture;
        setTimeout(updateImage, 5);
    });
}

function setSurface(node)
{
    var name = PS.surface.name;
    report("removing "+name);
    PS.scene.remove(PS.surface);
    PS.scene.add(node);
    PS.surface = node;
}

function setSphere()
{
    PS.camera.position.x = 0.1;
    PS.camera.position.y = 0;
    PS.camera.position.z = 0;

    setSurface(PS.sphere);
}

function setCirc()
{
    PS.camera.position.x = 0.1;
    PS.camera.position.y = 200;
    PS.camera.position.z = 500;

    PS.cyl.scale.x = 1.0;
    setSurface(PS.cyl);
}

function setEllipse()
{
    PS.camera.position.x = 0.1;
    PS.camera.position.y = 200;
    PS.camera.position.z = 500;

    PS.cyl.scale.x = .6;
    setSurface(PS.cyl);
}

function toggleFullScreen()
{
    report("toggleFullScreen");
    if (!THREEx.FullScreen.activated()) {
        report("setFullScreen");
        THREEx.FullScreen.request();
    }
    else {
        report("clearFullScreen");
        THREEx.FullScreen.cancel();
    }
}

function toggleControls()
{
    if ($("#controls").is(":visible") == true) {
        $("#controls").hide(200);
    }
    else {
        $("#controls").show(200);
    }
}

function tweakTex(low, high, mirror)
{
    var s = surface;
    var geo = s.geometry;
    var fuvs = geo.faceVertexUvs[0];
    var mat = s.material;
    var sf = high - low;
    if (fuvs0 == null) {
	report("Copying initial UV's");
        fuvs0 = JSON.parse(JSON.stringify(fuvs));
	report("done");
    }
    var n = 0;
    for (var i=0; i<fuvs.length; i++) {
        var f = fuvs[i];
	var f0 = fuvs0[i];
	for (var j=0; j<3; j++) {
	    if (mirror)
                f[j].x = 1.0 - f0[j].x;
	    f[j].y = low + sf*f0[j].y;
	    n++;
	}
    }
    report("updated uv vals: "+n);
    mat.needsUpdate = true;
    geo.uvsNeedUpdate = true;
    geo.buffersNeedUpdate = true;
}

function onMouseEvent( evt ) {
    evt.preventDefault();
    //var container = window;
    var array = getMousePosition( container, evt.clientX, evt.clientY );
    onClickPosition.fromArray( array );
    var intersects = getIntersects( onClickPosition, PS.scene.children );
    ISECTS = intersects;
    report("intersects: "+intersects);
    //if ( intersects.length > 0 && intersects[ 0 ].uv ) {
    if ( intersects.length > 0) {
        var point = intersects[0].point;
        POINT = point;
        report("point: "+point.x+" "+point.y+" "+point.z);
	//var uv = intersects[ 0 ].uv;
	//intersects[ 0 ].object.material.map.transformUv( uv );
        //report("u: "+uv.x+"  v: "+uv.y);
	//canvas.setCrossPosition( uv.x, uv.y );
    }
}

var getMousePosition = function ( dom, x, y ) {
    var rect = dom.getBoundingClientRect();
    return [ ( x - rect.left ) / rect.width, ( y - rect.top ) / rect.height ];
};

var getIntersects = function ( point, objects ) {
    mousePos.set( ( point.x * 2 ) - 1, - ( point.y * 2 ) + 1 );
    report("mousePos: "+mousePos.x+" "+mousePos.y);
    MPOS = mousePos;
    raycaster.setFromCamera( mousePos, PS.camera );
    return raycaster.intersectObjects( objects );
};


$(document).ready(function() {
    $("#toggleControls").click(toggleControls);
    //window.addEventListener( 'resize', onWindowResize, false );
    container = document.getElementById('sphere');
    container.addEventListener( 'mousedown', onMouseEvent, false );
    //window.addEventListener( 'mousemove', onMouseEvent, false );
});
