// Master data wilayah administrasi untuk struktur kepengurusan kader partai
// Terfokus pada Kalimantan Barat (Kota Pontianak, Kubu Raya, dll.) dan dapat diperluas dinamis

export interface DistrictStructure {
  name: string;
  subdistricts: string[];
}

export interface CityStructure {
  name: string;
  districts: DistrictStructure[];
}

export interface ProvinceStructure {
  name: string;
  cities: CityStructure[];
}

export const MASTER_TERRITORIES: ProvinceStructure[] = [
  {
    name: "KALIMANTAN BARAT",
    cities: [
      {
        name: "KOTA PONTIANAK",
        districts: [
          {
            name: "Pontianak Kota",
            subdistricts: [
              "Darat Sekip",
              "Mariana",
              "Sungai Bangkong",
              "Sungai Jawi",
              "Tengah",
            ],
          },
          {
            name: "Pontianak Barat",
            subdistricts: [
              "Pal Lima",
              "Sungai Beliung",
              "Sungai Jawi Dalam",
              "Sungai Jawi Luar",
            ],
          },
          {
            name: "Pontianak Selatan",
            subdistricts: [
              "Akcaya",
              "Benua Melayu Darat",
              "Benua Melayu Laut",
              "Kota Baru",
              "Parit Tokaya",
            ],
          },
          {
            name: "Pontianak Tenggara",
            subdistricts: [
              "Bangka Belitung Darat",
              "Bangka Belitung Laut",
              "Bansir Darat",
              "Bansir Laut",
            ],
          },
          {
            name: "Pontianak Timur",
            subdistricts: [
              "Banjar Serasan",
              "Dalur Ambawang",
              "Parit Mayor",
              "Saigon",
              "Tambelan Sampit",
              "Tanjung Hilir",
              "Tanjung Hulu",
            ],
          },
          {
            name: "Pontianak Utara",
            subdistricts: [
              "Batu Layang",
              "Siantan Hilir",
              "Siantan Hulu",
              "Siantan Tengah",
            ],
          },
        ],
      },
      {
        name: "KABUPATEN KUBU RAYA",
        districts: [
          {
            name: "Sungai Raya",
            subdistricts: [
              "Arang Limbung",
              "Kuala Dua",
              "Limbung",
              "Madu Sari",
              "Mekar Baru",
              "Parit Baru",
              "Sungai Ambangah",
              "Sungai Asam",
              "Sungai Raya",
              "Sungai Raya Dalam",
              "Tebang Kacang",
              "Teluk Kapuas",
            ],
          },
          {
            name: "Sungai Kakap",
            subdistricts: [
              "Jeruju Besar",
              "Kalimas",
              "Pal Sembilan",
              "Punggur Besar",
              "Punggur Kapuas",
              "Punggur Kecil",
              "Sepuk Laut",
              "Sungai Belidak",
              "Sungai Itik",
              "Sungai Kakap",
              "Sungai Rengas",
              "Tanjung Saleh",
            ],
          },
          {
            name: "Sungai Ambawang",
            subdistricts: [
              "Ampera Raya",
              "Bengkarek",
              "Durian",
              "Jawa Tengah",
              "Korek",
              "Lingga",
              "Mega Timur",
              "Panciroba",
              "Pasak",
              "Pasak Piang",
              "Puguk",
              "Simpang Kanan",
              "Sungai Ambawang Kuala",
              "Sungai Malaya",
              "Teluk Bakung",
            ],
          },
          {
            name: "Rasau Jaya",
            subdistricts: [
              "Bintang Mas",
              "Rasau Jaya Dua",
              "Rasau Jaya Satu",
              "Rasau Jaya Tiga",
              "Rasau Jaya Umum",
              "Seruat Dua",
            ],
          },
          {
            name: "Kuala Mandor B",
            subdistricts: [
              "Kuala Mandor A",
              "Kuala Mandor B",
              "Kubang Padi",
              "Retok",
              "Padi Indah",
            ],
          },
        ],
      },
      {
        name: "KABUPATEN MEMPAWAH",
        districts: [
          {
            name: "Mempawah Hilir",
            subdistricts: ["Tengah", "Terusan", "Tanjung", "Kuala Mempawah", "Pasir"],
          },
          {
            name: "Mempawah Timur",
            subdistricts: ["Pulau Pedalaman", "Antibar", "Parit Banjar", "Sei Bakau Besar"],
          },
          {
            name: "Sungai Pinyuh",
            subdistricts: ["Sungai Pinyuh", "Sungai Purun Kecil", "Peniraman", "Nusapati"],
          },
          {
            name: "Jongkat (Siantan)",
            subdistricts: ["Jungkat", "Sungai Nipah", "Wajok Hilir", "Wajok Hulu"],
          },
        ],
      },
      {
        name: "KOTA SINGKAWANG",
        districts: [
          {
            name: "Singkawang Barat",
            subdistricts: ["Kuala", "Pasiran", "Melayu", "Tengah"],
          },
          {
            name: "Singkawang Tengah",
            subdistricts: ["Roban", "Condong", "Sekip Lama", "Jawa", "Sungai Wie", "Bukit Batu"],
          },
          {
            name: "Singkawang Selatan",
            subdistricts: ["Sedau", "Sijangkung", "Pangmilang", "Sagatani"],
          },
          {
            name: "Singkawang Utara",
            subdistricts: ["Naram", "Sungai Bulan", "Sungai Rasau", "Setapuk Besar", "Setapuk Kecil"],
          },
          {
            name: "Singkawang Timur",
            subdistricts: ["Bagak Sahwa", "Maya Sopa", "Pajintan", "Nyarumkop", "Sanggau Kulor"],
          },
        ],
      },
      {
        name: "KABUPATEN SAMBAS",
        districts: [
          {
            name: "Sambas",
            subdistricts: ["Dalam Kaum", "Pendawan", "Lubu Dagang", "Tanjung Bugis", "Tumuk Manggis"],
          },
          {
            name: "Pemangkat",
            subdistricts: ["Pemangkat Kota", "Harapan", "Gugah", "Penjajap", "Sebatulan"],
          },
          {
            name: "Tebas",
            subdistricts: ["Tebas Kuala", "Tebas Sungai", "Batu Mak Jage", "Bekut", "Serindang"],
          },
        ],
      },
      {
        name: "KABUPATEN SINTANG",
        districts: [
          {
            name: "Sintang",
            subdistricts: ["Baning Kota", "Kapuas Kanan Hulu", "Kapuas Kiri Hilir", "Ladang", "Tanjung Puri"],
          },
        ],
      },
      {
        name: "KABUPATEN SANGGAU",
        districts: [
          {
            name: "Kapuas",
            subdistricts: ["Beringin", "Ilir Kota", "Tanjung Kapuas", "Tanjung Sekayam", "Bunut"],
          },
        ],
      },
      {
        name: "KABUPATEN KETAPANG",
        districts: [
          {
            name: "Delta Pawan",
            subdistricts: ["Kantor", "Sampit", "Tengah", "Sukaharja", "Mulia Kerta", "Kali Nilam"],
          },
        ],
      },
    ],
  },
  {
    name: "DKI JAKARTA",
    cities: [
      {
        name: "JAKARTA PUSAT",
        districts: [
          {
            name: "Gambir",
            subdistricts: ["Gambir", "Kebon Kelapa", "Petojo Selatan", "Duri Pulo", "Cideng", "Petojo Utara"],
          },
          {
            name: "Menteng",
            subdistricts: ["Menteng", "Pegangsaan", "Cikini", "Gondangdia", "Kebon Sirih"],
          },
        ],
      },
      {
        name: "JAKARTA SELATAN",
        districts: [
          {
            name: "Kebayoran Baru",
            subdistricts: ["Senayan", "Rawa Barat", "Gunung", "Kramat Pela", "Gandaria Utara", "Cipete Utara"],
          },
          {
            name: "Setiabudi",
            subdistricts: ["Setiabudi", "Karet", "Karet Semanggi", "Kuningan Timur", "Menteng Atas", "Pasar Manggis"],
          },
        ],
      },
    ],
  },
];

// Helper to normalize and merge dynamic data from members with master data
export function getTerritoryOptions(existingMembers: Array<{
  province?: string | null;
  city?: string | null;
  district?: string | null;
  subdistrict?: string | null;
}> = []) {
  // Deep clone master
  const provinceMap = new Map<string, Map<string, Map<string, Set<string>>>>();

  // Load master
  for (const prov of MASTER_TERRITORIES) {
    const provUpper = prov.name.toUpperCase().trim();
    if (!provinceMap.has(provUpper)) provinceMap.set(provUpper, new Map());
    const cityMap = provinceMap.get(provUpper)!;

    for (const city of prov.cities) {
      const cityUpper = city.name.toUpperCase().trim();
      if (!cityMap.has(cityUpper)) cityMap.set(cityUpper, new Map());
      const distMap = cityMap.get(cityUpper)!;

      for (const dist of city.districts) {
        const distTitle = dist.name.trim();
        if (!distMap.has(distTitle)) distMap.set(distTitle, new Set());
        const subSet = distMap.get(distTitle)!;

        for (const sub of dist.subdistricts) {
          subSet.add(sub.trim());
        }
      }
    }
  }

  // Merge any dynamic data from members
  for (const m of existingMembers) {
    const provUpper = (m.province || "KALIMANTAN BARAT").toUpperCase().trim();
    const cityUpper = (m.city || "KOTA PONTIANAK").toUpperCase().trim();
    const distTitle = (m.district || "").trim();
    const subTitle = (m.subdistrict || "").trim();

    if (!provUpper) continue;
    if (!provinceMap.has(provUpper)) provinceMap.set(provUpper, new Map());
    const cityMap = provinceMap.get(provUpper)!;

    if (!cityUpper) continue;
    if (!cityMap.has(cityUpper)) cityMap.set(cityUpper, new Map());
    const distMap = cityMap.get(cityUpper)!;

    if (distTitle) {
      if (!distMap.has(distTitle)) distMap.set(distTitle, new Set());
      const subSet = distMap.get(distTitle)!;
      if (subTitle) subSet.add(subTitle);
    }
  }

  return {
    getProvinces: (): string[] => {
      return Array.from(provinceMap.keys()).sort();
    },

    getCities: (province?: string): string[] => {
      if (!province) {
        // Collect all cities
        const all = new Set<string>();
        provinceMap.forEach((cMap) => cMap.forEach((_, c) => all.add(c)));
        return Array.from(all).sort();
      }
      const cMap = provinceMap.get(province.toUpperCase().trim());
      if (!cMap) return [];
      return Array.from(cMap.keys()).sort();
    },

    getDistricts: (province?: string, city?: string): string[] => {
      const all = new Set<string>();
      provinceMap.forEach((cMap, p) => {
        if (province && p !== province.toUpperCase().trim()) return;
        cMap.forEach((dMap, c) => {
          if (city && c !== city.toUpperCase().trim()) return;
          dMap.forEach((_, d) => all.add(d));
        });
      });
      return Array.from(all).sort();
    },

    getSubdistricts: (province?: string, city?: string, district?: string): string[] => {
      const all = new Set<string>();
      provinceMap.forEach((cMap, p) => {
        if (province && p !== province.toUpperCase().trim()) return;
        cMap.forEach((dMap, c) => {
          if (city && c !== city.toUpperCase().trim()) return;
          dMap.forEach((subSet, d) => {
            if (
              district &&
              d.toLowerCase().replace(/\s+/g, "") !== district.toLowerCase().trim().replace(/\s+/g, "")
            ) {
              return;
            }
            subSet.forEach((s) => all.add(s));
          });
        });
      });
      return Array.from(all).sort();
    },
  };
}

export const WEST_KALIMANTAN_CITIES: string[] = [
  "KOTA PONTIANAK",
  "KABUPATEN KUBU RAYA",
  "KABUPATEN MEMPAWAH",
  "KOTA SINGKAWANG",
  "KABUPATEN SAMBAS",
  "KABUPATEN BENGKAYANG",
  "KABUPATEN LANDAK",
  "KABUPATEN SANGGAU",
  "KABUPATEN SEKADAU",
  "KABUPATEN SINTANG",
  "KABUPATEN MELAWI",
  "KABUPATEN KAPUAS HULU",
  "KABUPATEN KETAPANG",
  "KABUPATEN KAYONG UTARA",
];

export const PONTIANAK_DISTRICTS: Array<{ name: string }> = [
  { name: "Pontianak Kota" },
  { name: "Pontianak Barat" },
  { name: "Pontianak Selatan" },
  { name: "Pontianak Tenggara" },
  { name: "Pontianak Timur" },
  { name: "Pontianak Utara" },
];
