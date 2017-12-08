function handlemousedown(event){
    val_x = event.clientX/window.innerWidth;
    val_y = event.clientY/window.innerHeight;

    canvas_x = -35*val_x + 25;
    canvas_y = -10*val_y + 10;

    console.log("********* canvas_x: " + canvas_x);
    console.log("********* canvas_y: " + canvas_y);

    sky_missile11 = new SkyMissile(gl);
    sky_missile11.load_missile(4, 4, 4);
    scenes.push(sky_missile11);
    dest= vec3.fromValues(canvas_x, canvas_y, 4);

    if(canvas_x>10)
    {
        console.log("********* inside if *******");
        src = vec3.fromValues(80, -0.8, 4);
    }
    else if(canvas_x >0 && canvas_x<=10)
    {
        console.log("********* inside else if *********");
        src = vec3.fromValues(7, -0.8, 4);
    }
    else{
        console.log("*********** else ***********");
        src = vec3.fromValues(-15, -0.8, 4);
    }
    console.log("********** src: *****" +src);

    sky_missile11.animate_missile(src,dest, (src[0]-dest[0])/8 , (src[1]-dest[1])/8);
}


//add audio
{
    var missileAudio = document.createElement('audio');
    var audio_source = document.createElement('source');
    audio_source.src = "/Users/pjain12/Downloads/gameOver.wav";
    missileAudio.appendChild(audio_source);
    missileAudio.play();
}


//add during game start
1. setup webgl
{
         //setup game start audio
        var startAudio = document.createElement('audio');
        var start_source = document.createElement('source');
        //modification
        //add game start audio
        start_source.src = "/Users/pjain12/Downloads/squash.wav";
        startAudio.appendChild(start_source);
        startAudio.play();
}





