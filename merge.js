function merge(infile, outfile, gapTime=1.0) {
/*
 * merge.js - for building karaoke WebVTT files
 *
 * When you are comfortable with the timings of the single-word cues, run this 
 * program to reassemble them into payloads, with embedded timestamp tags.  To 
 * identify which cues are to be combined, remove the blank lines betwween them;
 * these should typically correspond to the original payloads, but that is not 
 * required.
 *
 * If the startTime for one word is larger than the endTime of its predecessor 
 * by more than the specified 'gapTime' value (default 1 second), there wil be 
 * two consecutive timestamp tags, preserving that gap.
 *
 * NOTE:  If syllables were separated in the original for distinct styling,
 * the extra space around the intervening timestamp tag will need to be 
 * removed manually.
 */
  const fs = require('node:fs'),
    cueRE = /(\d[\d:\.]*)\s+-->\s+(\d[\d:\.]*)\r?\n(.*)/g,
    timeRE = /(\d\d+:)?(\d\d:)(\d\d\.\d\d\d)/;

  fs.readFile(infile, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    let sections = data.split(/\n\n/);
    let result = [];
    sections.forEach(section=>{
      let timeLine, payload = "", prevEnd;
      for (const cue of section.matchAll(cueRE)) {
        // cue: [full-match, startTime, endTime, word]
        if (! payload) timeLine = `${cue[1]} --> `;
        else {
          payload += ` <${prevEnd}>`;
          if (getTime(cue[1]) > getTime(prevEnd)+gapTime) {
            payload += `<${cue[1]}>`;
          }
        }
        payload += cue[3];
        prevEnd = cue[2];
      }
      if (payload) {
        timeLine += prevEnd;
        result.push (timeLine+"\n"+payload);
        payload = "";
      } else result.push(section);  // not a cue  */
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
}