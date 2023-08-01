import { of, delay, map, shareReplay, combineLatestWith } from "rxjs";
import { localConfig$, readConfig } from "./config";

const browserVoices$ = of(window.speechSynthesis.getVoices()).pipe(
    delay(1000),
    map(() => window.speechSynthesis.getVoices())
);

export const voices$ = browserVoices$.pipe(
    //tap(console.log),
    shareReplay(1)
);

const voiceConfig$ = readConfig("voice");

export const selectedVoice$ = voices$.pipe(
    combineLatestWith(voiceConfig$),
    map(([voices, voiceURI]) => {
        const def = voices.findIndex(voice => voice.default);
        let index = voices.findIndex(voice => voice.voiceURI == voiceURI);
        if (index == -1)
            index = def;
        return voices[index];
    }),
    //tap(console.log)
);