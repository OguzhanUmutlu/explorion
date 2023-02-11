const Color = {
    CHAR: "\u00A7", // §, char code: 167, Alt + 2(num lock) + 1(num lock)
    COLORS: {
        0: "#000000",
        1: "#0000AA",
        2: "#00AA00",
        3: "#00AAAA",
        4: "#AA0000",
        5: "#AA00AA",
        6: "#FFAA00",
        7: "#AAAAAA",
        8: "#555555",
        9: "#5555FF",
        a: "#55FF55",
        b: "#55FFFF",
        c: "#FF5555",
        d: "#FF55FF",
        e: "#FFFF55",
        f: "#FFFFFF"
    },
    OBFUSCATED: "k",
    BOLD: "l",
    STRIKETHROUGH: "m",
    UNDERLINE: "n",
    ITALIC: "o",
    RESET: "r",
    REGEX: /(\u00A7[1234567890abcdefklmnor])/,
};

class ColorfulText {
    constructor(text) {
        this.split = text.split(Color.REGEX);
        this.compiled = [];
        this.html = "";
        const def = {
            color: "#ffffff", obfuscated: false, bold: false, strikethrough: false, underline: false, italic: false
        };
        let options = {...def};
        for (let i = 0; i < this.split.length; i++) {
            const spl = this.split[i];
            if (!spl) continue;
            if (spl.length !== 2 || spl[0] !== Color.CHAR || ![..."1234567890abcdefklmnor"].includes(spl[1])) {
                this.compiled.push({text: spl, ...options});
                const span = document.createElement("span");
                span.innerText = spl;
                this.html += `<span style="color: ${options.color}${options.bold ? ";font-weight:bold" : ""}${options.strikethrough || options.underline ? ";font-decoration:" + (options.strikethrough ? "line-through" : "") + (options.underline ? " underline" : "") : ""}${options.italic ? ";font-style:italic" : ""}"${options.obfuscated ? " data-obfuscated=1" : ""}>${span.innerHTML}</span>`;
                continue;
            }
            if (Color.COLORS[spl[1]]) options.color = Color.COLORS[spl[1]];
            else if (spl[1] === Color.OBFUSCATED) options.obfuscated = !options.obfuscated;
            else if (spl[1] === Color.BOLD) options.bold = !options.bold;
            else if (spl[1] === Color.STRIKETHROUGH) options.strikethrough = !options.strikethrough;
            else if (spl[1] === Color.UNDERLINE) options.underline = !options.underline;
            else if (spl[1] === Color.ITALIC) options.italic = !options.italic;
            else if (spl[1] === Color.RESET) options = {...def};
        }
    };
}