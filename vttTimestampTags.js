function vttTimestampTags(video, alternatives) {
/*
 * This function processes timestamp tags in WebVTT payloads, applying 
 * appropriate class labels to the text preceding, during, and following
 * the 'current' segment of the payload.
 *
 * The 'video' argument identifies the relevant HTMLVideoElement.  The optional
 * 'alternatives' argument is an object that can define alternative names for
 * any of the default 'past', 'current', and 'future' classes.  These classes
 * will enclose only text within the payload, not any other enclosing tags.
 *
 * A lax interpretation of timestamp tag values is used, accepting one to three 
 * colon-delimited (non-negative) numbers, only the last of which may include a
 * decimal point; proper ranges are NOT enforced.
 *
 * NOTE:  This function works by replacing the 'text' value in an active VTTCue
 * instance with succesive versions distinguishing .past, .current, and .future
 * segments of the text.  But that happens after the original value has already
 * been rendered.  Timing of the rendering of the modified versions is variable.  
 *   It is recommended that the default styling of timestamped cues match that
 * of the .future segments, since the rendering of the original version will
 * persist until the first modified version, which will identify a .current
 * segment, is rendered.
 *
 * This function uses the 'cuechange' and 'timeupdate' events for its 
 * processing; 'addtrack' for the unlikely event that a new track is added 
 * during processing.
 * This function does not yet handle manual changes to video.currentTime 
 * correctly.  And with two concurrent payloads (e.g., soprano and tenor lines 
 * of a duet) one tends to lag behind the other, even though the VTTCue.text 
 * changes are both entered at the same currentTime of the video.
 */
  const {past="past", current="current", future="future"} = alternatives||{};
  const CODE = Symbol.for("vttTimestampTags-code"),
        MIN = Symbol.for("vttTimestampTags-min"),
        MAX = Symbol.for("vttTimestampTags-max"),
        payloadRE = /([^<]*)(<[^>]*>?)?/sg,          // locate all tags
        timeTagRE = /<(\d+:)?(\d+:)?(\d*[.]?\d*)>/;  // parse timestamp tag
  let textTrack, checking;  // establish scope
  video.textTracks.addEventListener("addtrack", event=>{
      event.track.addEventListener("cuechange", cueChange, false);
    }, false);
  for (textTrack of video.textTracks) {  // don't know which one we're using
    textTrack.addEventListener("cuechange", cueChange, false);
  }

  function cueChange(event) {  // list of active cues has changed
    textTrack = event.target;
  // MIN and MAX identify the time interval that is 'current'
    textTrack[MIN] = 0.0;
    textTrack[MAX] = Infinity;
    for (const cue of textTrack.activeCues) {
      switch (cue[CODE]) {
      case null:  // has no timestamp tags:  [0,inf]
        break;
      case undefined:  // newly added
        parse(cue);
        if (cue[CODE] === null) break;
        // fall through
      default:  // textTrack values span all active cues
        textTrack[MIN] = Math.max(textTrack[MIN], cue[MIN]);
        textTrack[MAX] = Math.min(textTrack[MAX], cue[MAX]);
      }
    }
    if (textTrack[MAX] > video.duration) {  // nothing to look for
      if (checking) {
        video.removeEventListener("timeupdate", timeUpdate, false);
        checking = false;
      }
    } else if (! checking) {
      video.addEventListener("timeupdate", timeUpdate, false);
      checking = true;
    }
  }
  function timeUpdate() {
    let now = video.currentTime;
    if (now >= textTrack[MAX]) {
      // advance (some) active cue(s)
      let next = [];  // in case multiple concurrent
      for (const cue of textTrack.activeCues) {
        if (now >= cue[MAX]) refresh(cue);
      }
    } else if (now < textTrack[MIN]) {
      // currentTime moved backward
      for (const cue of textTrack.activeCues) {
        if (now < cue.text[MIN]) refresh(cue);
      }
    }
  }
  function refresh(cue) {
    // make a different segment .current
    let now = video.currentTime;
    let code = cue[CODE], idx = 1, cueText = "";
    while (code[idx] < now) {
      addSegment(past, code[idx-1]);
      idx += 2;
    }
    cue[MIN] = code[idx-2]||cue.startTime; 
    if (idx < code.length) {
      cue[MAX] = code[idx];
      addSegment(current, code[idx-1]);
      idx += 2;
      while (idx < code.length) {
        addSegment(future, code[idx-1]);
        idx += 2;
      }
    } else cue[MAX] = Infinity;
    cue.text = cueText;

    function addSegment(asClass, segment) {
      // segment: [tag sequence, intervening text, ..., final tag sequence]
      // note that 'tag sequences' may often by empty strings
      // [""] is an empty segment
      let idx;
      for (idx=1; idx<segment.length; idx+=2) {
        cueText += `${segment[idx-1]}<c.${asClass}>${segment[idx]}</c>`;
        //             tag sequence                 innermost text
      }
      cueText += segment[idx-1];  // final tag sequence, if any
    }
  }
  function parse(cue) {
    let code = [],  // [segment, time, ...]
        segment = [""];  // [tag sequence, intervening text, tag sequence, ...]
        // elipses (...) represent repetitions of perceding two items
        // note that 'tag sequences' may often by empty strings
        // [""] is an empty segment
    for (const [, text, tag] of cue.text.matchAll(payloadRE)) {
      let parts = tag?.match(timeTagRE);  // tag can be undefined
      if (parts) {  // timestamp tag
        let [,one,two,time] = parts;
        time = parseFloat(time);
        if (two) time += (parseInt(one)*60 + parseInt(two))*60;  // HH:MM:
        else if (one) time += parseInt(one)*60;  // just MM:
        if (text) segment.push(text, "");
        code.push(segment, time);
        segment = [""];
      } else if (text) segment.push(text, tag||"");
      else if (tag) segment[segment.length-1] += tag;
    }
    if (code.length > 1) {  // has at least one timestamp tag
      code.push(segment, cue.endTime);
      cue[CODE] = code;
      refresh(cue);  // mark first segment as .current
    } else cue[CODE] = null;  // no timestamps, leave cue.text alone
  }
}