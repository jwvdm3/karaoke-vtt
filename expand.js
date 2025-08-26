function expand(infile, outfile) {
/*
 * expand.js - for building karaoke WebVTT files
 *
 * This program takes a standard WebVTT file and expands each payload into
 * distinct cues for each word (or syllable), separated by white space.  The
 * duration assigned for each word is proportional to its length, relative to 
 * the total number of (printable) characters in the payload.  After refining 
 * these default timings with a standard VTT editor, the companion merge.js 
 * program can be used to reassemble the payloads, with embedded timestamp tags. 
 *
 * This program is best used with an unadorned .vtt file.  The 'WebVTT' header 
 * and any STYLE or NOTE sections will be copied into the output file.  Any cue 
 * ID or cue-setting specifications will be omitted.  But any tags within the 
 * payload will distort the assigned durations.
 */
  const fs = require('node:fs'),
    cueRE = /^(.*\r?\n)?(\d[\d:\.]*)\s+-->\s+(\d[\d:\.]*).*\r?\n.*/,
    timeRE = /(\d\d+:)?(\d\d:)(\d\d\.\d\d\d)/;
    // presuming correctly formatted time values

  fs.readFile(infile, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    let sections = data.split(/(?:\r?\n){2,}/);
    let result = [];
    sections.forEach(section=>{
      let cue = section.match(cueRE);
      if (cue) {  // [full-match, ID?, startTime, endTime]
        let lines = section.split(/\r?\n/)
        if (cue[1]) lines.shift();  //remove ID line
        lines.shift();  // remove cue timing line, leaving payload
        let start = getTime(cue[2]),
            end   = getTime(cue[3]),
            words = lines.join(' ').split(/\s+/),  // .filter(word=>word),
            total = words.reduce((sum,word) => sum + word.length, 0),
            delta = (end-start)/total;
        let from = formatTime(start), sum = 0;
        words.forEach(word=>{ 
          sum += word.length;
          let next = formatTime(start + sum*delta);
          result.push(`${from} --> ${next}\n${word}`);
          from = next;
        });
      } else result.push(section);  // not a cue
    });
    fs.writeFile(outfile, result.join("\n\n"), (err)=>{
        if (err) console.error(err);
        else console.log(`${outfile} written`);
      });
  });
  function getTime(spec) {
    let [, hh, mm, secs] = spec.match(timeRE);
    let time = parseInt(mm)*60 + parseFloat(secs);
    if (hh) time += parseInt(hh)*3600;
    return time;
  }
  function formatTime(time) {  // as HH:MM:SS.mmm
    const hours = Math.floor(time / 3600).toString().padStart(2, '0'),
        minutes = Math.floor(time % 3600 / 60).toString().padStart(2, '0'),
        seconds = (time % 60).toFixed(3).padStart(6, '0');
    return `${hours}:${minutes}:${seconds}`;
  }
}
