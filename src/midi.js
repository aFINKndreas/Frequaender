function player(midiNote, velocity) {

    if (velocity > 0) {
        //On Press
        console.log(midiNoteToName(midiNote));
        $('.noteout').append(midiNoteToName(midiNote) + '\n');
        sine.frequency.setValueAtTime(midiNoteToFrequency(midiNote), ctx.currentTime);
        gain.gain.value = 1;
        pressedKeys++;
    }

}

// request MIDI access
if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({
        sysex: false
    }).then(onMIDISuccess, onMIDIFailure);
} else {
    alert("No MIDI support in your browser.");
}


function onMIDISuccess(midiAccess) {
    midi = midiAccess;
    var inputs = midi.inputs.values();
    // loop through all inputs
    for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
        // listen for midi messages
        input.value.onmidimessage = onMIDIMessage;
    }
    // listen for connect/disconnect message
    midi.onstatechange = onStateChange;
}

function onMIDIMessage(event) {
    data = event.data,
        cmd = data[0] >> 4,
        channel = data[0] & 0xf,
        type = data[0] & 0xf0, // channel agnostic message type. Thanks, Phil Burk.
        note = data[1],
        velocity = data[2];
    // with pressure and tilt off
    // note off: 128, cmd: 8
    // note on: 144, cmd: 9
    // pressure / tilt on
    // pressure: 176, cmd 11:
    // bend: 224, cmd: 14

    switch (type) {
        case 144: // noteOn message
            noteOn(note, velocity);
            break;
        case 128: // noteOff message
            noteOff(note, velocity);
            break;
    }

    //console.log('data', data, 'cmd', cmd, 'channel', channel);
}

function noteOn(midiNote, velocity) {
    player(midiNote, velocity);
}

function noteOff(midiNote, velocity) {
    player(midiNote, velocity);
}


function onStateChange(event) {
    var port = event.port,
        state = port.state,
        name = port.name,
        type = port.type;
    if (type == "input") console.log("name", name, "port", port, "state", state);
}

function onMIDIFailure(e) {
    log("No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + e);
}


function midiNoteToName(midiNote) {
    return noteNumberMap[midiNote];
}

function midiNoteToFrequency(midiNote) {
    return 440 * Math.pow(2, (note - 69) / 12);
}

var noteNumberMap = [];
var notes = [ "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B" ];


for(var i = 0; i < 127; i++) {

    var index = i,
        key = notes[index % 12],
        octave = ((index / 12) | 0) - 1; // MIDI scale starts at octave = -1

    key += octave;

    noteNumberMap[i] = key;

}