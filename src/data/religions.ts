export interface Religion {
  slug: string;
  name: string;
  emoji: string;
  // One-line tagline shown on the /religions index (~10–15 words).
  tagline: string;
  // Matches the religion `name` field from countryFacts (case-insensitive).
  // Use anchored patterns to avoid pulling in unrelated entries.
  matchPattern: RegExp;
  blurb: string;
  // Set when the CIA Factbook commonly rolls this group into broader buckets
  // (Protestant, Evangelical, Other), so the strict country list below
  // materially undercounts real-world presence. Triggers a footnote.
  undercount?: boolean;
}

export const religions: Religion[] = [
  {
    slug: 'christian',
    name: 'Christian',
    emoji: '✝️',
    tagline: 'The broadest bucket for followers of Jesus across all denominations.',
    matchPattern: /^christian$/i,
    blurb:
      'Christianity is a monotheistic faith built around the life, teachings, death, and resurrection of Jesus of Nazareth, whom adherents regard as the incarnate Son of God and the promised Messiah. It emerged in the 1st-century Roman province of Judea from a Jewish milieu and spread rapidly across the Mediterranean through the missionary work of the apostles. Its scripture is the Bible, which combines the Old Testament — shared with Judaism — and the New Testament, centered on the four Gospels and the letters of Paul. Core teachings hold that humanity is reconciled to God through the sacrificial death and bodily resurrection of Christ, and that believers are called to love God and neighbor. Worship typically centers on Sunday services that include scripture reading, preaching, prayer, and the sacraments of baptism and communion. With roughly 2.4 billion adherents, Christianity is the world\'s largest religion and divides into three main branches: Roman Catholic, Protestant, and Orthodox.',
  },
  {
    slug: 'roman-catholic',
    name: 'Roman Catholic',
    emoji: '⛪',
    tagline: 'The largest Christian communion, in full communion with the Bishop of Rome.',
    matchPattern: /^roman catholic$/i,
    blurb:
      'Roman Catholicism is the world\'s largest Christian tradition, led by the Pope — the Bishop of Rome — and organized through a global hierarchy of bishops, priests, deacons, and religious orders whose apostolic authority Catholics trace unbroken back to Saint Peter. The Church teaches that salvation flows through the sacraments, seven of which — Baptism, Confirmation, Eucharist, Reconciliation, Anointing of the Sick, Holy Orders, and Matrimony — mark the significant passages of Christian life. Worship centers on the Mass, a liturgy in which bread and wine are consecrated and believed to become the body and blood of Christ. Scripture, interpreted within the lens of Sacred Tradition and the teaching authority of the Magisterium, is the Catholic Bible, which includes the deuterocanonical books. Marian devotion and the veneration of saints are distinctive practices. With over 1.3 billion baptized members, Catholicism has a particularly strong presence in Europe, Latin America, the Philippines, and sub-Saharan Africa.',
  },
  {
    slug: 'protestant',
    name: 'Protestant',
    emoji: '📖',
    tagline: 'The Reformation tradition — scripture alone, grace alone, faith alone.',
    matchPattern: /^protestant$/i,
    blurb:
      'Protestantism is the branch of Christianity that emerged from the 16th-century Reformation, sparked in 1517 when German monk Martin Luther publicly challenged the sale of indulgences and the authority of the Pope. Reformers including Luther, John Calvin, and Huldrych Zwingli championed the principles known as the five solas — scripture alone, faith alone, grace alone, Christ alone, and the glory of God alone — arguing that the Bible rather than church tradition is the final authority and that salvation is a free gift received through faith. Protestantism has no single central authority and today encompasses thousands of denominations, including Lutherans, Reformed, Anglicans, Baptists, Methodists, Pentecostals, and Evangelicals. Worship styles vary from formal liturgy to informal contemporary services, but usually emphasize preaching, congregational singing, and the two sacraments of baptism and the Lord\'s Supper. With roughly 900 million adherents worldwide, Protestantism is the most internally diverse of the major Christian traditions.',
  },
  {
    slug: 'orthodox',
    name: 'Orthodox',
    emoji: '☦️',
    undercount: true,
    tagline: 'The Eastern Christian churches tracing their liturgy to the apostolic era.',
    matchPattern: /^orthodox$/i,
    blurb:
      'Eastern Orthodoxy is a communion of self-governing (autocephalous) Christian churches that preserve the liturgy, theology, and sacramental life of the undivided first-millennium Church. The communion formally separated from the Roman Catholic Church in the Great Schism of 1054 over disputes about papal authority and the wording of the Nicene Creed. Orthodoxy has no single central authority comparable to the Pope; instead, the Ecumenical Patriarch of Constantinople is honored as the "first among equals" of the bishops who lead the various national churches. Worship centers on the Divine Liturgy, a chanted service thick with incense, icons, and ancient prayers, and is organized around seven sacraments — most prominently baptism and the Eucharist. Scripture and Sacred Tradition are held in equal authority, and theology emphasizes theosis: the gradual transformation of the believer into the likeness of God. There are approximately 220 million Orthodox Christians worldwide, concentrated in Eastern Europe, Russia, and the Middle East.',
  },
  {
    slug: 'muslim',
    name: 'Muslim',
    emoji: '☪️',
    tagline: 'Followers of Islam, a monotheistic faith founded by the Prophet Muhammad.',
    matchPattern: /^muslim$/i,
    blurb:
      'Islam is a monotheistic faith founded in 7th-century Arabia on the revelations that Muslims believe were delivered by the angel Gabriel to the Prophet Muhammad between 610 and 632 CE. Those revelations are collected in the Quran, which together with the hadith — recorded sayings and actions of the Prophet — forms the foundation of Islamic law and practice. Core belief centers on the absolute oneness of God (tawhid), and religious life is organized around the Five Pillars: the declaration of faith, five daily prayers, almsgiving, fasting during Ramadan, and pilgrimage to Mecca. The faith divides mainly into two branches: Sunni, who represent roughly 85% of Muslims and recognize the legitimate succession of the caliphs, and Shia, who hold that leadership belonged to the Prophet\'s family. With approximately 1.9 billion followers, Islam is the world\'s second-largest religion and the majority faith across the Middle East, North Africa, and much of South and Southeast Asia.',
  },
  {
    slug: 'hindu',
    name: 'Hindu',
    emoji: '🕉️',
    tagline: 'The ancient dharmic tradition of the Indian subcontinent.',
    matchPattern: /^hindu$/i,
    blurb:
      'Hinduism is the ancient dharmic tradition of the Indian subcontinent, with roots reaching back over three thousand years to the Vedic religion of the Indus Valley civilization. It has no single founder, no central authority, and no single scripture — instead, a vast corpus of sacred texts including the Vedas, Upanishads, Bhagavad Gita, and the epic Ramayana and Mahabharata shape belief and practice. Hinduism encompasses an enormous spectrum of philosophies and devotional traditions, from the monistic thought of Advaita Vedanta to the worship of personal deities like Vishnu, Shiva, and the Divine Mother. Shared concepts include dharma (sacred duty), karma (the moral law of cause and effect), samsara (the cycle of rebirth), and moksha (liberation from that cycle). Daily practice typically involves puja — offerings of light, water, and flowers made at home or temple shrines — along with festivals, pilgrimage, yoga, and meditation. With roughly 1.2 billion adherents, Hinduism is the world\'s third-largest religion.',
  },
  {
    slug: 'buddhist',
    name: 'Buddhist',
    emoji: '☸️',
    tagline: 'The path of awakening taught by Siddhartha Gautama in ancient India.',
    matchPattern: /^buddhist$/i,
    blurb:
      'Buddhism is a path of awakening founded in 5th-century BCE India by Siddhartha Gautama, who became known as the Buddha — the "Awakened One" — after attaining enlightenment beneath a bodhi tree. His teaching is organized around the Four Noble Truths: life involves suffering, suffering arises from craving, suffering can cease, and the Noble Eightfold Path leads to that cessation. Core practices include ethical conduct, meditation, and the cultivation of wisdom, aimed at liberation (nirvana) from the cycle of rebirth. Unlike theistic religions, Buddhism does not posit a creator god; instead, teachings center on the Three Jewels of the Buddha, the Dharma (his teachings), and the Sangha (the community). The tradition divides into three major schools — Theravada, dominant in Southeast Asia; Mahayana, dominant in East Asia; and Vajrayana, dominant in Tibet and the Himalayas. Worldwide there are roughly 500 million Buddhists, with the greatest populations in China, Thailand, Myanmar, and Japan.',
  },
  {
    slug: 'jewish',
    name: 'Jewish',
    emoji: '✡️',
    tagline: 'The covenantal faith of the Jewish people, rooted in the Torah.',
    matchPattern: /^jewish$/i,
    blurb:
      'Judaism is the covenantal monotheistic tradition of the Jewish people, whose origins trace back roughly 3,500 years to the patriarch Abraham and the Exodus of the Israelites from Egypt under Moses, to whom God is said to have revealed the Torah at Mount Sinai. Scripture is the Tanakh — the Hebrew Bible — and its study is deepened through the Talmud, the vast rabbinic compilation of oral law and commentary that has shaped Jewish practice for nearly two millennia. Religious life is structured by halakha, the path of Jewish law governing prayer, diet, ethics, family life, and the weekly Sabbath. Worship centers on the synagogue, where services feature Torah readings, liturgical prayers, and the leadership of rabbis rather than priests. Major branches include Orthodox, Conservative, Reform, and Reconstructionist Judaism, each interpreting tradition differently. There are approximately 15 million Jews worldwide, concentrated in Israel, the United States, and historic diaspora communities across Europe and the Americas.',
  },
  {
    slug: 'greek-orthodox',
    name: 'Greek Orthodox',
    emoji: '☦️',
    undercount: true,
    tagline: 'The Greek-speaking churches of the Eastern Orthodox communion.',
    matchPattern: /^greek orthodox$/i,
    blurb:
      'Greek Orthodoxy is part of the Eastern Orthodox Church, one of the oldest continuously existing Christian traditions, tracing its lineage to the apostles and the Greek-speaking churches of the Roman Empire. Worship centers on the Divine Liturgy, an elaborate chanted service rich in incense, icons, and ancient prayers, and the faith is structured around seven sacraments — most prominently baptism and the Eucharist. The tradition holds Holy Scripture and Sacred Tradition in equal authority and recognizes the Ecumenical Patriarch of Constantinople as the "first among equals" of Orthodox bishops worldwide. Theologically, Greek Orthodoxy emphasizes theosis — the gradual transformation of the believer into the likeness of God through grace, prayer, fasting, and participation in the sacraments.',
  },
  {
    slug: 'russian-orthodox',
    name: 'Russian Orthodox',
    emoji: '☦️',
    undercount: true,
    tagline: 'The largest autocephalous church of the Eastern Orthodox communion.',
    matchPattern: /^russian orthodox$/i,
    blurb:
      'The Russian Orthodox Church is the largest of the autocephalous Eastern Orthodox churches, headquartered in Moscow and tracing its origin to 988, when Prince Vladimir of Kievan Rus\' accepted Byzantine Christianity and ordered the baptism of his people in the Dnieper River. Worship preserves the ancient Byzantine Divine Liturgy, chanted in Old Church Slavonic, and features the Russian tradition of elaborate icon screens (iconostases) that separate the nave from the altar. The Church is led by the Patriarch of Moscow and All Rus\' and follows the broader Orthodox framework of seven sacraments, scripture read alongside Sacred Tradition, and the teachings of the seven Ecumenical Councils. Russian Orthodoxy has produced a rich monastic and hesychast spirituality, notably through figures like Seraphim of Sarov and the Optina Elders. After decades of Soviet repression the Church has undergone major revival, and today it claims roughly 100 million adherents across Russia, Ukraine, Belarus, and the diaspora.',
  },
  {
    slug: 'armenian-apostolic',
    name: 'Armenian Apostolic',
    emoji: '☦️',
    undercount: true,
    tagline: 'One of the oldest national churches, founded by apostles Thaddeus and Bartholomew.',
    matchPattern: /^armenian apostolic( christian)?$/i,
    blurb:
      'The Armenian Apostolic Church is one of the oldest national Christian churches in the world. Tradition holds that the apostles Thaddeus and Bartholomew brought the gospel to Armenia in the 1st century, and in 301 CE — under King Tiridates III and Saint Gregory the Illuminator — Armenia became the first state to adopt Christianity as its official religion. The Church belongs to the Oriental Orthodox communion, which broke with the wider Christian world after rejecting the christological formula of the Council of Chalcedon in 451. It is led by the Catholicos of All Armenians, seated at the monastery of Etchmiadzin, believed to stand on the site of a vision of Christ. Worship preserves an ancient liturgy in Classical Armenian, and the Armenian alphabet — created by Mesrop Mashtots around 405 — was developed specifically to translate scripture. Roughly 9 million Armenians worldwide identify with the Church, both in the Republic of Armenia and across the global diaspora.',
  },
  {
    slug: 'lutheran',
    name: 'Lutheran',
    emoji: '🌹',
    undercount: true,
    tagline: 'The Reformation tradition of Martin Luther — justification by grace through faith.',
    matchPattern: /^(evangelical )?lutheran$/i,
    blurb:
      'Lutheranism is the branch of Protestantism that grew from Martin Luther\'s 16th-century Reformation in the German lands, dating from the 1517 publication of his Ninety-Five Theses against the sale of indulgences. Its theology is defined by the central insistence that a person is justified before God by grace alone through faith alone in Christ alone, with scripture as the ultimate authority. The tradition holds two sacraments — baptism and the Lord\'s Supper — and affirms the real presence of Christ "in, with, and under" the bread and wine. Worship retains much of the older catholic liturgy, including vestments, a church calendar, and strong congregational hymn singing, for which Luther himself composed classics like "A Mighty Fortress Is Our God." Governance varies: Scandinavian Lutherans often retain bishops, while many American Lutheran bodies are more congregational. Worldwide, Lutherans number roughly 75 million, most heavily concentrated in Germany, Scandinavia, and parts of Africa and North America.',
  },
  {
    slug: 'evangelical',
    name: 'Evangelical',
    emoji: '✝️',
    undercount: true,
    tagline: 'Bible-centered Protestantism emphasizing personal conversion and mission.',
    matchPattern: /^evangelical$/i,
    blurb:
      'Evangelicalism is a transdenominational Protestant movement that crystallized out of the 18th-century revivals led by figures like George Whitefield, John Wesley, and Jonathan Edwards in Britain and colonial America. Historian David Bebbington\'s widely cited definition identifies four defining marks: conversionism (a personal "born again" experience), biblicism (the authority and sufficiency of scripture), crucicentrism (emphasis on the atoning work of Christ on the cross), and activism (a drive to share the gospel and engage in mission). Evangelicals cross denominational lines — Baptists, Methodists, Pentecostals, and independent churches all include strong evangelical streams — and typically prioritize personal prayer, Bible study, and evangelism over formal liturgy. Worship tends to be congregational and contemporary, often built around preaching, modern worship music, and small-group discipleship. Global evangelicalism has grown rapidly through mission and revival movements, especially across Latin America, sub-Saharan Africa, and East Asia, with perhaps 600 million adherents worldwide today.',
  },
  {
    slug: 'pentecostal',
    name: 'Pentecostal',
    emoji: '🔥',
    undercount: true,
    tagline: 'The Spirit-filled Protestant renewal movement of the 20th century.',
    matchPattern: /^pentecostal$/i,
    blurb:
      'Pentecostalism is a Protestant renewal movement that emerged in the early 20th century, traditionally dated to the 1906 Azusa Street Revival in Los Angeles led by African American preacher William J. Seymour. The name derives from the biblical Day of Pentecost, when the Holy Spirit descended on the apostles. Pentecostals teach that the same charismatic gifts — tongues-speaking (glossolalia), prophecy, divine healing, and other manifestations of the Spirit — are available to believers today. Doctrinally Protestant, Pentecostals affirm scripture as the final authority and salvation through faith in Christ, but distinguish themselves by emphasizing a subsequent experience called "baptism in the Holy Spirit," often evidenced by tongues. Worship is expressive and participatory, featuring modern praise music, extemporaneous prayer, testimony, and often altar calls for healing. Denominations include the Assemblies of God, the Church of God in Christ, and thousands of independent congregations. Pentecostalism is among the fastest-growing Christian movements, with roughly 280 million adherents worldwide.',
  },
  {
    slug: 'adventist',
    name: 'Adventist',
    emoji: '🌅',
    undercount: true,
    tagline: 'The Seventh-day Sabbath-keeping Christian tradition born of 19th-century American revival.',
    matchPattern: /^(seventh[- ]day )?adventist$/i,
    blurb:
      'Adventism is a Protestant tradition that arose from the 19th-century American Millerite revival, when Baptist preacher William Miller predicted the imminent return of Christ for the early 1840s. When the expected date passed, one group of Millerites reorganized around new biblical interpretations and formally became the Seventh-day Adventist Church in 1863, under the influential leadership of Ellen G. White. Central distinctives are the observance of a Saturday (seventh-day) Sabbath — from Friday sunset to Saturday sunset — and the expectation of an imminent literal second coming of Christ. Adventists are biblically conservative, practice believer\'s baptism by immersion, and traditionally emphasize healthful living, including vegetarianism and abstention from alcohol and tobacco. The Church runs an extensive global network of hospitals, schools, and universities, and operates through a representative General Conference system based in Silver Spring, Maryland. Worldwide membership is roughly 22 million, making Adventism one of the larger global Protestant bodies.',
  },
  {
    slug: 'latter-day-saint',
    name: 'Latter-day Saint',
    emoji: '🏛️',
    undercount: true,
    tagline: 'The Restoration movement founded by Joseph Smith — commonly known as Mormon.',
    matchPattern: /^latter-day saint$/i,
    blurb:
      'The Latter-day Saint movement — commonly known as Mormon — is a Restoration tradition founded in 1830 by Joseph Smith in upstate New York. Smith taught that he had received a new volume of scripture, the Book of Mormon, which he translated from golden plates revealed by an angel named Moroni, and that God had called him to restore the original Christian Church that had fallen into apostasy. The largest body in the movement is the Church of Jesus Christ of Latter-day Saints, headquartered in Salt Lake City and led by a president regarded as a living prophet alongside the Quorum of the Twelve Apostles. Scripture includes the Bible, the Book of Mormon, the Doctrine and Covenants, and the Pearl of Great Price. Distinctive practices include baptism by immersion, temple ordinances (endowments, sealings, and baptisms for the dead), tithing, and an expectation of full-time missionary service. The Church reports roughly 17 million members worldwide.',
  },
  {
    slug: 'jehovahs-witness',
    name: "Jehovah's Witness",
    emoji: '🚪',
    tagline: 'A non-Trinitarian restorationist movement founded in 1870s Pennsylvania.',
    matchPattern: /^jehovah'?s witness$/i,
    blurb:
      'Jehovah\'s Witnesses are a restorationist Christian movement founded in the 1870s by Charles Taze Russell in Pennsylvania, originally as the Bible Student movement, and reorganized under the current name in 1931 by Joseph Franklin Rutherford. Their theology is strictly non-Trinitarian: they hold that Jehovah is the one true God, that Jesus is his first creation rather than God incarnate, and that the Holy Spirit is God\'s active force rather than a person. They use their own translation of the Bible, the New World Translation, and believe that Christ began ruling invisibly in 1914 in anticipation of the end of the present world system. Distinctive practices include door-to-door evangelism, refusal of blood transfusions, abstention from military service and national celebrations, and formal congregational study in local Kingdom Halls. The movement is governed by a Governing Body based at world headquarters in Warwick, New York. Roughly 8.7 million adherents worldwide actively report ministry hours.',
  },
  {
    slug: 'sikh',
    name: 'Sikh',
    emoji: '🪯',
    undercount: true,
    tagline: 'The monotheistic dharmic faith founded by Guru Nanak in 15th-century Punjab.',
    matchPattern: /^sikh$/i,
    blurb:
      'Sikhism is a monotheistic faith founded by Guru Nanak in 15th-century Punjab. Nanak taught that there is one universal God whose name is Truth, and that the divine is accessible to all people through honest work, devoted meditation on God\'s name (naam simran), and selfless service to others (seva). The faith was developed by a lineage of ten human gurus, culminating with Guru Gobind Singh, who in 1708 declared the scripture itself — the Guru Granth Sahib — to be the eternal living guru of the Sikhs. Worship centers on the gurdwara, or "gateway to the guru," where the scripture is read, hymns are sung, and a free community meal (langar) is served to all visitors regardless of faith. The Khalsa, an order of initiated Sikhs established in 1699, observe the Five Ks, including uncut hair and a ceremonial dagger. There are roughly 30 million Sikhs worldwide, the majority in India\'s Punjab state.',
  },
  {
    slug: 'bahai',
    name: "Baha'i",
    emoji: '🌟',
    undercount: true,
    tagline: 'The 19th-century faith teaching the unity of all religions and humanity.',
    matchPattern: /^baha'i$/i,
    blurb:
      'The Baha\'i Faith is a 19th-century religion founded in Persia by Baha\'u\'llah (1817–1892), whose name means "the Glory of God." Baha\'is hold that he is the most recent in a long line of divine messengers that includes Abraham, Moses, Buddha, Krishna, Zoroaster, Jesus, and Muhammad, each sent to progressively reveal God\'s will. Core teachings emphasize the oneness of God, the essential unity of all religions, the equality of women and men, the harmony of science and faith, and the ultimate unity of humankind. The faith has no clergy: local affairs are guided by elected nine-member Spiritual Assemblies, with the worldwide community governed by the Universal House of Justice in Haifa, Israel. Daily practice includes obligatory prayer, a nineteen-day fast, and regular devotional gatherings. Despite severe persecution in Iran, roughly 5–8 million adherents are spread across more countries than any other religion except Christianity.',
  },
  {
    slug: 'taoist',
    name: 'Taoist',
    emoji: '☯️',
    undercount: true,
    tagline: 'The ancient Chinese philosophical and religious tradition of the Tao.',
    matchPattern: /^taoist$/i,
    blurb:
      'Taoism is an ancient Chinese tradition — both philosophy and organized religion — centered on the Tao, the underlying principle and natural flow of the universe. Its foundational text is the Tao Te Ching, a short work of poetic aphorisms traditionally attributed to the 6th-century BCE sage Laozi, and its philosophical canon is filled out by the Zhuangzi, a collection of allegories and parables from the 4th century BCE. Core ideas include wu wei (effortless, non-contrived action), the balance of yin and yang, and living in harmony with nature through simplicity, spontaneity, and inner cultivation. Religious Taoism developed from the 2nd century CE onward and blends philosophical Taoism with alchemy, ritual, meditation, martial arts, and a vast pantheon of deities and immortals administered by ordained priests. Major sects include Zhengyi and Quanzhen. Alongside Confucianism and Buddhism, Taoism has shaped Chinese spirituality for two millennia, with tens of millions of adherents today in China, Taiwan, and the Chinese diaspora.',
  },
  {
    slug: 'rastafarian',
    name: 'Rastafarian',
    emoji: '🦁',
    tagline: 'The Afrocentric faith born in 1930s Jamaica, centered on Emperor Haile Selassie I.',
    matchPattern: /^rastafarian$/i,
    blurb:
      'Rastafari is an Afrocentric religious and social movement that emerged in 1930s Jamaica in the wake of Marcus Garvey\'s Pan-African teachings. Adherents venerate Ethiopian Emperor Haile Selassie I — crowned in 1930 under the throne name "King of Kings, Lord of Lords, Conquering Lion of the Tribe of Judah" — as the returned messiah foretold in biblical prophecy and as the living embodiment of God, whom they call Jah. Rastafari teaches that Black Africans are a diasporic people in exile from their true homeland, and that repatriation to Africa — especially Ethiopia — is both spiritual and literal. Scripture is the Bible, read through an Afrocentric lens alongside the Holy Piby and the Kebra Nagast. Distinctive practices include the wearing of dreadlocks, an Ital (natural, often vegetarian) diet, reasoning sessions, and the ritual use of cannabis as a sacred herb. There are roughly one million Rastafarians worldwide, concentrated in the Caribbean, the Americas, Africa, and the United Kingdom.',
  },
  {
    slug: 'vodou',
    name: 'Vodou',
    emoji: '🥁',
    tagline: 'The Afro-Haitian religion that fuses West African spirits with Catholic saints.',
    matchPattern: /^vodou$/i,
    blurb:
      'Haitian Vodou is a syncretic religion that developed among enslaved West and Central Africans in colonial Saint-Domingue, where Dahomean, Kongo, and Yoruba spiritual traditions fused with elements of Roman Catholicism. Central to the faith is a supreme distant creator called Bondye and a vast pantheon of intermediary spirits known as lwa, who fall into several "nations" — including the cool, water-associated Rada lwa and the hotter, fiercer Petwo lwa. Practitioners honor the lwa through drumming, song, and dance in ceremonies where the spirits are invited to "mount" initiates and speak through them. Priests (houngans) and priestesses (mambos) lead rituals, while the peristil (temple yard) and poto mitan (central pillar) serve as sacred space. The tradition has been continually caricatured since the Haitian Revolution of 1791, which it helped inspire. Today Vodou is practiced by the majority of Haitians alongside Catholicism, and by significant diaspora communities in the Dominican Republic, the United States, and Canada.',
  },
  {
    slug: 'druze',
    name: 'Druze',
    emoji: '⭐',
    tagline: 'The secretive monotheistic faith of the Levant, rooted in Ismaili esotericism.',
    matchPattern: /^druze$/i,
    blurb:
      'The Druze faith is an 11th-century esoteric monotheistic religion that branched from Ismaili Shia Islam during the reign of the Fatimid caliph al-Hakim bi-Amr Allah in Cairo. Its public preaching closed in 1043 under the community\'s founders Hamza ibn Ali and al-Muqtana Baha al-Din, and since then the tradition has been closed: no conversion in or out, and marriage strictly within the community. Theology draws on Neoplatonic philosophy, gnostic thought, and Ismaili cosmology, with core beliefs including the absolute unity of God, the transmigration of souls, and a series of divine emanations. The community is divided into the uqqal ("knowers"), who are formally initiated into the sacred texts and rituals, and the juhhal ("unlearned"), who observe general ethical principles without access to esoteric teaching. Worship takes place in khalwas — simple prayer halls — rather than mosques. Roughly one million Druze live primarily in the mountains of Lebanon, Syria, Israel, and Jordan.',
  },
];

export function findReligionBySlug(slug: string): Religion | undefined {
  return religions.find((r) => r.slug === slug);
}

