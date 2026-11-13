// Product catalogue data.
// Product images are stored in assets/images/products/ so they can be managed independently.
const PRODUCTS = [
  {
    "cat": "Rings",
    "name": "Moonlit Cluster Diamond Ring",
    "price": 12499,
    "attrs": [
      [
        "Finish",
        "White metal, high polish"
      ],
      [
        "Stone",
        "Sparkling diamond flower cluster"
      ],
      [
        "Design",
        "Cluster solitaire with studded shoulders"
      ],
      [
        "Occasion",
        "Engagement, gifting, daily elegance"
      ],
      [
        "Care",
        "Keep dry; store in a pouch; avoid perfume & water"
      ]
    ],
    "desc": "A delicate flower of tiny sparkling stones that catches the light from every angle.",
    "id": 1,
    "img": "assets/images/products/product-01.jpg",
    "mat": "Diamond"
  },
  {
    "cat": "Rings",
    "name": "Eternal Duo Ring Set",
    "price": 18999,
    "attrs": [
      [
        "Finish",
        "Platinum, mirror polish"
      ],
      [
        "Stone",
        "Round solitaire with pavé diamond"
      ],
      [
        "Design",
        "Engagement ring with matching stacked band"
      ],
      [
        "Occasion",
        "Engagement, wedding, anniversary"
      ],
      [
        "Care",
        "Keep dry; store in a pouch; avoid perfume & water"
      ]
    ],
    "desc": "A solitaire ring and a fully studded band, made to be worn together as a perfect pair.",
    "id": 2,
    "img": "assets/images/products/product-02.jpg",
    "mat": "Platinum"
  },
  {
    "cat": "Rings",
    "name": "Blossom Ruby Noir Ring",
    "price": 6999,
    "attrs": [
      [
        "Finish",
        "Black rhodium"
      ],
      [
        "Stone",
        "Ruby-red faceted crystal"
      ],
      [
        "Design",
        "Lotus flower with leaf-vine band"
      ],
      [
        "Occasion",
        "Parties, gifting, statement wear"
      ],
      [
        "Care",
        "Keep dry; store in a pouch; avoid perfume & water"
      ]
    ],
    "desc": "A dark, dramatic lotus blooming around a glowing red stone — bold and romantic.",
    "id": 3,
    "img": "assets/images/products/product-03.jpg",
    "mat": "Silver"
  },
  {
    "cat": "Rings",
    "name": "Royal Filigree Gem Ring",
    "price": 9499,
    "attrs": [
      [
        "Finish",
        "Antique gold-tone"
      ],
      [
        "Stone",
        "Large multi-tone gem with side accents"
      ],
      [
        "Design",
        "Hand-carved filigree band"
      ],
      [
        "Occasion",
        "Festive, wedding guest, special evenings"
      ],
      [
        "Care",
        "Keep dry; store in a pouch; avoid perfume & water"
      ]
    ],
    "desc": "An ornate golden band with intricate filigree work and a showstopping centre gem.",
    "id": 4,
    "img": "assets/images/products/product-04.jpg",
    "mat": "Gold"
  },
  {
    "cat": "Earrings",
    "name": "Ruby Drop Cluster Earrings",
    "price": 14999,
    "attrs": [
      [
        "Finish",
        "White metal, high polish"
      ],
      [
        "Stone",
        "White diamond with ruby-red teardrop"
      ],
      [
        "Design",
        "Floral crescent top with drop"
      ],
      [
        "Occasion",
        "Parties, receptions, gifting"
      ],
      [
        "Closure",
        "Push-back stud"
      ],
      [
        "Care",
        "Keep dry; store in a pouch; avoid perfume & water"
      ]
    ],
    "desc": "Sparkling crescent clusters finished with deep red teardrops for an elegant evening look.",
    "id": 5,
    "img": "assets/images/products/product-05.jpg",
    "mat": "Diamond"
  },
  {
    "cat": "Earrings",
    "name": "Antique Gold Teardrop Earrings",
    "price": 8999,
    "attrs": [
      [
        "Finish",
        "Antique gold-tone"
      ],
      [
        "Stone",
        "Metal filigree (no stones)"
      ],
      [
        "Design",
        "Floral teardrop dangler with carved top"
      ],
      [
        "Occasion",
        "Festive, ethnic wear, daily elegance"
      ],
      [
        "Closure",
        "Push-back stud"
      ],
      [
        "Care",
        "Keep dry; store in a pouch; avoid perfume & water"
      ]
    ],
    "desc": "Lightweight golden teardrops with fine floral carving — pairs beautifully with ethnic outfits.",
    "id": 6,
    "img": "assets/images/products/product-06.jpg",
    "mat": "Gold"
  },
  {
    "cat": "Earrings",
    "name": "Emerald Wing Earrings",
    "price": 17999,
    "attrs": [
      [
        "Finish",
        "Platinum, mirror polish"
      ],
      [
        "Stone",
        "Green emerald-cut crystals with diamond"
      ],
      [
        "Design",
        "Swept wing climber with leaf drop"
      ],
      [
        "Occasion",
        "Cocktail, wedding, party"
      ],
      [
        "Closure",
        "Push-back stud"
      ],
      [
        "Care",
        "Keep dry; store in a pouch; avoid perfume & water"
      ]
    ],
    "desc": "Flowing silver wings studded with sparkle, finished with a cluster of emerald green.",
    "id": 7,
    "img": "assets/images/products/product-07.jpg",
    "mat": "Platinum"
  },
  {
    "cat": "Necklaces",
    "name": "Royal Sapphire Statement Necklace",
    "price": 19999,
    "attrs": [
      [
        "Finish",
        "Platinum, mirror polish"
      ],
      [
        "Stone",
        "Blue sapphire-colour crystals with diamond"
      ],
      [
        "Design",
        "Layered collar with pear-shaped centre drop"
      ],
      [
        "Occasion",
        "Weddings, receptions, gala evenings"
      ],
      [
        "Closure",
        "Adjustable hook"
      ],
      [
        "Care",
        "Keep dry; store in a pouch; avoid perfume & water"
      ]
    ],
    "desc": "A regal collar of white sparkle and deep blue stones, finished with a grand teardrop centre.",
    "id": 8,
    "img": "assets/images/products/product-08.jpg",
    "mat": "Platinum"
  },
  {
    "cat": "Necklaces",
    "name": "Golden Heart Cascade Necklace Set",
    "price": 15999,
    "attrs": [
      [
        "Finish",
        "Gold-tone"
      ],
      [
        "Design",
        "Cascading heart-drop layers"
      ],
      [
        "Includes",
        "Necklace + matching floral studs"
      ],
      [
        "Occasion",
        "Weddings, festivals, traditional wear"
      ],
      [
        "Closure",
        "Adjustable tie-back"
      ],
      [
        "Care",
        "Keep dry; store in a pouch; avoid perfume & water"
      ]
    ],
    "desc": "A flowing waterfall of golden hearts with matching flower studs — pure festive glamour.",
    "id": 9,
    "img": "assets/images/products/product-09.jpg",
    "mat": "Gold"
  },
  {
    "cat": "Necklaces",
    "name": "Midnight Crystal Lace Necklace",
    "price": 18499,
    "attrs": [
      [
        "Finish",
        "Dark gunmetal"
      ],
      [
        "Stone",
        "Pink & violet crystal beads and drops"
      ],
      [
        "Design",
        "Beaded V-shaped lace collar"
      ],
      [
        "Occasion",
        "Cocktail parties, evening wear"
      ],
      [
        "Closure",
        "Adjustable hook"
      ],
      [
        "Care",
        "Keep dry; store in a pouch; avoid perfume & water"
      ]
    ],
    "desc": "A modern lace-style collar in smoky tones with glimmering pink and violet crystals.",
    "id": 10,
    "img": "assets/images/products/product-10.jpg",
    "mat": "Diamond"
  },
  {
    "cat": "Bracelets",
    "name": "Twisted Gold Rope Bracelet",
    "price": 7999,
    "attrs": [
      [
        "Finish",
        "Two-tone gold & silver"
      ],
      [
        "Design",
        "Twisted rope chain"
      ],
      [
        "Occasion",
        "Daily wear, gifting, layering"
      ],
      [
        "Closure",
        "Lobster clasp"
      ],
      [
        "Care",
        "Keep dry; store in a pouch; avoid perfume & water"
      ]
    ],
    "desc": "A classic twisted rope chain in warm gold with silver threads — simple and timeless.",
    "id": 11,
    "img": "assets/images/products/product-11.jpg",
    "mat": "Gold"
  },
  {
    "cat": "Bracelets",
    "name": "Crystal Star Charm Bracelet",
    "price": 3499,
    "attrs": [
      [
        "Finish",
        "Silver-tone"
      ],
      [
        "Stone",
        "Clear faceted crystal & black beads"
      ],
      [
        "Design",
        "Beaded bracelet with star charm"
      ],
      [
        "Occasion",
        "Daily wear, gifting, casual outings"
      ],
      [
        "Closure",
        "Lobster clasp with extender chain"
      ],
      [
        "Care",
        "Keep dry; store in a pouch; avoid perfume & water"
      ]
    ],
    "desc": "Clear crystal beads with black accents and a tiny star charm — light, playful and pretty.",
    "id": 12,
    "img": "assets/images/products/product-12.jpg",
    "mat": "Silver"
  },
  {
    "cat": "Bracelets",
    "name": "Black Onyx Vine Bracelet",
    "price": 5999,
    "attrs": [
      [
        "Finish",
        "18K gold-tone plating"
      ],
      [
        "Stone",
        "Black oval stones with clear marquise leaves"
      ],
      [
        "Design",
        "Wavy vine with leaf accents"
      ],
      [
        "Occasion",
        "Parties, office wear, gifting"
      ],
      [
        "Closure",
        "Fold-over clasp"
      ],
      [
        "Care",
        "Keep dry; store in a pouch; avoid perfume & water"
      ]
    ],
    "desc": "A graceful golden vine set with glossy black stones and sparkling leaves.",
    "fit": "contain",
    "id": 13,
    "img": "assets/images/products/product-13.jpg",
    "mat": "Silver"
  },
  {
    "cat": "Bridal Jewellery",
    "name": "Noir Kundan Choker Set",
    "price": 13999,
    "attrs": [
      [
        "Finish",
        "Gold-tone kundan"
      ],
      [
        "Stone",
        "Kundan with black bead drops"
      ],
      [
        "Includes",
        "Choker + earrings + maang tikka"
      ],
      [
        "Occasion",
        "Wedding, engagement, sangeet"
      ],
      [
        "Closure",
        "Adjustable tie-back"
      ],
      [
        "Care",
        "Keep dry; store in a pouch; avoid perfume & water"
      ]
    ],
    "desc": "A modern black-and-gold kundan choker set with beaded drops, earrings and a matching tikka.",
    "id": 14,
    "img": "assets/images/products/product-14.jpg",
    "mat": "Gold"
  },
  {
    "cat": "Bridal Jewellery",
    "name": "Maharani Kundan Bridal Set",
    "price": 19499,
    "attrs": [
      [
        "Finish",
        "Gold-tone kundan"
      ],
      [
        "Stone",
        "Kundan polki with red bead drops"
      ],
      [
        "Includes",
        "Statement choker + chandbali earrings"
      ],
      [
        "Occasion",
        "Bridal, wedding, reception"
      ],
      [
        "Closure",
        "Adjustable tie-back"
      ],
      [
        "Care",
        "Keep dry; store in a pouch; avoid perfume & water"
      ]
    ],
    "desc": "A grand bridal choker with kundan blooms and ruby-red beads, with jhumka-style earrings.",
    "id": 15,
    "img": "assets/images/products/product-15.jpg",
    "mat": "Gold"
  },
  {
    "cat": "Bridal Jewellery",
    "name": "Pearl Polki Bridal Set",
    "price": 18999,
    "attrs": [
      [
        "Finish",
        "Antique gold-tone"
      ],
      [
        "Stone",
        "Polki-style with pearl drops"
      ],
      [
        "Includes",
        "Necklace + earrings + maang tikka"
      ],
      [
        "Occasion",
        "Bridal, engagement, festive"
      ],
      [
        "Closure",
        "Adjustable tie-back"
      ],
      [
        "Care",
        "Keep dry; store in a pouch; avoid perfume & water"
      ]
    ],
    "desc": "A graceful pearl-drop necklace with matching earrings and tikka for a soft, royal look.",
    "id": 16,
    "img": "assets/images/products/product-16.jpg",
    "mat": "Diamond"
  },
  {
    "cat": "Bridal Jewellery",
    "name": "Ruby Shadow Choker Set",
    "price": 12999,
    "attrs": [
      [
        "Finish",
        "Gold-tone"
      ],
      [
        "Stone",
        "Maroon beads with kundan accents"
      ],
      [
        "Includes",
        "Choker + earrings + maang tikka"
      ],
      [
        "Occasion",
        "Wedding, mehendi, festive"
      ],
      [
        "Closure",
        "Adjustable tie-back"
      ],
      [
        "Care",
        "Keep dry; store in a pouch; avoid perfume & water"
      ]
    ],
    "desc": "A rich maroon-and-gold choker set with chandbali earrings and a statement tikka.",
    "id": 17,
    "img": "assets/images/products/product-17.jpg",
    "mat": "Gold"
  }
];
