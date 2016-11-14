import React, { Component } from 'react';
import Octavian from 'octavian';

import SongContainer from './songcontainer'
import './app.css';

import context from './context';
import oscillator from './oscillator';
import gain from './gain';


class App extends Component {

    constructor() {
        super();

        this.state = {
            song: []
        };
    }

    handleSubmit(e) {
        e.preventDefault();
        const note = new Octavian.Note(this.refs.note.value.trim());

        let song = this.state.song;
        song.push(note);
        this.setState({song});

        this.refs.note.value = '';
        this.refs.note.focus();
    }

    componentDidMount() {
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(0);

        let data, cmd, channel, type, note, velocity, midi;
        let self = this;
        function player(midiNote, velocity) {

            if (velocity > 0) {
                //On Press
                const note = new Octavian.Note(midiNoteToName(midiNote));

                let song = self.state.song;
                song.push(note);
                self.setState({song});
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

    }

    setEnvelope (envelope, start) {
    gain.gain.cancelScheduledValues(start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(1, start + envelope.attack);
    gain.gain.linearRampToValueAtTime(1, start + envelope.attack + envelope.sustain);
    gain.gain.linearRampToValueAtTime(envelope.decayVal, start + envelope.attack + envelope.sustain + envelope.decay);
    gain.gain.linearRampToValueAtTime(0, start + envelope.attack + envelope.sustain + envelope.decay + envelope.release);
};

    playNote (note, beatMS) {
        oscillator.frequency.setValueAtTime(note.frequency, context.currentTime);

        this.setEnvelope({
            attack: 0.1,
            sustain: (beatMS - 300) / 1000,
            decay: 0.1,
            decayVal: 0.2,
            release: 0.1
        }, context.currentTime);
    }

    playSong () {

        const song = this.state.song;
        oscillator.type = this.refs.wave.value;

        if(song.length){

            const bpm = this.refs.bpm.value ? this.refs.bpm.value : 220;
            const beatMS = 60000 / bpm;
            let nextBeat = Date.now();

            let id;
            let i = 0;

            const start = () => {
                if (nextBeat <= Date.now()) {

                    this.playNote(song[i], beatMS);

                    i++;
                    nextBeat = Date.now() + beatMS;
                }

                id = requestAnimationFrame(start);

                if (i === song.length){
                    cancelAnimationFrame(id);
                }
            };

            start()

        }
};

    render() {

        return (
            <div className="app">

                <div className="row">
                    <h1>Frequänder</h1>
                </div>

                <div className="row">
                    <select ref="wave">
                        <option value="sine">Sinus</option>
                        <option value="triangle">Triangle</option>
                        <option value="sawtooth">Sawtooth</option>
                        <option value="square">Square</option>
                    </select>
                    <input ref="bpm" className="bpm" placeholder="BPM" type="number"/>
                </div>

                <div className="row">
                    <form onSubmit={this.handleSubmit.bind(this)}>
                        <input ref="note" placeholder="" type="text" className="note"/>
                        <button className="submit">Ok</button>
                    </form>
                </div>

                <div className="row">
                    <SongContainer song={this.state.song}/>
                </div>

                <div className="row">
                    <button className="play" onClick={this.playSong.bind(this)}>Play</button>
                </div>

            </div>
        );
    }

}

export default App;
