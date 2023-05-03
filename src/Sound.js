class Sound {
    static ctx = new AudioContext;
    static EXTENSIONS = [
        "ogg", "mp3", "wav"
    ];
    static canCreateContext = false;

    /*** @type {Object<string, Sound>} */
    static sounds = {};
    /*** @type {Object<string, SoundContext>} */
    static ambients = {};
    /*** @type {AudioBuffer} */
    buffer = null;

    /**
     * @param {Promise<AudioBuffer>} promise
     * @param {string} actualSrc
     */
    constructor(promise, actualSrc) {
        this._promise = promise;
        promise.then(buffer => this.buffer = buffer);
        this.actualSrc = actualSrc;
    };

    get loaded() {
        return !!this.buffer;
    };

    static get(src) {
        if (Sound.sounds[src]) return Sound.sounds[src];
        const startMs = performance.now();
        if (!src) throw new Error("Invalid sound src.");
        let resolve;
        const prom = new Promise(r => resolve = r);
        (async () => {
            const blob = await fetch(src).then(async response => {
                updateLoadingScreen(src, true, startMs);
                return response.blob();
            }).catch(() => {
                debug("%cFailed to load " + src, "color: #ff0000");
                updateLoadingScreen(src, false);
                return null;
            });
            if (blob !== null) {
                const reader = new FileReader();
                reader.readAsArrayBuffer(blob);
                const audioContext = new AudioContext();
                /*** @type {AudioBuffer} */
                const audioBuffer = await new Promise(k => reader.onload = () => {
                    const data = reader.result;
                    if (data instanceof ArrayBuffer) audioContext.decodeAudioData(data, a => k(a));
                });
                resolve(audioBuffer);
            }
        })();
        return Sound.sounds[src] = new Sound(prom, src);
    };

    static play(src, volume = 1) {
        if (!this.canCreateContext) return console.warn("Audio context creation failed.");
        this.get(src).play(volume);
    };

    static async loadAmbientAsync(src, volume = 1) {
        if (!this.canCreateContext) return console.warn("Audio context creation failed.");
        if (this.ambients[src]) return this.ambients[src].gain.gain.value = volume;
        const sound = Sound.get(src);
        await sound.wait();
        const ctx = await sound.playAsync(volume, false);
        this.ambients[src] = ctx;
        ctx.loop = true;
    };

    static async playAmbientAsync(src, volume = 1) {
        if (!this.canCreateContext) return debug("Audio context creation failed.");
        await Sound.stopAmbientAsync(src, volume);
        await this.loadAmbientAsync(src, volume);
        this.ambients[src].start();
    };

    static async stopAmbientAsync(src, volume = 1) {
        if (!this.canCreateContext) return debug("Audio context creation failed.");
        await this.loadAmbientAsync(src, volume);
        if (this.ambients[src]) this.ambients[src].stop();
        delete this.ambients[src];
    };

    static playAmbient(src, volume = 1, cb = r => r) {
        Sound.playAmbientAsync(src, volume).then(cb);
    };

    static stopAmbient(src, volume = 1, cb = r => r) {
        Sound.stopAmbientAsync(src, volume).then(cb);
    };

    /*** @returns {Promise<SoundContext>} */
    async playAsync(volume = 1, play = true) {
        if (!Sound.canCreateContext) return new Promise(() => console.warn("Audio context creation failed."));
        if (!this.loaded) await this.wait();
        let extraVol = 1;
        if (this.actualSrc.startsWith("assets/sounds/"))
            extraVol = SoundVolumes[this.actualSrc.substring("assets/sounds/".length).replaceAll(/^\d$/g, "")];
        return await new Promise(async r => {
            const source = new AudioBufferSourceNode(Sound.ctx, {buffer: this.buffer});
            const gainNode = new GainNode(Sound.ctx, {gain: volume * extraVol});
            source.connect(gainNode);
            gainNode.connect(Sound.ctx.destination);
            if (play) source.start();
            r(new SoundContext(source, gainNode));
        });
    };

    play(volume = 1, cb = r => r) {
        this.playAsync(volume).then(cb);
    };

    async wait() {
        await this._promise;
    };
}

class SoundContext {
    static instances = new Set;
    started = false;

    /**
     * @param {AudioBufferSourceNode} source
     * @param {GainNode} gain
     */
    constructor(source, gain) {
        SoundContext.instances.add(this);
        this.source = source;
        this.gain = gain;
        this._ended = false;
        source.onended = () => {
            this._ended = true;
            SoundContext.instances.delete(this);
        };
    };

    get loop() {
        return this.source.loop;
    };

    set loop(v) {
        this.source.loop = v;
    };

    get speed() {
        return this.source.playbackRate;
    };

    set speed(v) {
        this.source.playbackRate = v;
    };

    get ended() {
        return this._ended;
    };

    start() {
        if (this.started) return;
        this.source.start();
        this.started = true;
        if (this._ended) {
            this._ended = false;
            SoundContext.instances.add(this);
        }
    };

    stop() {
        if (!this.started) return;
        this.source.stop();
        this.started = false;
        if (!this._ended) {
            this._ended = true;
            SoundContext.instances.delete(this);
        }
    };
}

addEventListener("mousedown", async () => {
    Sound.canCreateContext = true;
    await Sound.ctx.resume();
});