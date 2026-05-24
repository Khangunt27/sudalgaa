import mapdata from '../assets/mn_mapdata';
import { createPlaceholderImage } from './imageFallback';

// Map Simplemaps names to preferred display names and images
const IMAGE_BY_NAME: Record<string, string> = {
  'Arhangay': 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Tsetserleg_Mongolia.jpg',
  'Bayan-Ölgiy': 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Altai_Tavan_Bogd.jpg',
  'Bayanhongor': 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Bayankhongor_landscape.jpg',
  'Bulgan': 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Bulgan_Aimag_scenery.jpg',
  'Darhan-Uul': 'https://upload.wikimedia.org/wikipedia/commons/2/20/Darkhan_city.jpg',
  'Dornod': 'https://upload.wikimedia.org/wikipedia/commons/7/7f/Dornod_steppe.jpg',
  'Dornogovi': 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Dornogovi_desert.jpg',
  'Dundgovi': 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Dundgovi_Aimag.jpg',
  'Govi-Altay': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Govi-Altai_mountains.jpg',
  'Govĭ-Sümber': 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Govisumber_landscape.jpg',
  'Hentiy': 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Khentii_mountains.jpg',
  'Hovd': 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Khar-Us_Nuur_National_Park.jpg',
  'Hövsgöl': 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Khuvsgul_Lake.jpg',
  'Orhon': 'https://upload.wikimedia.org/wikipedia/commons/2/20/Orkhon_river.jpg',
  'Ömnögovi': 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Khongoryn_Els_Dunes.jpg',
  'Selenge': 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Selenge_River.jpg',
  'Sühbaatar': 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Mongolian_steppe.jpg',
  'Töv': 'https://upload.wikimedia.org/wikipedia/commons/3/35/Terelj_Mongolia.jpg',
  'Uvs': 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Uvs_Lake.jpg',
  'Övörhangay': 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Erdene_Zuu_Monastery.jpg',
  'Dzavhan': 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Great_Lakes_Depression_Mongolia.jpg',
  'Ulaanbaatar': 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Sukhbaatar_Square_2015.jpg',
};

// Comprehensive aimag data with Mongolian names, capitals, coordinates, and attractions
export const AIMAG_DATA: Record<string, {
  nameMn: string;
  capital: string;
  capitalMn: string;
  coordinates: { lat: number; lng: number };
  description: string;
  descriptionMn: string;
  attractions: string[];
  attractionsMn: string[];
  area: string;
  population: string;
}> = {
  'Arhangay': {
    nameMn: 'Архангай',
    capital: 'Tsetserleg',
    capitalMn: 'Цэцэрлэг',
    coordinates: { lat: 47.4750, lng: 101.4542 },
    description: 'Mountainous province in central Mongolia, known for its beautiful landscapes and traditional culture.',
    descriptionMn: 'Төв Монголын уулархаг аймаг, үзэсгэлэнт байгаль, уламжлалт соёлоор алдартай.',
    attractions: ['Tsenkher Hot Springs', 'Khorgo Volcano', 'Terkhiin Tsagaan Lake', 'Chuluut River'],
    attractionsMn: ['Цэнхэр рашаан', 'Хорго хөх', 'Тэрхийн цагаан нуур', 'Чулуут гол'],
    area: '55,300 km²',
    population: '94,000',
  },
  'Bayan-Ölgiy': {
    nameMn: 'Баян-Өлгий',
    capital: 'Ölgii',
    capitalMn: 'Өлгий',
    coordinates: { lat: 48.9683, lng: 89.9686 },
    description: 'Westernmost province, home to Kazakh culture, Altai mountains, and Tavan Bogd peak.',
    descriptionMn: 'Хамгийн баруун аймаг, казах соёл, Алтайн нуруу, Таван богд оргил.',
    attractions: ['Tavan Bogd National Park', 'Potanin Glacier', 'Altai Tavan Bogd', 'Kazakh Eagle Festival'],
    attractionsMn: ['Таван богд байгалийн цогцолборт газар', 'Потанины мөсөн гол', 'Алтайн таван богд', 'Казах бүргэдийн баяр'],
    area: '45,700 km²',
    population: '103,000',
  },
  'Bayanhongor': {
    nameMn: 'Баянхонгор',
    capital: 'Bayankhongor',
    capitalMn: 'Баянхонгор',
    coordinates: { lat: 46.1944, lng: 100.7181 },
    description: 'Central province with diverse landscapes from mountains to desert, rich in wildlife.',
    descriptionMn: 'Төв аймаг, уул, цөлөөр баялаг, ан амьтнаар баялаг.',
    attractions: ['Ikh Bogd Mountain', 'Ongi Monastery ruins', 'Gobi Gurvansaikhan National Park', 'Bayankhongor Museum'],
    attractionsMn: ['Их богд уул', 'Онгийн хийд', 'Говь гурван сайхан байгалийн цогцолборт газар', 'Баянхонгор музей'],
    area: '116,000 km²',
    population: '84,000',
  },
  'Bulgan': {
    nameMn: 'Булган',
    capital: 'Bulgan',
    capitalMn: 'Булган',
    coordinates: { lat: 48.8125, lng: 103.5347 },
    description: 'Northern province with forests, rivers, and historical sites.',
    descriptionMn: 'Хойд аймаг, ой, гол, түүхэн дурсгалт газрууд.',
    attractions: ['Amarbayasgalant Monastery', 'Selenge River', 'Khanui River', 'Bulgan Museum'],
    attractionsMn: ['Амарбаясгалант хийд', 'Сэлэнгэ мөрөн', 'Хануй гол', 'Булган музей'],
    area: '48,700 km²',
    population: '61,000',
  },
  'Darhan-Uul': {
    nameMn: 'Дархан-Уул',
    capital: 'Darkhan',
    capitalMn: 'Дархан',
    coordinates: { lat: 49.4867, lng: 105.9228 },
    description: 'Industrial city and province, second largest city in Mongolia.',
    descriptionMn: 'Аж үйлдвэрийн хот, аймаг, Монголын хоёр дахь том хот.',
    attractions: ['Darkhan Museum', 'Kharagiin Monastery', 'Amgalan Monastery', 'Darkhan Industrial Complex'],
    attractionsMn: ['Дархан музей', 'Харагийн хийд', 'Амгалан хийд', 'Дархан үйлдвэрийн цогцолбор'],
    area: '3,280 km²',
    population: '100,000',
  },
  'Dornod': {
    nameMn: 'Дорнод',
    capital: 'Choibalsan',
    capitalMn: 'Чойбалсан',
    coordinates: { lat: 48.0756, lng: 114.5325 },
    description: 'Easternmost province, vast steppes, important historical region.',
    descriptionMn: 'Хамгийн зүүн аймаг, өргөн тал, чухал түүхэн бүс.',
    attractions: ['Kherlen River', 'Buir Lake', 'Dornod Mongol Steppe', 'Choibalsan Museum'],
    attractionsMn: ['Хэрлэн мөрөн', 'Буйр нуур', 'Дорнод монгол тал', 'Чойбалсан музей'],
    area: '123,600 km²',
    population: '76,000',
  },
  'Dornogovi': {
    nameMn: 'Дорноговь',
    capital: 'Sainshand',
    capitalMn: 'Сайншанд',
    coordinates: { lat: 44.8958, lng: 110.1417 },
    description: 'Eastern Gobi province, desert landscapes, dinosaur fossils.',
    descriptionMn: 'Зүүн говь аймаг, цөлийн байгаль, динозаврын олдворууд.',
    attractions: ['Khamaryn Khiid', 'Moltsog Els sand dunes', 'Sainshand city', 'Gobi dinosaur fossils'],
    attractionsMn: ['Хамарын хийд', 'Молцог элс', 'Сайншанд хот', 'Говь динозаврын олдвор'],
    area: '109,500 km²',
    population: '69,000',
  },
  'Dundgovi': {
    nameMn: 'Дундговь',
    capital: 'Mandalgovi',
    capitalMn: 'Мандалговь',
    coordinates: { lat: 45.7667, lng: 106.2667 },
    description: 'Central Gobi province, semi-desert, nomadic culture.',
    descriptionMn: 'Төв говь аймаг, хагас цөл, нүүдэлчдийн соёл.',
    attractions: ['Ikh Gazryn Chuluu', 'Delgerkhaan Uul', 'Mandalgovi city', 'Gobi landscapes'],
    attractionsMn: ['Их газрын чулуу', 'Дэлгэрхаан уул', 'Мандалговь хот', 'Говь байгаль'],
    area: '74,700 km²',
    population: '42,000',
  },
  'Govi-Altay': {
    nameMn: 'Говь-Алтай',
    capital: 'Altai',
    capitalMn: 'Алтай',
    coordinates: { lat: 46.3722, lng: 96.2583 },
    description: 'Southwestern province, Altai mountains, desert and mountain landscapes.',
    descriptionMn: 'Баруун өмнөд аймаг, Алтайн нуруу, цөл, уулын байгаль.',
    attractions: ['Great Gobi Strictly Protected Area', 'Altai Mountains', 'Khar Us Lake', 'Govi-Altai Museum'],
    attractionsMn: ['Их говь хамгаалалттай газар', 'Алтайн нуруу', 'Хар ус нуур', 'Говь-Алтай музей'],
    area: '141,400 km²',
    population: '58,000',
  },
  'Govĭ-Sümber': {
    nameMn: 'Говьсүмбэр',
    capital: 'Choir',
    capitalMn: 'Чойр',
    coordinates: { lat: 46.3611, lng: 108.3611 },
    description: 'Smallest province, located in central Mongolia, mining region.',
    descriptionMn: 'Хамгийн жижиг аймаг, төв Монголд байрладаг, уул уурхайн бүс.',
    attractions: ['Choir city', 'Govisümber landscapes', 'Mining sites', 'Local museums'],
    attractionsMn: ['Чойр хот', 'Говьсүмбэрийн байгаль', 'Уул уурхайн байгуулагууд', 'Орон нутгийн музей'],
    area: '5,500 km²',
    population: '17,000',
  },
  'Hentiy': {
    nameMn: 'Хэнтий',
    capital: 'Öndörkhaan',
    capitalMn: 'Өндөрхаан',
    coordinates: { lat: 47.3194, lng: 110.6556 },
    description: 'Birthplace of Genghis Khan, mountainous province with forests and rivers.',
    descriptionMn: 'Чингис хааны төрсөн нутаг, ой, голтой уулархаг аймаг.',
    attractions: ['Genghis Khan Birthplace', 'Khentii Mountains', 'Baldan Bereeven Monastery', 'Onon River'],
    attractionsMn: ['Чингис хааны төрсөн газар', 'Хэнтийн нуруу', 'Балдан бэрээвэн хийд', 'Онон мөрөн'],
    area: '80,300 km²',
    population: '71,000',
  },
  'Hovd': {
    nameMn: 'Ховд',
    capital: 'Khovd',
    capitalMn: 'Ховд',
    coordinates: { lat: 48.0056, lng: 91.6417 },
    description: 'Western province, diverse ethnic groups, lakes and mountains.',
    descriptionMn: 'Баруун аймаг, олон үндэстэн, нуур, уул.',
    attractions: ['Khar-Us Lake', 'Khar Nuur', 'Khovd River', 'Khovd Museum'],
    attractionsMn: ['Хар ус нуур', 'Хар нуур', 'Ховд гол', 'Ховд музей'],
    area: '76,100 km²',
    population: '88,000',
  },
  'Hövsgöl': {
    nameMn: 'Хөвсгөл',
    capital: 'Mörön',
    capitalMn: 'Мөрөн',
    coordinates: { lat: 49.6347, lng: 100.1625 },
    description: 'Northern province, home to Khövsgöl Lake, one of the largest freshwater lakes.',
    descriptionMn: 'Хойд аймаг, Хөвсгөл нуурын нутаг, хамгийн том цэнгэг усны нуур.',
    attractions: ['Khövsgöl Lake', 'Darkhad Valley', 'Reindeer herders', 'Mörön city'],
    attractionsMn: ['Хөвсгөл нуур', 'Дархад хөндий', 'Цаатан ард түмэн', 'Мөрөн хот'],
    area: '100,600 km²',
    population: '132,000',
  },
  'Orhon': {
    nameMn: 'Орхон',
    capital: 'Erdenet',
    capitalMn: 'Эрдэнэт',
    coordinates: { lat: 49.0278, lng: 104.0444 },
    description: 'Industrial province, home to Erdenet, major mining city.',
    descriptionMn: 'Аж үйлдвэрийн аймаг, Эрдэнэт хот, том уул уурхайн хот.',
    attractions: ['Erdenet city', 'Orkhon River', 'Mining museum', 'Local markets'],
    attractionsMn: ['Эрдэнэт хот', 'Орхон мөрөн', 'Уул уурхайн музей', 'Орон нутгийн зах'],
    area: '844 km²',
    population: '100,000',
  },
  'Ömnögovi': {
    nameMn: 'Өмнөговь',
    capital: 'Dalanzadgad',
    capitalMn: 'Даланзадгад',
    coordinates: { lat: 43.5708, lng: 104.4250 },
    description: 'Southern Gobi province, famous for sand dunes, dinosaur fossils, and Flaming Cliffs.',
    descriptionMn: 'Өмнөд говь аймаг, элсэн дов, динозаврын олдвор, Галт улаан хад.',
    attractions: ['Khongoryn Els', 'Flaming Cliffs', 'Gurvan Saikhan National Park', 'Yolyn Am'],
    attractionsMn: ['Хонгорын элс', 'Галт улаан хад', 'Гурван сайхан байгалийн цогцолборт газар', 'Ёлын ам'],
    area: '165,400 km²',
    population: '65,000',
  },
  'Selenge': {
    nameMn: 'Сэлэнгэ',
    capital: 'Sükhbaatar',
    capitalMn: 'Сүхбаатар',
    coordinates: { lat: 50.2375, lng: 106.2078 },
    description: 'Northern province, Selenge River, agricultural region.',
    descriptionMn: 'Хойд аймаг, Сэлэнгэ мөрөн, хөдөө аж ахуйн бүс.',
    attractions: ['Selenge River', 'Sükhbaatar city', 'Amarbayasgalant Monastery', 'Agricultural areas'],
    attractionsMn: ['Сэлэнгэ мөрөн', 'Сүхбаатар хот', 'Амарбаясгалант хийд', 'Хөдөө аж ахуйн бүс'],
    area: '41,200 km²',
    population: '108,000',
  },
  'Sühbaatar': {
    nameMn: 'Сүхбаатар',
    capital: 'Baruun-Urt',
    capitalMn: 'Баруун-Урт',
    coordinates: { lat: 46.6806, lng: 113.2833 },
    description: 'Eastern province, vast steppes, nomadic culture.',
    descriptionMn: 'Зүүн аймаг, өргөн тал, нүүдэлчдийн соёл.',
    attractions: ['Steppe landscapes', 'Baruun-Urt city', 'Local museums', 'Traditional ger camps'],
    attractionsMn: ['Тал байгаль', 'Баруун-Урт хот', 'Орон нутгийн музей', 'Уламжлалт гэр айл'],
    area: '82,300 km²',
    population: '58,000',
  },
  'Töv': {
    nameMn: 'Төв',
    capital: 'Zuunmod',
    capitalMn: 'Зуунмод',
    coordinates: { lat: 47.7069, lng: 106.9531 },
    description: 'Central province surrounding Ulaanbaatar, includes Terelj National Park.',
    descriptionMn: 'Улаанбаатарыг тойрсон төв аймаг, Тэрэлж байгалийн цогцолборт газар.',
    attractions: ['Terelj National Park', 'Turtle Rock', 'Aryabal Temple', 'Genghis Khan Statue Complex'],
    attractionsMn: ['Тэрэлж байгалийн цогцолборт газар', 'Ямаа чулуу', 'Ариабалагийн сүм', 'Чингис хааны хөшөөний цогцолбор'],
    area: '74,000 km²',
    population: '90,000',
  },
  'Uvs': {
    nameMn: 'Увс',
    capital: 'Ulaangom',
    capitalMn: 'Улаангом',
    coordinates: { lat: 49.9833, lng: 92.0667 },
    description: 'Western province, Uvs Lake, diverse ecosystems.',
    descriptionMn: 'Баруун аймаг, Увс нуур, олон төрлийн экосистем.',
    attractions: ['Uvs Lake', 'Ulaangom city', 'Khyargas Lake', 'Uvs Nuur Basin'],
    attractionsMn: ['Увс нуур', 'Улаангом хот', 'Хяргас нуур', 'Увс нуурын сав газар'],
    area: '69,600 km²',
    population: '83,000',
  },
  'Övörhangay': {
    nameMn: 'Өвөрхангай',
    capital: 'Arvaikheer',
    capitalMn: 'Арвайхээр',
    coordinates: { lat: 46.2639, lng: 102.7750 },
    description: 'Central province, home to ancient capital Karakorum and Erdene Zuu Monastery.',
    descriptionMn: 'Төв аймаг, эртний нийслэл Хархорум, Эрдэнэ Зуу хийд.',
    attractions: ['Erdene Zuu Monastery', 'Karakorum', 'Orkhon Valley', 'Tövkhön Monastery'],
    attractionsMn: ['Эрдэнэ Зуу хийд', 'Хархорум', 'Орхон хөндий', 'Төвхөн хийд'],
    area: '62,900 km²',
    population: '111,000',
  },
  'Dzavhan': {
    nameMn: 'Завхан',
    capital: 'Uliastai',
    capitalMn: 'Улиастай',
    coordinates: { lat: 47.7417, lng: 96.8444 },
    description: 'Western province, Great Lakes Depression, mountains and lakes.',
    descriptionMn: 'Баруун аймаг, Их нуурын хотгор, уул, нуур.',
    attractions: ['Great Lakes Depression', 'Uliastai city', 'Otgontenger Mountain', 'Zavkhan River'],
    attractionsMn: ['Их нуурын хотгор', 'Улиастай хот', 'Отгонтэнгэр уул', 'Завхан гол'],
    area: '82,500 km²',
    population: '71,000',
  },
  'Ulaanbaatar': {
    nameMn: 'Улаанбаатар',
    capital: 'Ulaanbaatar',
    capitalMn: 'Улаанбаатар',
    coordinates: { lat: 47.8864, lng: 106.9057 },
    description: 'Capital city of Mongolia, political, economic, and cultural center.',
    descriptionMn: 'Монгол улсын нийслэл хот, улс төрийн, эдийн засгийн, соёлын төв.',
    attractions: ['Sükhbaatar Square', 'Gandan Monastery', 'National Museum', 'Zaisan Memorial', 'Bogd Khan Palace', 'Terelj National Park'],
    attractionsMn: ['Сүхбаатарын талбай', 'Гандан хийд', 'Үндэсний музей', 'Зайсан хөшөө', 'Богд хааны ордон', 'Тэрэлж байгалийн цогцолборт газар'],
    area: '4,704 km²',
    population: '1,500,000',
  },
};

export type Aimag = { 
  code: string; 
  name: string; 
  image: string;
  nameMn?: string;
  capital?: string;
  capitalMn?: string;
  coordinates?: { lat: number; lng: number };
  description?: string;
  descriptionMn?: string;
  attractions?: string[];
  attractionsMn?: string[];
  area?: string;
  population?: string;
};

export const AIMAGS: Aimag[] = Object.entries(mapdata.state_specific).map(([code, v]: any) => {
  const data = AIMAG_DATA[v.name] || {};
  return {
    code,
    name: v.name,
    image: IMAGE_BY_NAME[v.name] || createPlaceholderImage('Mongolia', 800, 400),
    ...data,
  };
});


