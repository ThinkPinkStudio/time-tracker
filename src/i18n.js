const TRANSLATIONS = {
  en: {
    nav_converter:          'Converter',
    nav_contacts:           'Contacts',
    nav_settings:           'Settings',
    page_title_converter:   'Time Zones',
    page_subtitle:          'Developed by ThinkPink Studio',
    label_from:             'From',
    label_to:               'To',
    offset_label:           'Difference',
    same_timezone:          'Same timezone',
    page_title_contacts:    'Contacts',
    contact_tagline:        'Custom digital solutions',
    page_title_settings:    'Settings',
    settings_lang_label:    'Language',
    settings_lang_desc:     'Select the app display language',
  },
  it: {
    nav_converter:          'Convertitore',
    nav_contacts:           'Contatti',
    nav_settings:           'Impostazioni',
    page_title_converter:   'Fusi Orari',
    page_subtitle:          'Sviluppato da ThinkPink Studio',
    label_from:             'Da',
    label_to:               'A',
    offset_label:           'Differenza',
    same_timezone:          'Stesso fuso orario',
    page_title_contacts:    'Contatti',
    contact_tagline:        'Soluzioni digitali su misura',
    page_title_settings:    'Impostazioni',
    settings_lang_label:    'Lingua',
    settings_lang_desc:     "Seleziona la lingua di visualizzazione dell'app",
  },
  ny: {
    nav_converter:          'Chosintha',
    nav_contacts:           'Maulemu',
    nav_settings:           'Zokhazikika',
    page_title_converter:   'Maola a Dziko',
    page_subtitle:          'Yapangidwa ndi ThinkPink Studio',
    label_from:             'Kuchokera',
    label_to:               'Kupita',
    offset_label:           'Kusiyana',
    same_timezone:          'Dera lomwelo la nthawi',
    page_title_contacts:    'Maulemu',
    contact_tagline:        'Zinthu za digito mwamakhalidwe anu',
    page_title_settings:    'Zokhazikika',
    settings_lang_label:    'Chinenero',
    settings_lang_desc:     'Sankhani chinenero cha pulogalamu',
  },
  lg: {
    nav_converter:          'Kyusa',
    nav_contacts:           'Enkontaaka',
    nav_settings:           'Entegeka',
    page_title_converter:   "Essawa z'Ensi",
    page_subtitle:          'Yakola ThinkPink Studio',
    label_from:             'Okuva',
    label_to:               'Okutuuka',
    offset_label:           'Enkayana',
    same_timezone:          "Ekifo kimu ky'essawa",
    page_title_contacts:    'Enkontaaka',
    contact_tagline:        "Ebikolebwa by'digito nga bwe bw'oyagala",
    page_title_settings:    'Entegeka',
    settings_lang_label:    'Olulimi',
    settings_lang_desc:     "Londa olulimi lw'pulogulaamu",
  },
  pl: {
    nav_converter:          'Konwerter',
    nav_contacts:           'Kontakt',
    nav_settings:           'Ustawienia',
    page_title_converter:   'Strefy Czasowe',
    page_subtitle:          'Opracowane przez ThinkPink Studio',
    label_from:             'Z',
    label_to:               'Do',
    offset_label:           'Różnica',
    same_timezone:          'Ta sama strefa czasowa',
    page_title_contacts:    'Kontakt',
    contact_tagline:        'Niestandardowe rozwiązania cyfrowe',
    page_title_settings:    'Ustawienia',
    settings_lang_label:    'Język',
    settings_lang_desc:     'Wybierz język wyświetlania aplikacji',
  },
}

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English',           flag: '🇬🇧' },
  { code: 'it', label: 'Italiano',          flag: '🇮🇹' },
  { code: 'ny', label: 'Chichewa (Malawi)', flag: '🇲🇼' },
  { code: 'lg', label: 'Luganda',           flag: '🇺🇬' },
  { code: 'pl', label: 'Polski',            flag: '🇵🇱' },
]

const DATE_LOCALES = {
  en: 'en-GB',
  it: 'it-IT',
  ny: 'en-GB',
  lg: 'en-GB',
  pl: 'pl-PL',
}

let currentLang = localStorage.getItem('lang') || 'en'

function t(key) {
  return (TRANSLATIONS[currentLang] || TRANSLATIONS.en)[key] || key
}

function getDateLocale() {
  return DATE_LOCALES[currentLang] || 'en-GB'
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n)
  })
  document.documentElement.lang = currentLang
}

function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) return
  currentLang = lang
  localStorage.setItem('lang', lang)
  applyTranslations()
  document.querySelectorAll('.lang-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang)
  })
}

function getCurrentLang() {
  return currentLang
}
