const destinations = [
  {
    name: "Sukhbaatar Square",
    image: "https://upload.wikimedia.org/wikipedia/commons/0/0b/Sukhbaatar_Square_2015.jpg",
    price: "Free",
  },
  {
    name: "Zaisan",
    image: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Zaisan_Memorial_Ulaanbaatar.jpg",
    price: "Free",
  },
  {
    name: "Gandan Monastery",
    image: "https://upload.wikimedia.org/wikipedia/commons/6/6b/Gandantegchinlen_Monastery%2C_Ulaanbaatar.jpg",
    price: "₮5,000 entry",
  },
  {
    name: "Bogd Khan Palace Museum",
    image: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Bogd_Khaan_Palace_Museum.jpg",
    price: "₮10,000 entry",
  },
  {
    name: "National Museum of Mongolia",
    image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/National_Museum_of_Mongolia.jpg",
    price: "₮15,000 entry",
  },
];

const places = [
  {
    name: "Terelj National Park",
    image: "https://upload.wikimedia.org/wikipedia/commons/7/7d/Turtle_Rock_Terelj.jpg",
    price: "₮20,000 day tour",
  },
  {
    name: "Choijin Lama Temple",
    image: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Choijin_Lama_Temple_Museum.jpg",
    price: "₮8,000 entry",
  },
  {
    name: "Winter Palace of the Bogd Khan",
    image: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Bogd_Khan_Winter_Palace.jpg",
    price: "₮10,000 entry",
  },
  {
    name: "Naran Tuul Market",
    image: "https://upload.wikimedia.org/wikipedia/commons/5/5b/Naran_Tuul_market.jpg",
    price: "Free (shopping extra)",
  },
  {
    name: "Zaisan Memorial",
    image: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Zaisan_Memorial_Ulaanbaatar.jpg",
    price: "Free",
  },
];


const guides = [
  {
    place: 'Sukhbaatar Square Walk',
    description: 'Central square, Government Palace and museums nearby. Great for photos.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Sukhbaatar_Square_2015.jpg',
    price: 'Free',
    user: {
      name: 'Amaraa',
      avatar: 'https://randomuser.me/api/portraits/men/41.jpg',
      views: 612,
    },
  },
  {
    place: 'Gandan Monastery Morning',
    description: 'See monks chanting and the giant Migjid Janraisig statue.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Gandantegchinlen_Monastery%2C_Ulaanbaatar.jpg',
    price: '₮5,000 entry',
    user: {
      name: 'Bolor',
      avatar: 'https://randomuser.me/api/portraits/women/12.jpg',
      views: 487,
    },
  },
  {
    place: 'Terelj Day Trip',
    description: 'Visit Turtle Rock and Aryabal monastery, nature close to UB.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Turtle_Rock_Terelj.jpg',
    price: '₮20,000+',
    user: {
      name: 'Ganzorig',
      avatar: 'https://randomuser.me/api/portraits/men/9.jpg',
      views: 854,
    },
  },
];

//Guide screen data:
const placess = [
  {
    id: "1",
    name: "Sukhbaatar Square",
    image: "https://upload.wikimedia.org/wikipedia/commons/0/0b/Sukhbaatar_Square_2015.jpg",
    description: "Central square surrounded by key landmarks and museums.",
    attributes: {
      location: "Chingeltei, Ulaanbaatar",
      type: "City Landmark",
      bestTime: "May - September",
      attractions: ["Government Palace", "Chinggis Khaan Statue", "National Museum"],
      price: "Free",
    },
  },
  {
    id: "2",
    name: "Gandan Monastery",
    image: "https://upload.wikimedia.org/wikipedia/commons/6/6b/Gandantegchinlen_Monastery%2C_Ulaanbaatar.jpg",
    description: "Largest monastery in Mongolia, active religious site.",
    attributes: {
      location: "Bayangol, Ulaanbaatar",
      type: "Monastery",
      bestTime: "Year-round",
      attractions: ["Migjid Janraisig statue", "Monk chants"],
      price: "₮5,000 entry",
    },
  },
  {
    id: "3",
    name: "Terelj National Park",
    image: "https://upload.wikimedia.org/wikipedia/commons/7/7d/Turtle_Rock_Terelj.jpg",
    description: "Nature getaway with rock formations and temples.",
    attributes: {
      location: "Gorkhi-Terelj",
      type: "National Park",
      bestTime: "May - October",
      attractions: ["Turtle Rock", "Aryabal Temple", "Hiking"],
      price: "₮20,000 day tour",
    },
  },
  {
    id: "4",
    name: "Zaisan Memorial",
    image: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Zaisan_Memorial_Ulaanbaatar.jpg",
    description: "Hilltop Soviet memorial with panoramic city views.",
    attributes: {
      location: "Khan-Uul, Ulaanbaatar",
      type: "Viewpoint",
      bestTime: "Sunset",
      attractions: ["Mural", "Skyline views"],
      price: "Free",
    },
  },
];



// Sample itinerary data (hardcoded, can be fetched from backend later)
const itineraries: { [key: string]: string[] } = {
  "Mysore Palace": [
    "Day 1: Explore Durbar Hall and Royal Artifacts.",
    "Day 2: Attend the Dussehra Festival (October) or evening light show.",
    "Day 3: Visit nearby Chamundi Hills and Jaganmohan Palace.",
  ],
  "Coorg (Kodagu)": [
    "Day 1: Visit Abbey Falls and hike through coffee plantations.",
    "Day 2: Relax at Raja’s Seat and explore Talacauvery.",
    "Day 3: Trek to Tadiandamol Peak or go river rafting.",
  ],
  Hampi: [
    "Day 1: Tour Virupaksha Temple and Hampi Bazaar.",
    "Day 2: Explore Vijaya Vittala Temple and boulder landscapes.",
    "Day 3: Try rock climbing or visit nearby Anjaneya Hill.",
  ],
  Gokarna: [
    "Day 1: Visit Mahabaleshwar Temple and Om Beach.",
    "Day 2: Relax at Kudle Beach or try surfing.",
    "Day 3: Explore Half Moon Beach and Paradise Beach.",
  ],
};

// Sample additional attributes (hardcoded, can be fetched from backend)
const additionalAttributes: {
  [key: string]: { entryFee: string, travelTips: string[] },
} = {
  "Mysore Palace": {
    entryFee: "₹70 for adults, ₹30 for children",
    travelTips: [
      "Book tickets online to avoid queues.",
      "Visit during Dussehra for the grand festival.",
      "Photography inside requires a separate fee.",
    ],
  },
  "Coorg (Kodagu)": {
    entryFee: "Free for most attractions, some estates may charge ₹100-₹200",
    travelTips: [
      "Carry rain gear during monsoon (June-September).",
      "Book homestays in advance for peak season.",
      "Try local Kodava cuisine like Pandi Curry.",
    ],
  },
  Hampi: {
    entryFee: "₹40 for main monuments, free for open ruins",
    travelTips: [
      "Hire a local guide for historical insights.",
      "Wear comfortable shoes for exploring ruins.",
      "Visit in winter for cooler weather.",
    ],
  },
  Gokarna: {
    entryFee: "Free for beaches, temple entry free",
    travelTips: [
      "Respect temple dress codes (cover shoulders and knees).",
      "Book beach shacks early during peak season.",
      "Carry sunscreen for beach activities.",
    ],
  },
};

//Home screen banner image:
<Image
  source={{
    uri: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
  }}
  className="w-full h-80"
  resizeMode="cover"
/>;
