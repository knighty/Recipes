import { localConfig$, readConfig } from "./config.js";

const browserVoices$ = rxjs.of(window.speechSynthesis.getVoices()).pipe(
    rxjs.operators.delay(1000),
    rxjs.operators.map(() => window.speechSynthesis.getVoices())
);

export const voices$ = browserVoices$.pipe(
    //rxjs.operators.tap(console.log),
    rxjs.operators.shareReplay(1)
);

const voiceConfig$ = readConfig("voice");

export const selectedVoice$ = voices$.pipe(
    rxjs.operators.combineLatest(voiceConfig$, (voices, voiceURI) => {
        const def = voices.findIndex(voice => voice.default);
        let index = voices.findIndex(voice => voice.voiceURI == voiceURI);
        if (index == -1)
            index = def;
        return [index, voices[index]];
    }),
    //rxjs.operators.tap(console.log)
);