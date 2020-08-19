// worklet.js
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
 * ES module for the audio worklet processors.
 *
 * @module worklet.js
 */

/* global sampleRate */

const RENDER_QUANTUM = 128;

/**
 * Audio worklet processor that generates classic *CSAVE* sound.
 *
 * @param {*} options options for the processor
 */
export class CsaveProcessor extends AudioWorkletProcessor
{
    constructor(options)
    {
        super(options);
        this._amplitude = 0.125;
        this._f0 = 1200;
        this._f1 = 2400;

        this._phase = 0;
        this._preambleDuration = sampleRate;
    }

    process(inputs, outputs, /* parameters */)
    {
        if (outputs.length >= 1) {
            let k = 0;
            while (this._preambleDuration != 0) {
                if (k >= RENDER_QUANTUM) {
                    break;
                }

                let value = this._amplitude * Math.sin(this._phase);
                this._phase += 2 * Math.PI * (this._f1 / sampleRate);

                for (let output of outputs) {
                    for (let channel of output) {
                        channel[k] = value;
                    }
                }
                k++;
                this._preambleDuration--;
            }
            return k >= 0;
        }
        return false;
    }
}


console.debug("sample rate: %d", sampleRate);

registerProcessor("csave-processor", CsaveProcessor);
