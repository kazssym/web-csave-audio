// app.js
// Copyright (C) 2020 Kaz Nishimura
//
// This program is free software: you can redistribute it and/or modify it
// under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or (at your
// option) any later version.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License
// for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// This file is a module script and shall be in strict mode by default.

/**
 * ES module for the application.
 *
 * @module app.js
 */

import "https://unpkg.com/audioworklet-polyfill/dist/audioworklet-polyfill.js";

const FAKE_HEADER = Uint8Array.of(
    0xd3, 0xd3, 0xd3, 0xd3, 0xd3, 0xd3, 0xd3, 0xd3, 0xd3, 0xd3,
    0x20, 0x20, 0x20, 0x20, 0x20, 0x20);

function createCsaveNode(context)
{
    let form = document.forms["demo"];
    let symbolRate = 0;
    if (form != null) {
        for (let radio of form["symbol-rate"]) {
            if (radio.checked) {
                symbolRate = parseFloat(radio.value);
                console.debug("symbol rate checked: %d", symbolRate);
            }
        }
    }
    if (symbolRate == 0) {
        symbolRate = 1200;
    }

    let textArea = document.getElementById("text-data");
    let data = [];
    if (textArea != null) {
        let encoder = new TextEncoder();
        data = encoder.encode(textArea.value);
    }

    let csaveNode = new AudioWorkletNode(context, "csave-processor", {
        processorOptions: {
            symbolRate: symbolRate,
            records: [
                {preamble: 4.0, bytes: FAKE_HEADER},
                {preamble: 2.0, bytes: data},
            ],
        },
    });
    return csaveNode;
}

/**
 * Audio renderers.
 */
class Renderer
{
    /**
     * Constructs an audio renderer object.
     *
     * @param {AudioContext} context an audio context
     */
    constructor(context)
    {
        this._audioContext = context;
    }

    get audioContext()
    {
        return this._audioContext;
    }

    async play()
    {
        if (this.audioContext.state == "suspended") {
            await this.audioContext.resume();
        }

        let csaveNode = createCsaveNode(this.audioContext);
        csaveNode.connect(this.audioContext.destination);
    }
}

function doPlay(/* event */)
{
    renderer.play();
}

async function doRender(/* event */)
{
    if (audioContext.state == "suspended") {
        await audioContext.resume();
    }

    let csaveNode = createCsaveNode(audioContext);
    let destination = audioContext.createMediaStreamDestination();
    csaveNode.connect(destination);

    let recorder = new MediaRecorder(destination.stream, {
        mimeType: "audio/ogg",
    });
    recorder.addEventListener("dataavailable", () => {
        console.debug("data available");
    });
    recorder.addEventListener("stop", () => {
        console.debug("stopped recording");
    });
    recorder.start(1000);
    console.debug("started recording");
    console.debug("mimeType: %s", recorder.mimeType);
}

function bindCommands()
{
    for (let element of document.getElementsByClassName("app-command-play")) {
        element.addEventListener("click", doPlay);
        if (element.disabled) {
            element.disabled = false;
        }
    }
    for (let element of document.getElementsByClassName("app-command-render")) {
        element.addEventListener("click", doRender);
        // if (element.disabled) {
        //     element.disabled = false;
        // }
    }
}

async function registerServiceWorker(name)
{
    let registration = await navigator.serviceWorker.register(name);
    console.debug("registered service worker: %o", registration);
}


registerServiceWorker("./service.js")
    .catch((error) => {
        console.warn("failed to register a service worker: %o", error);
    });

let AudioContext = window.AudioContext;
if (AudioContext == null) {
    AudioContext = window.webkitAudioContext;
}


/**
 * Audio context.
 */
let audioContext = new AudioContext();
audioContext.addEventListener("statechange", (/* event */) => {
    console.debug("AudioContext state changed: %s", audioContext.state);
});

if (audioContext.audioWorklet != null) {
    audioContext.audioWorklet.addModule("./resources/worklet.js");

    bindCommands();
}
else {
    alert("AudioWorklet support is missing.");
}

let renderer = new Renderer(audioContext);
