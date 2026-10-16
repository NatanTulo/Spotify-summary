const nouns = {
    plays: { pl: ['odtworzenie', 'odtworzenia', 'odtworzeń'], en: ['play', 'plays'] },
    tracks: { pl: ['utwór', 'utwory', 'utworów'], en: ['track', 'tracks'] },
    artists: { pl: ['artysta', 'artyści', 'artystów'], en: ['artist', 'artists'] },
    albums: { pl: ['album', 'albumy', 'albumów'], en: ['album', 'albums'] },
    minutes: { pl: ['minuta', 'minuty', 'minut'], en: ['minute', 'minutes'] },
} as const
export function countLabel(count: number, noun: keyof typeof nouns, language: string): string {
    const pl = language === 'pl'
    const category = new Intl.PluralRules(pl ? 'pl' : 'en').select(count)
    const forms = nouns[noun][pl ? 'pl' : 'en']
    const index = pl ? category === 'one' ? 0 : category === 'few' ? 1 : 2 : category === 'one' ? 0 : 1
    return `${count.toLocaleString(pl ? 'pl-PL' : 'en-GB')} ${forms[index]}`
}
