class Sound {
    static EXTENSIONS = [
        "ogg", "mp3", "wav"
    ];
    //static willPlay = [];

    /*** @type {Object<string, Sound>} */
    static sounds = {};
    /*** @type {HTMLAudioElement} */
    audio = null;

    /**
     * @param {Promise<HTMLAudioElement>} promise
     * @param {string} actualSrc
     */
    constructor(promise, actualSrc) {
        this._promise = promise;
        promise.then(audio => this.audio = audio);
        this.actualSrc = actualSrc;
    };

    get loaded() {
        return !!this.audio;
    };

    static get(src) {
        if (Sound.sounds[src]) return Sound.sounds[src];
        console.log("%cLoading " + src, "color: #ffff00");
        if (!src) throw new Error("Invalid sound src.");
        const audio = document.createElement("audio");
        let resolve;
        const prom = new Promise(r => resolve = r);
        audio.src = src;

        audio.addEventListener("canplaythrough", () => {
            resolve(audio);
            updateLoadingScreen(src);
        });
        audio.addEventListener("error", () => {
            console.log("%cFailed to load " + src, "color: #ff0000");
            updateLoadingScreen(src, false);
        });
        return Sound.sounds[src] = new Sound(prom, src);
    };

    /*** @returns {Promise<void>} */
    async play() {
        if (!this.loaded) return null;
        return await new Promise(r => this.audio.play().then(r).catch(r));
        //return await new Promise(r => Sound.willPlay.push([this, r]));
    };

    async wait() {
        await this._promise;
    };
}

/*const SoundHandler = () => {
    setInterval(() => {
        Sound.willPlay.forEach(i => {
            i[0].audio.play().then(i[1]).catch(i[1]);
        });
        Sound.willPlay = [];
    });
    removeEventListener("click", SoundHandler);
};
addEventListener("click", SoundHandler);*/