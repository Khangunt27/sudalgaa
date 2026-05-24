export type PlanHighlightDetails = {
  food: string[];
  weather: string;
  transport: string;
  activities: string[];
  duration: string;
  cost: string;
};

export type PlanHighlight = {
  id: string;
  title: string;
  description: string;
  image: string;
  prompt: string;
  details: PlanHighlightDetails;
};

export type PlanDay = {
  id: string;
  title: string;
  summary: string;
  highlights: PlanHighlight[];
};

export type DestinationPlan = {
  destinationKeywords: string[];
  heroImage: string;
  intro: string;
  days: PlanDay[];
  practicalTips: {
    title: string;
    tips: string[];
  };
  coordinates?: {
    lat: number;
    lon: number;
    radius?: number;
  };
};

export const ULAANBAATAR_PLAN: DestinationPlan = {
  destinationKeywords: ["ulaanbaatar", "ulan bator", "уб"],
  heroImage:
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
  intro:
    "Улаанбаатар хотын 48 цагийн аяллын төлөвлөгөөг санал болгож байна. Хотын соёл, түүх, орчин үеийн амьдралыг тэнцвэртэй мэдрээрэй.",
  coordinates: {
    lat: 47.92123,
    lon: 106.918556,
    radius: 6000,
  },
  days: [
    {
      id: "day-1",
      title: "Өглөөний уламжлал ба төвийн соёл",
      summary:
        "Хотын төвийн хамгийн чухал түүхэн газруудаар алхан, үндэсний музейн үзмэртэй танилцаарай.",
      highlights: [
        {
          id: "highlight-sukhbaatar",
          title: "Сүхбаатарын талбайн өглөөний алхалт",
          description:
            "08:30 – 09:30 • Улсын төв талбайн орчимд өглөөний алхалт хийж, Засгийн газрын ордон, Чингис хааны хөшөө, орчин үеийн архитектурын уур амьсгалыг мэдрэх.",
          image:
            "https://upload.wikimedia.org/wikipedia/commons/0/0b/Sukhbaatar_Square_2015.jpg",
          prompt:
            "Сүхбаатарын талбайн өглөөний алхалтын дэлгэрэнгүй маршрут гаргаад өгөөч.",
          details: {
            food: [
              "CU Coffee & Bakery – түргэн өглөөний кофе",
              "Millie’s Espresso – өглөөний сэндвич, латте",
            ],
            weather:
              "Хавар, намар өглөө 5-10°C сэрүүхэн тул дулаан куртка өмсөх.",
            transport:
              "Чингисийн талбай руу 2, 23 дугаар автобус, эсвэл 5 минутын такси.",
            activities: [
              "Чингис хааны морьтой хөшөөний зураг авах",
              "Үндэсний музей, УБ баганын түүхэн самбар үзэх",
            ],
            duration: "1 цаг",
            cost: "Үнэгүй",
          },
        },
        {
          id: "highlight-museum",
          title: "Үндэсний музейн соёлын аялал",
          description:
            "10:00 – 12:00 • Монголчуудын түүх, нүүдэлчин соёлыг багтаасан гайхалтай үзмэрүүдтэй танилц.",
          image:
            "https://upload.wikimedia.org/wikipedia/commons/5/5e/National_Museum_of_Mongolia.jpg",
          prompt:
            "Үндэсний музей үзэхэд гарын авлага болгож асуух 5 асуулт санал болгооч.",
          details: {
            food: [
              "Modern Nomads – уламжлалт монгол хоолны багц",
              "Millie’s Café – олон улсын хөнгөн хоол",
            ],
            weather:
              "Дотор үзмэр тул жилийн турш тохиромжтой, гаднах алхалт богино.",
            transport:
              "Талбайгаас 5 минут явган. Таксигаар 4000₮ орчим төлнө.",
            activities: [
              "Чингис хааны үеийн хуяг дуулга",
              "Нүүдэлчдийн гэр ахуйн үзмэр",
              "Совет үеийн ховор эдлэл",
            ],
            duration: "1.5-2 цаг",
            cost: "Насанд хүрэгчид 12000₮, оюутан 8000₮",
          },
        },
        {
          id: "highlight-lunch",
          title: "Монгол хоолны өдрийн зоог",
          description:
            "12:30 – 13:30 • Modern Nomads, Veranda зэрэг орчин үеийн ресторанаар монгол үндэсний болон fusion хоол амтлах.",
          image:
            "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=1200&q=80",
          prompt:
            "Улаанбаатарт орчин үеийн монгол хоол амтлах ресторануудыг санал болгоорой.",
          details: {
            food: [
              "Modern Nomads – бууз, хорхог, гурилтай шөл",
              "Veranda – монгол-итали fusion, rooftop terrace",
            ],
            weather:
              "Дотор талбай тул улирлын нөлөө багатай. Зуны улиралд веранд дээр суух боломжтой.",
            transport:
              "Сүхбаатарын талбайгаас 7-10 минут явган эсвэл 2000₮ такси.",
            activities: [
              "Монгол үндэсний хоолнуудаас амталж үзэх",
              "Хотын төвийн rooftop-оос зураг авах",
            ],
            duration: "1 цаг",
            cost: "Нэг хүнд 35000₮-55000₮",
          },
        },
      ],
    },
    {
      id: "day-1-evening",
      title: "Хотын панорама ба урлагийн шөнө",
      summary:
        "Оройн үзвэр, хотын нурууг тольдох цэгүүдээр аялж, орчин үеийн урлагийн үзүүлбэр үзээрэй.",
      highlights: [
        {
          id: "highlight-zaisan",
          title: "Зайсан толгойн нар жаргалт",
          description:
            "18:30 – 19:30 • Улаанбаатарын панорамыг харах хамгийн алдартай цэг. Оройн тоглоомын талбай, кафе, Sky Resort-ийн гэрлэн чимэглэл үзэх.",
          image:
            "https://upload.wikimedia.org/wikipedia/commons/0/0f/Zaisan_Memorial_Ulaanbaatar.jpg",
          prompt:
            "Зайсан толгой орчимд оройн хооллох газар санал болгоно уу.",
          details: {
            food: [
              "Sky Lounge – коктейль, steak",
              "Terrazza – пицца, паста",
            ],
            weather:
              "Орой 18-21 цагт хавар, намар 5-8°C; өвөлд тааран хувцаслах.",
            transport:
              "Чөлөөт такси 7000₮ орчим. 7, 8 дугаар автобус Зайсан төв хүртэл явна.",
            activities: [
              "Зөвлөлтийн дурсгалын ханын зураг",
              "Хотын гэрэл, зураг авах viewpoint",
            ],
            duration: "1 цаг",
            cost: "Талбайд орох төлбөргүй, кафены зардал тусдаа",
          },
        },
        {
          id: "highlight-theatre",
          title: "Түмэн эхийн үндэсний цам",
          description:
            "20:00 – 21:30 • Түмэн эх чуулгын үндэсний бүжиг, хөөмэйн тоглолтыг үзэж монгол урлагийн өнгө аяс мэдэр.",
          image:
            "https://images.unsplash.com/photo-1512427691650-1e0c6c944f48?auto=format&fit=crop&w=1200&q=80",
          prompt:
            "Түмэн эхийн тоглолтод очиход хэрэгтэй мэдээллийг жагсааж өгөөч.",
          details: {
            food: [
              "Тэнгис орчмын ресторанууд – Green Zone, Seoul House",
              "Tiger One Pub – хөнгөн зууш",
            ],
            weather:
              "Дотор танхим тул улирлын нөлөөгүй. Орой 19 цагаас эхэлдэг.",
            transport:
              "Хотын төвөөс 5 минутын такси; 23, 24 автобус баялаг төвөөр дайрдаг.",
            activities: [
              "Монгол хөөмэй, морин хуурын амьд тоглолт",
              "Цамын бүжгийн зураг авах (фото билет 10000₮)",
            ],
            duration: "1.5 цаг",
            cost: "Насанд хүрэгчид 65000₮, хүүхэд 35000₮",
          },
        },
      ],
    },
    {
      id: "day-2",
      title: "Байгалийн амралт ба уламжлалт амьдрал",
      summary:
        "Хотын захын байгаль, монгол ахуйтай танилцах аялал хийж, амралтын туршлага ав.",
      highlights: [
        {
          id: "highlight-terelj",
          title: "Тэрэлжийн байгалийн аялал",
          description:
            "09:00 – 15:00 • Ямаа чулуу, Ариабалагийн хийд, морь унах, гер гэрт зоог барих туршлагатай өдөр.",
          image:
            "https://upload.wikimedia.org/wikipedia/commons/7/7d/Turtle_Rock_Terelj.jpg",
          prompt:
            "Тэрэлжид нэг өдрийн аяллын маршрут, тээврийн сонголт, зардлын тооцоог гаргаж өг.",
          details: {
            food: [
              "Ger camp-ийн уламжлалт хоол (боорцог, цай)",
              "Terelj Lodge buffet – олон улсын сонголт",
            ],
            weather:
              "Зун 18-22°C, хавар/намар 10°C орчим – салхи ихтэй тул салхины куртка ав.",
            transport:
              "Хотын төвөөс 70 км, хувийн машин 1.5 цаг. Найдвартай тур оператор 120000₮-с эхэлнэ.",
            activities: [
              "Ямаа чулуу, Ариабал хийд рүү алхалт",
              "Морь унах, треккинг, камерт зураг авч үлдээх",
            ],
            duration: "Бүтэн өдөр",
            cost: "Хөтөлбөрөөс шалтгаалан 120000₮-250000₮",
          },
        },
        {
          id: "highlight-ger",
          title: "Хотоос зайдуу гэр буудаллах туршлага",
          description:
            "16:00 – 21:00 • Chinggis Khaan Statue Complex эсвэл Tuul Riverside Lodge зэрэг газарт хагас өдрийн аялал, гэр буудаллах туршлага ав.",
          image:
            "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80",
          prompt:
            "Гэр буудаллахад бэлтгэх жагсаалт, урьдчилан захиалах зөвлөмж гаргаарай.",
          details: {
            food: [
              "Ger camp дээрх уламжлалт махан хоол, хээрийн BBQ",
              "Tuul Riverside Lodge-ийн органик оройн зоог",
            ],
            weather:
              "Өвөл -20°C хүрч болзошгүй, намар/хавар 0-10°C – дулаан давхар хувцас ав.",
            transport:
              "Тур операторын тээвэр эсвэл хувийн автомашин. Урдчилан захиалга хийх шаардлагатай.",
            activities: [
              "Гэр барьж үзэх туршлага",
              "Од харах, гал тойрон ярилцах",
            ],
            duration: "Хагас өдөр – шөнийн буудал",
            cost: "Хүний 150000₮-250000₮ (хоол, үйлчилгээгээр)",
          },
        },
      ],
    },
  ],
  practicalTips: {
    title: "Аяллын хэрэгтэй зөвлөмж",
    tips: [
      "Хотын төвд Uber байхгүй тул InDriver эсвэл UBCab апп ашиглаарай.",
      "10-р сараас 4-р сар хүртэлх хугацаанд дулаан хувцас зайлшгүй авч явах.",
      "Музей, театрын тасалбарыг урьдчилан онлайнаар захиалбал эгнээ багасна.",
      "Хотын түгжрэлийг тооцоолж өргөн чөлöö, Энхтайвны өргөн чөлөөг орой үдээс өмнө дайрч өнгөрөх.",
    ],
  },
};

export const curatedPlans = [ULAANBAATAR_PLAN];

