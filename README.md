# Karaoke VTT



***NOTE***<i> that this implementation does NOT work in the Firefox browser, which does not support selectors in ::cue() styling specifications on which this page relies.</i>



This webpage was developed as a practice exercise for the "[W3Cx HTML5 Coding Essentials and Best Practices](https://www.edx.org/learn/html5/the-world-wide-web-consortium-w3c-html5-coding-essentials-and-best-practices)" course offered through [edX](https://www.edx.org/).  The prompt was, "**Project 3 (with JavaScript knowledge)**: Please write a karaoke player with a small list of songs for people to choose from."



I am not aware of any VTT editor that supports timestamp tags within the payload.  The **expand.js** and **merge.js** functions were developed to assist in that process, depending on the capabilities of the VTT editor being used.



*As acknowledged in the credits, both videos were downloaded from* [*archive.org*](https://archive.org/)*.*



##### Outstanding Issues



The **vttTimestampTags** function attempts to do just-in-time modification of the VTTCue.text values to apply classes .past, .current, and .future to successive segments of the payload.

* The first segment of each payload is generally never displayed as current, apparently because the original value of VTTCue.text is rendered before being replaced - except when the payload starts with a timestamp tag, creating an empty first segment.
* With two concurrent payloads (e.g., soprano and tenor lines of a duet) one tends to lag one timestamp behind the other, even though the VTTCue.text changes are both entered at the same currentTime of the video.



I believe the solution to these issues is to modify the VTTCue.text *prior* to its activation.  This would be done by replacing each cue with a sequence of cues reflecting the progressive changes of class qualifications.

* For new .vtt files, a variant of the expand.js function could elaborate each cue of a basic .vtt file to the intended sequence of class-qualified cues.
* For existing .vtt files with timestamp tags in payloads, the vttTimestampTags function could use the addCue and removeCue methods of a TextTrack instance to replace each cue with the corresponding sequence of class-qualified cues.  Accomplishing this asynchronously will be especially challenging if there are multiple TextTrack instances specified (e.g., multi-lingual karaoke) with the possibility of frequent changes.
