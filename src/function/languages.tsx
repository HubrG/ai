export default function languageString(lang: string) {
    let language = "";
    if (lang === "fr") {
        language = "french";
    } else if (lang === "en") {
        language = "english";
    } else if (lang === "de") {
        language = "german";
    } else if (lang === "it") {
        language = "italian";
    } else if (lang === "es") {
        language = "spanish";
    } else if (lang === "pt") {
        language = "portuguese";
    } else if (lang === "ru") {
        language = "russian";
    } else if (lang === "sv") {
        language = "swedish";
    } else if (lang === "tr") {
        language = "turkish";
    } else if (lang === "zh") {
        language = "chinese";
    } else if (lang === "ja") {
        language = "japanese";
    } else if (lang === "ko") {
        language = "korean";
    } else if (lang === "id") {
        language = "indonesian";
    } else if (lang === "hi") {
        language = "hindi";
    } else {
        language = "english";
    }
    return language;
}