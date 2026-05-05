// ============================================================================
// HS CODE KNOWLEDGE BASE — China & Indonesia
// ============================================================================
// Structure:
//   - The first 6 digits are the HS (Harmonized System) anchor — globally shared
//   - Digits 7-8 in Indonesia follow AHTN (ASEAN Harmonised Tariff Nomenclature)
//     extended into BTKI (Buku Tarif Kepabeanan Indonesia), typically 8 digits
//   - China uses 8-10 digit national extensions on top of the 6-digit HS
//
// Tariff rates: MFN (Most Favoured Nation) applied rates as commonly published.
// These are illustrative; real-time rates require the official tariff books
// (China Customs Tariff Implementation Plan 2025 / BTKI 2022 + amendments).
//
// Sources used for compilation (referenced in the UI):
//   [1] WCO HS 2022 nomenclature
//   [2] China Customs Tariff Implementation Plan (海关进出口税则)
//   [3] Indonesia BTKI 2022 (Permenkeu 26/2022)
//   [4] ASEAN Harmonised Tariff Nomenclature (AHTN 2022)
//   [5] WTO Tariff Download Facility
// ============================================================================

const HS_DATABASE = [
  // ---- TEXTILES & APPAREL ----
  {
    hs6: "610910",
    description: "T-shirts, singlets and other vests, knitted or crocheted, of cotton",
    keywords: ["t-shirt", "tshirt", "tee shirt", "singlet", "vest", "cotton shirt", "kaos", "kaos katun", "棉T恤", "T恤", "汗衫"],
    china: {
      code: "6109100010",
      description: "棉制针织T恤衫、汗衫及其他背心 (Knitted cotton T-shirts and singlets)",
      mfn: "16%",
      vat: "13%",
      notes: "Subject to textile labelling requirements"
    },
    indonesia: {
      code: "6109.10.00",
      description: "Kaos oblong (T-shirt), singlet dan kaos kutang lainnya, dirajut atau dikait, dari kapas",
      mfn: "25%",
      vat: "11% (PPN)",
      notes: "Import permit (LS) may apply; SNI certification for some sub-categories"
    }
  },
  {
    hs6: "620342",
    description: "Men's or boys' trousers, breeches and shorts, of cotton (not knitted)",
    keywords: ["men trousers", "men's pants", "cotton trousers", "shorts", "breeches", "celana pria", "celana katun", "男裤", "棉裤"],
    china: {
      code: "6203420010",
      description: "男式棉制长裤、马裤及短裤",
      mfn: "16%",
      vat: "13%"
    },
    indonesia: {
      code: "6203.42.00",
      description: "Celana panjang, celana pendek dan celana setengah lutut, untuk pria atau anak laki-laki, dari kapas",
      mfn: "25%",
      vat: "11% (PPN)"
    }
  },
  {
    hs6: "640299",
    description: "Footwear with outer soles and uppers of rubber or plastics, other",
    keywords: ["footwear", "shoes", "sneakers", "sepatu", "sepatu karet", "鞋", "塑料鞋", "橡胶鞋"],
    china: {
      code: "6402990000",
      description: "其他橡胶或塑料制外底及鞋面的鞋靴",
      mfn: "10%",
      vat: "13%"
    },
    indonesia: {
      code: "6402.99.90",
      description: "Alas kaki lainnya dengan sol luar dan bagian atas dari karet atau plastik",
      mfn: "25%",
      vat: "11% (PPN)",
      notes: "SNI mandatory for certain footwear categories"
    }
  },

  // ---- ELECTRONICS ----
  {
    hs6: "851712",
    description: "Telephones for cellular networks or other wireless networks (smartphones)",
    keywords: ["smartphone", "mobile phone", "cell phone", "iphone", "android phone", "telepon seluler", "ponsel", "hp", "智能手机", "手机", "移动电话"],
    china: {
      code: "8517130000",
      description: "智能手机 (Smartphones)",
      mfn: "0%",
      vat: "13%",
      notes: "ITA product — 0% MFN"
    },
    indonesia: {
      code: "8517.13.00",
      description: "Telepon pintar (smartphone)",
      mfn: "0%",
      vat: "11% (PPN)",
      notes: "TKDN (local content) requirement: minimum 35% for 4G/5G devices; IMEI registration mandatory"
    }
  },
  {
    hs6: "847130",
    description: "Portable automatic data processing machines, weighing not more than 10 kg (laptops)",
    keywords: ["laptop", "notebook", "portable computer", "macbook", "komputer jinjing", "笔记本电脑", "便携计算机"],
    china: {
      code: "8471300000",
      description: "便携式自动数据处理设备，重量不超过10千克",
      mfn: "0%",
      vat: "13%",
      notes: "ITA product"
    },
    indonesia: {
      code: "8471.30.20",
      description: "Komputer jinjing portabel beratnya tidak lebih dari 10 kg",
      mfn: "0%",
      vat: "11% (PPN)",
      notes: "SNI compliance required"
    }
  },
  {
    hs6: "852872",
    description: "Reception apparatus for television, colour, other (LED/LCD TVs)",
    keywords: ["television", "tv", "led tv", "lcd tv", "smart tv", "televisi", "电视", "彩色电视机", "液晶电视"],
    china: {
      code: "8528720000",
      description: "彩色电视接收机",
      mfn: "30%",
      vat: "13%"
    },
    indonesia: {
      code: "8528.72.92",
      description: "Pesawat penerima televisi warna lainnya",
      mfn: "10%",
      vat: "11% (PPN)",
      notes: "SNI mandatory; TKDN for 4K and above"
    }
  },
  {
    hs6: "850440",
    description: "Static converters (power adapters, UPS, inverters)",
    keywords: ["power adapter", "charger", "ups", "inverter", "static converter", "adaptor", "充电器", "适配器", "逆变器"],
    china: {
      code: "8504400000",
      description: "静止式变流器",
      mfn: "5%",
      vat: "13%"
    },
    indonesia: {
      code: "8504.40.90",
      description: "Pengubah statis lainnya",
      mfn: "5%",
      vat: "11% (PPN)"
    }
  },

  // ---- MACHINERY ----
  {
    hs6: "841830",
    description: "Freezers of the chest type, capacity not exceeding 800 litres",
    keywords: ["freezer", "chest freezer", "cold storage", "lemari pendingin", "卧式冷柜", "冷冻柜"],
    china: {
      code: "8418300000",
      description: "卧式冷藏箱，容量不超过800升",
      mfn: "10%",
      vat: "13%"
    },
    indonesia: {
      code: "8418.30.10",
      description: "Lemari pembeku tipe peti, kapasitas tidak melebihi 800 liter",
      mfn: "5%",
      vat: "11% (PPN)",
      notes: "SNI mandatory; energy efficiency labelling required"
    }
  },
  {
    hs6: "842111",
    description: "Cream separators",
    keywords: ["cream separator", "centrifuge", "milk separator", "pemisah krim", "奶油分离机", "离心分离机"],
    china: {
      code: "8421110000",
      description: "奶油分离机",
      mfn: "8%",
      vat: "13%"
    },
    indonesia: {
      code: "8421.11.00",
      description: "Mesin pemisah krim",
      mfn: "5%",
      vat: "11% (PPN)"
    }
  },

  // ---- CHEMICALS & PHARMACEUTICALS ----
  {
    hs6: "300490",
    description: "Medicaments consisting of mixed or unmixed products for therapeutic uses, in measured doses, other",
    keywords: ["medicine", "medicament", "pharmaceutical", "drug", "tablet", "capsule", "obat", "obat-obatan", "药品", "成药", "药物"],
    china: {
      code: "3004900000",
      description: "其他配药用的混合或未混合产品制成的药品",
      mfn: "4%",
      vat: "13%",
      notes: "NMPA registration required"
    },
    indonesia: {
      code: "3004.90.99",
      description: "Obat-obatan lainnya",
      mfn: "5%",
      vat: "11% (PPN)",
      notes: "BPOM registration mandatory; halal certification for certain categories"
    }
  },
  {
    hs6: "330499",
    description: "Beauty or make-up preparations and preparations for the care of the skin, other",
    keywords: ["cosmetics", "skincare", "moisturizer", "lotion", "make-up", "skin care", "kosmetik", "perawatan kulit", "化妆品", "护肤品", "面霜"],
    china: {
      code: "3304990000",
      description: "其他美容品或化妆品及护肤品",
      mfn: "1%",
      vat: "13%",
      notes: "NMPA filing required for non-special cosmetics"
    },
    indonesia: {
      code: "3304.99.90",
      description: "Sediaan rias lainnya dan sediaan untuk perawatan kulit lainnya",
      mfn: "10%",
      vat: "11% (PPN)",
      notes: "BPOM notification mandatory; halal certification phase-in"
    }
  },

  // ---- FOOD & AGRICULTURE ----
  {
    hs6: "090111",
    description: "Coffee, not roasted, not decaffeinated",
    keywords: ["coffee beans", "green coffee", "raw coffee", "kopi", "kopi mentah", "biji kopi", "咖啡豆", "未烘焙咖啡"],
    china: {
      code: "0901110000",
      description: "未焙炒、未浸除咖啡因的咖啡",
      mfn: "8%",
      vat: "9%"
    },
    indonesia: {
      code: "0901.11.10",
      description: "Kopi tidak digongseng, tidak dihilangkan kafeinnya, Arabika",
      mfn: "5%",
      vat: "11% (PPN)",
      notes: "Phytosanitary certificate required"
    }
  },
  {
    hs6: "151110",
    description: "Crude palm oil",
    keywords: ["palm oil", "crude palm oil", "cpo", "minyak sawit", "minyak kelapa sawit", "棕榈油", "毛棕榈油"],
    china: {
      code: "1511100000",
      description: "棕榈油毛油",
      mfn: "9%",
      vat: "9%"
    },
    indonesia: {
      code: "1511.10.00",
      description: "Minyak kelapa sawit mentah",
      mfn: "0%",
      vat: "11% (PPN)",
      notes: "Export levy applies; ISPO certification"
    }
  },
  {
    hs6: "180310",
    description: "Cocoa paste, not defatted",
    keywords: ["cocoa paste", "cocoa mass", "chocolate liquor", "pasta kakao", "可可浆", "可可膏"],
    china: {
      code: "1803100000",
      description: "未脱脂的可可酱",
      mfn: "10%",
      vat: "13%"
    },
    indonesia: {
      code: "1803.10.00",
      description: "Pasta kakao, tidak dihilangkan lemaknya",
      mfn: "5%",
      vat: "11% (PPN)"
    }
  },

  // ---- AUTOMOTIVE ----
  {
    hs6: "870321",
    description: "Motor cars with spark-ignition engine, cylinder capacity not exceeding 1,000 cc",
    keywords: ["car", "passenger vehicle", "small car", "compact car", "mobil", "mobil kecil", "汽车", "小排量汽车", "小轿车"],
    china: {
      code: "8703211090",
      description: "排气量不超过1000毫升的轿车",
      mfn: "15%",
      vat: "13%",
      notes: "Consumption tax applies based on engine size"
    },
    indonesia: {
      code: "8703.21.29",
      description: "Kendaraan bermotor lainnya, kapasitas silinder tidak melebihi 1.000 cc",
      mfn: "50%",
      vat: "11% (PPN)",
      notes: "PPnBM (luxury tax) 15-40% depending on emissions; TKDN considerations"
    }
  },
  {
    hs6: "870880",
    description: "Suspension systems and parts thereof for motor vehicles",
    keywords: ["suspension", "shock absorber", "strut", "car suspension", "suspensi", "peredam kejut", "悬挂系统", "减震器"],
    china: {
      code: "8708800000",
      description: "机动车辆悬挂系统及其零件",
      mfn: "6%",
      vat: "13%"
    },
    indonesia: {
      code: "8708.80.90",
      description: "Sistem suspensi dan bagiannya untuk kendaraan bermotor",
      mfn: "10%",
      vat: "11% (PPN)"
    }
  },

  // ---- METALS & MINERALS ----
  {
    hs6: "720839",
    description: "Flat-rolled products of iron or non-alloy steel, not in coils, hot-rolled, thickness less than 3mm",
    keywords: ["hot rolled steel", "steel sheet", "iron sheet", "flat steel", "baja canai panas", "热轧钢", "钢板"],
    china: {
      code: "7208390000",
      description: "厚度小于3毫米的非合金钢热轧扁平材",
      mfn: "3%",
      vat: "13%"
    },
    indonesia: {
      code: "7208.39.00",
      description: "Produk canai lantaian dari besi atau baja bukan paduan, tidak dalam gulungan, dicanai panas",
      mfn: "5%",
      vat: "11% (PPN)",
      notes: "Anti-dumping duties apply for some origins; SNI mandatory"
    }
  },
  {
    hs6: "740311",
    description: "Refined copper cathodes and sections of cathodes",
    keywords: ["copper cathode", "refined copper", "copper", "tembaga", "katoda tembaga", "电解铜", "精炼铜", "阴极铜"],
    china: {
      code: "7403110000",
      description: "电解精炼铜阴极及阴极型材",
      mfn: "0%",
      vat: "13%"
    },
    indonesia: {
      code: "7403.11.00",
      description: "Katoda dan bagian katoda dari tembaga halus",
      mfn: "0%",
      vat: "11% (PPN)"
    }
  },

  // ---- PLASTICS ----
  {
    hs6: "392321",
    description: "Sacks and bags of polymers of ethylene",
    keywords: ["plastic bags", "polyethylene bags", "pe bags", "kantong plastik", "kantung plastik", "聚乙烯袋", "塑料袋"],
    china: {
      code: "3923210000",
      description: "乙烯聚合物制的包装袋及小袋",
      mfn: "10%",
      vat: "13%"
    },
    indonesia: {
      code: "3923.21.99",
      description: "Karung dan kantong dari polimer etilena lainnya",
      mfn: "15%",
      vat: "11% (PPN)"
    }
  },

  // ---- TOYS & SPORTING GOODS ----
  {
    hs6: "950300",
    description: "Tricycles, scooters, dolls, toys, puzzles and other amusement articles",
    keywords: ["toys", "doll", "puzzle", "tricycle", "scooter", "mainan", "boneka", "玩具", "娃娃", "拼图"],
    china: {
      code: "9503009000",
      description: "其他玩具、缩小尺寸的全套模型及类似娱乐用模型",
      mfn: "0%",
      vat: "13%",
      notes: "CCC mandatory for certain electrical toys"
    },
    indonesia: {
      code: "9503.00.99",
      description: "Mainan lainnya",
      mfn: "10%",
      vat: "11% (PPN)",
      notes: "SNI mandatory for many toy categories (SNI 8124)"
    }
  },

  // ---- FURNITURE ----
  {
    hs6: "940360",
    description: "Other wooden furniture",
    keywords: ["wooden furniture", "wood furniture", "table", "chair", "cabinet", "furnitur kayu", "perabot kayu", "木家具", "木制家具"],
    china: {
      code: "9403600000",
      description: "其他木家具",
      mfn: "0%",
      vat: "13%"
    },
    indonesia: {
      code: "9403.60.90",
      description: "Furnitur kayu lainnya",
      mfn: "20%",
      vat: "11% (PPN)",
      notes: "V-Legal certificate for export; SVLK system"
    }
  },

  // ---- RUBBER ----
  {
    hs6: "400122",
    description: "Technically specified natural rubber (TSNR)",
    keywords: ["natural rubber", "tsnr", "rubber", "karet alam", "karet", "天然橡胶", "标准胶"],
    china: {
      code: "4001220000",
      description: "技术分类天然橡胶",
      mfn: "20%",
      vat: "13%"
    },
    indonesia: {
      code: "4001.22.00",
      description: "Karet alam yang dispesifikasikan secara teknis (TSNR)",
      mfn: "0%",
      vat: "11% (PPN)"
    }
  },
];

// ASEAN-China FTA (ACFTA) preferential rates — most goods qualify for 0% under ACFTA
// when accompanied by Form E certificate of origin. This is a critical practical note.
const ACFTA_NOTE = "Under ACFTA (ASEAN-China FTA), most products qualify for 0% preferential tariff with Form E Certificate of Origin. Always check ACFTA eligibility — the MFN rate shown is the non-preferential fallback.";

// Export for use in app.js (browser global)
if (typeof window !== 'undefined') {
  window.HS_DATABASE = HS_DATABASE;
  window.ACFTA_NOTE = ACFTA_NOTE;
}
