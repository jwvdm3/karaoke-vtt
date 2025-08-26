function code() {
  const trk0 = '<track kind="subtitles" srclang="en"',
    sings = new Map([  // video sources
      ["one",
`<source src="Amazing_Grace-Rising_Sun.mp4" type="video/mp4">
 ${trk0} src="one.one.vtt" label="one">
 ${trk0} src="one.two.vtt" label="two">`],
      ["two", 
`<source src="Animals-House_of_the_Rising_Sun_BW.mp4" type="video/mp4">
 ${trk0} src="two.one.vtt" label="one">
 ${trk0} src="two.two.vtt" label="two">`],
    ]),
    loud = { one:0.4, two:1.0 };  // correct for volume imbalance between videos
  const inputs = document.querySelectorAll("input"),  // just the radio buttons
        button = document.querySelector("button"),
        video = document.querySelector("video"),
        header = document.querySelector("header"),
        footer = document.querySelector("footer"),
        nowTime = document.querySelector("#nowTime"),
        runTime = document.querySelector("#runTime"),
        nbsp = "\u{00A0}",
        handlers = [ [video, "ended", finish],
          [video, "durationchange", ()=>{
            runTime.textContent = formatTime(video.duration);
          }],
          [video, "timeupdate", ()=>{
            nowTime.textContent = formatTime(video.currentTime);
          }],
          [runTime, "click", ()=>{
            if (video.paused) video.play(); else video.pause();
          }, "Click to toggle between PAUSE and PLAY"],
          [nowTime, "click", ()=>{ 
            let newTime = Math.max(0.0, video.currentTime-10.000);
            video.currentTime = newTime;
          }, "Back up ten seconds"],
        ];
  let sing, show;
  button.addEventListener("click", startPlay, false);  // but starts disabled
  for (radio of inputs) radio.addEventListener("change", changeRadio, false);
  function changeRadio(event) {
    switch (event.target.name) {
    case "sing": sing = event.target.value; break;
    case "show": show = event.target.value; break;
    }
    if (sing && show) {
      button.disabled = false;
      button.title = "PLAY";
    }
  }
  function startPlay() {
    button.disabled = true;
    button.title = "";
    for (radio of inputs) radio.disabled = true;
    nowTime.textContent = runTime.textContent = nbsp;
    video.innerHTML = sings.get(sing);
    video.volume = loud[sing];
    video.load();
    vttTimestampTags(video);
    for (const track of video.querySelectorAll("track")) {
      track.default = (track.label === show);
    }
    header.classList.replace("fade-in", "fade-out");
    footer.classList.replace("fade-in", "fade-out");
    handlers.forEach(([element, event, handler, toolTip])=>{
      element.addEventListener(event, handler, false);
      if (toolTip) element.title = toolTip;
    });
    video.play();
  }
  function finish() {
    header.classList.replace("fade-out", "fade-in");
    footer.classList.replace("fade-out", "fade-in");
    button.disabled = false;
    for (radio of inputs) radio.disabled = false;
    handlers.forEach(([element, event, handler, toolTip])=>{
      element.removeEventListener(event, handler, false);
      if (toolTip) element.title = "";
    });
  }
  function formatTime(totalSeconds) {  // as HH:MM:SS.mmm
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0'),
        minutes = Math.floor(totalSeconds % 3600 / 60).toString().padStart(2, '0'),
        seconds = (totalSeconds % 60).toFixed(3).padStart(6, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

}

