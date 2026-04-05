export interface Activity {
  week: number;
  activity: string;
  description: string;
  inputs?: string;
}

export const CALENDAR_TEMPLATES: Record<string, { region: string; activities: Activity[] }[]> = {
  cotton: [{
    region: "telangana_kharif",
    activities: [
      { week: 1, activity: "Land Preparation", description: "Deep ploughing and leveling. Apply FYM 5 tonnes/acre.", inputs: "FYM, Tractor" },
      { week: 2, activity: "Seed Treatment", description: "Treat seeds with Imidacloprid 70 WS @ 5g/kg. Select Bt cotton varieties.", inputs: "Imidacloprid, Bt seeds" },
      { week: 3, activity: "Sowing", description: "Sow at 90x60cm spacing. Irrigate immediately after sowing.", inputs: "Seeds, Irrigation" },
      { week: 4, activity: "Gap Filling", description: "Fill gaps within 10 days of sowing. Ensure uniform stand.", inputs: "Seeds" },
      { week: 6, activity: "First Weeding", description: "Manual weeding or apply pre-emergence herbicide.", inputs: "Pendimethalin" },
      { week: 8, activity: "Thinning & Fertilizer", description: "Thin to 1 plant/hill. Apply Urea 25kg + DAP 50kg/acre.", inputs: "Urea, DAP" },
      { week: 10, activity: "Pest Monitoring", description: "Scout for bollworm, whitefly, jassids. Install pheromone traps.", inputs: "Pheromone traps" },
      { week: 12, activity: "Second Fertilizer", description: "Apply Urea 25kg/acre. Foliar spray of micronutrients.", inputs: "Urea, MgSO4, ZnSO4" },
      { week: 14, activity: "Flowering Stage Care", description: "Ensure adequate irrigation. Monitor for pink bollworm.", inputs: "Irrigation" },
      { week: 16, activity: "Boll Development", description: "Apply potash 25kg/acre. Spray neem oil for sucking pests.", inputs: "MOP, Neem oil" },
      { week: 18, activity: "Pre-Harvest", description: "Stop irrigation 2 weeks before harvest. Apply defoliant if needed.", inputs: "Defoliant (optional)" },
      { week: 20, activity: "First Picking", description: "Pick fully opened bolls. Grade and store in dry place.", inputs: "Picking bags" },
      { week: 22, activity: "Second Picking", description: "Pick remaining bolls. Clean field for next season.", inputs: "Picking bags" },
    ]
  }],

  wheat: [{
    region: "telangana_rabi",
    activities: [
      { week: 1, activity: "Land Preparation", description: "Plough field 2-3 times. Level with planker. Apply FYM 4 tonnes/acre.", inputs: "FYM, Tractor, Planker" },
      { week: 2, activity: "Seed Treatment & Sowing", description: "Treat seeds with Carboxin + Thiram @ 2g/kg. Sow HD-2967 or local variety at 40kg/acre in rows 20cm apart.", inputs: "Seed, Carboxin, Thiram" },
      { week: 3, activity: "First Irrigation", description: "Give first irrigation (crown root initiation stage) 21 days after sowing. Critical for establishment.", inputs: "Irrigation" },
      { week: 4, activity: "Weed Management", description: "Apply Sulfosulfuron 25g/acre or manual weeding. Weeds compete heavily in early stages.", inputs: "Sulfosulfuron" },
      { week: 5, activity: "First Top Dressing", description: "Apply Urea 35kg/acre after first irrigation. Ensure soil moisture is adequate.", inputs: "Urea" },
      { week: 7, activity: "Second Irrigation", description: "Irrigate at tillering stage (42-45 DAS). Promotes tiller formation.", inputs: "Irrigation" },
      { week: 9, activity: "Second Top Dressing", description: "Apply Urea 20kg/acre. Foliar spray of ZnSO4 0.5% if deficiency observed.", inputs: "Urea, ZnSO4" },
      { week: 11, activity: "Third Irrigation", description: "Irrigate at jointing stage. Monitor for yellow rust and apply Propiconazole if needed.", inputs: "Irrigation, Propiconazole" },
      { week: 13, activity: "Flowering Irrigation", description: "Critical irrigation at flowering/heading stage. Avoid water stress.", inputs: "Irrigation" },
      { week: 15, activity: "Grain Filling", description: "Fourth irrigation at milk/dough stage. Monitor for ear head blight.", inputs: "Irrigation" },
      { week: 17, activity: "Pre-Harvest", description: "Stop irrigation. Allow field to dry for 10-12 days before harvest.", inputs: "None" },
      { week: 18, activity: "Harvesting", description: "Harvest when grain moisture is 12-14%. Use combine or manual cutting.", inputs: "Combine harvester, Sickle" },
    ]
  }],

  rice: [{
    region: "telangana_kharif",
    activities: [
      { week: 1, activity: "Nursery Preparation", description: "Prepare raised nursery beds. Soak seeds for 24 hours, incubate for 24 hours. Sow pre-germinated seeds.", inputs: "Seeds, Nursery beds" },
      { week: 2, activity: "Nursery Management", description: "Maintain thin film of water in nursery. Apply DAP 1kg per 100 sq.m.", inputs: "DAP, Irrigation" },
      { week: 3, activity: "Main Field Preparation", description: "Puddle field 2-3 times. Level with plank. Apply FYM 5 tonnes/acre + basal fertilizer.", inputs: "FYM, DAP 50kg, MOP 25kg, Tractor" },
      { week: 4, activity: "Transplanting", description: "Transplant 22-25 day old seedlings at 20x15cm spacing. Use 2-3 seedlings per hill.", inputs: "Seedlings, Labor" },
      { week: 5, activity: "Gap Filling & Weed Control", description: "Fill gaps within 7 days. Apply Butachlor 1.5L/acre as pre-emergence herbicide.", inputs: "Butachlor, Seedlings" },
      { week: 7, activity: "First Top Dressing", description: "Apply Urea 25kg/acre at active tillering stage (25-30 DAT).", inputs: "Urea" },
      { week: 9, activity: "Pest Monitoring", description: "Scout for stem borer, BPH, and leaf folder. Install light traps. Apply Cartap if needed.", inputs: "Light traps, Cartap" },
      { week: 10, activity: "Second Top Dressing", description: "Apply Urea 20kg/acre at panicle initiation. Maintain 5cm standing water.", inputs: "Urea" },
      { week: 12, activity: "Disease Management", description: "Monitor for blast and sheath blight. Spray Tricyclazole 0.6g/L for blast.", inputs: "Tricyclazole, Carbendazim" },
      { week: 14, activity: "Flowering Care", description: "Maintain 5cm water during flowering. Avoid pesticide spraying during flowering.", inputs: "Irrigation" },
      { week: 16, activity: "Grain Maturity", description: "Drain water 15 days before harvest. Monitor for neck blast.", inputs: "None" },
      { week: 18, activity: "Harvesting", description: "Harvest when 80% grains turn golden. Thresh within 24 hours. Dry to 14% moisture.", inputs: "Combine/Manual, Thresher" },
    ]
  }],

  maize: [{
    region: "telangana_kharif",
    activities: [
      { week: 1, activity: "Land Preparation", description: "Deep ploughing followed by 2 harrowings. Form ridges and furrows at 60cm spacing.", inputs: "Tractor, Ridger" },
      { week: 2, activity: "Seed Treatment & Sowing", description: "Treat seeds with Thiram @ 3g/kg. Sow hybrid seeds at 20kg/acre at 60x20cm spacing.", inputs: "Hybrid seeds, Thiram" },
      { week: 3, activity: "Thinning & First Weeding", description: "Thin to one plant per hill. Manual weeding or apply Atrazine 800g/acre pre-emergence.", inputs: "Atrazine" },
      { week: 4, activity: "First Top Dressing", description: "Apply Urea 35kg/acre at knee-high stage (25 DAS). Earth up around plants.", inputs: "Urea" },
      { week: 6, activity: "Second Weeding", description: "Inter-cultivation with blade harrow. Remove weeds manually between plants.", inputs: "Blade harrow" },
      { week: 7, activity: "Second Top Dressing", description: "Apply Urea 35kg/acre at tasseling stage. Ensure adequate soil moisture.", inputs: "Urea" },
      { week: 8, activity: "Pest Management", description: "Monitor for fall armyworm and stem borer. Spray Emamectin benzoate 0.4g/L.", inputs: "Emamectin benzoate" },
      { week: 10, activity: "Silking & Pollination", description: "Maintain soil moisture during silking. Avoid water stress for proper grain setting.", inputs: "Irrigation" },
      { week: 12, activity: "Grain Filling", description: "Irrigate if dry spell occurs. Apply foliar spray of KNO3 1% for better grain filling.", inputs: "KNO3, Irrigation" },
      { week: 14, activity: "Maturity Check", description: "Check for black layer formation at grain base. Cob drying on stalk.", inputs: "None" },
      { week: 15, activity: "Harvesting", description: "Harvest when grain moisture is 20-25%. Dry cobs in sun to 12-14% moisture. Shell and store.", inputs: "Sheller, Storage bags" },
    ]
  }],

  soybean: [{
    region: "telangana_kharif",
    activities: [
      { week: 1, activity: "Land Preparation", description: "Plough and harrow twice. Apply FYM 3 tonnes/acre. Form flat beds or ridges.", inputs: "FYM, Tractor" },
      { week: 2, activity: "Seed Inoculation & Sowing", description: "Inoculate seeds with Rhizobium + PSB. Sow JS-335 or local variety at 30kg/acre at 30x10cm.", inputs: "Rhizobium, PSB, Seeds" },
      { week: 3, activity: "Pre-Emergence Herbicide", description: "Apply Pendimethalin 1L/acre within 3 DAS. Maintain adequate soil moisture for germination.", inputs: "Pendimethalin" },
      { week: 4, activity: "Thinning", description: "Thin to recommended plant population. Fill gaps using thinned seedlings.", inputs: "None" },
      { week: 6, activity: "First Weeding & Hoeing", description: "Inter-cultivation at 25-30 DAS. Manual weeding in row gaps.", inputs: "Hoe, Labor" },
      { week: 7, activity: "Fertilizer Application", description: "Apply Urea 10kg + DAP 50kg + MOP 20kg/acre as basal. Foliar spray of DAP 2% at flowering.", inputs: "Urea, DAP, MOP" },
      { week: 9, activity: "Pest Monitoring", description: "Scout for girdle beetle, defoliators, stem fly. Spray Quinalphos if threshold crossed.", inputs: "Quinalphos" },
      { week: 10, activity: "Flowering Care", description: "Ensure adequate moisture during flowering. Avoid water logging.", inputs: "Irrigation" },
      { week: 12, activity: "Pod Development", description: "Monitor for pod borer. Apply Chlorantraniliprole 0.3ml/L if needed.", inputs: "Chlorantraniliprole" },
      { week: 14, activity: "Disease Management", description: "Monitor for rust and YMV. Spray Hexaconazole 1ml/L for rust.", inputs: "Hexaconazole" },
      { week: 16, activity: "Pre-Harvest", description: "Leaves start yellowing and dropping. Stop irrigation.", inputs: "None" },
      { week: 17, activity: "Harvesting", description: "Harvest when pods turn brown and leaves shed. Thresh carefully to avoid seed damage. Dry to 10% moisture.", inputs: "Thresher, Storage" },
    ]
  }],

  chili: [{
    region: "telangana_kharif",
    activities: [
      { week: 1, activity: "Nursery Raising", description: "Prepare raised nursery beds with FYM. Treat seeds with Trichoderma 4g/kg. Sow thinly and cover with mulch.", inputs: "Seeds, FYM, Trichoderma, Mulch" },
      { week: 3, activity: "Nursery Management", description: "Thin seedlings at 2-leaf stage. Apply DAP 5g/L as foliar. Harden seedlings before transplanting.", inputs: "DAP" },
      { week: 4, activity: "Main Field & Transplanting", description: "Apply FYM 5 tonnes + Neem cake 200kg/acre. Transplant 40-45 day seedlings at 60x45cm spacing.", inputs: "FYM, Neem cake, Seedlings" },
      { week: 5, activity: "Gap Filling & Irrigation", description: "Fill gaps within 10 days. Irrigate at 5-7 day intervals. Apply mulch between rows.", inputs: "Seedlings, Irrigation, Mulch" },
      { week: 7, activity: "First Fertilizer", description: "Apply Urea 25kg + MOP 15kg/acre. Earth up around plants for stability.", inputs: "Urea, MOP" },
      { week: 9, activity: "Pest Control", description: "Monitor for thrips, mites, and aphids. Spray Fipronil 1.5ml/L or neem oil 5ml/L.", inputs: "Fipronil, Neem oil" },
      { week: 11, activity: "Second Fertilizer", description: "Apply Urea 20kg/acre. Foliar spray of Boron 0.2% for better fruit set.", inputs: "Urea, Borax" },
      { week: 13, activity: "Disease Management", description: "Monitor for anthracnose and dieback. Spray Mancozeb 2.5g/L + Carbendazim 1g/L.", inputs: "Mancozeb, Carbendazim" },
      { week: 15, activity: "Fruit Development", description: "Continue irrigation. Apply MOP 10kg/acre for fruit quality and color development.", inputs: "MOP, Irrigation" },
      { week: 17, activity: "First Harvest", description: "Pick green chilies when fully grown. For dry chili, wait until fruits turn red.", inputs: "Picking bags" },
      { week: 19, activity: "Subsequent Harvests", description: "Continue picking at 15-day intervals. 4-5 pickings for green chili.", inputs: "Picking bags" },
      { week: 22, activity: "Final Harvest & Drying", description: "Final picking. For dry chili, spread on clean floor and sun-dry for 8-10 days.", inputs: "Drying yard" },
    ]
  }],

  tomato: [{
    region: "telangana_kharif",
    activities: [
      { week: 1, activity: "Nursery Preparation", description: "Prepare raised nursery beds. Treat seeds with Trichoderma 5g/kg. Sow seeds 1cm deep.", inputs: "Seeds, Trichoderma, FYM" },
      { week: 3, activity: "Nursery Hardening", description: "Reduce watering 7 days before transplanting. Apply Humic acid foliar spray.", inputs: "Humic acid" },
      { week: 4, activity: "Transplanting", description: "Transplant 25-30 day seedlings at 60x45cm. Apply FYM 5t/acre + basal NPK. Irrigate immediately.", inputs: "Seedlings, FYM, DAP, MOP" },
      { week: 5, activity: "Staking & Mulching", description: "Install stakes or trellis for indeterminate varieties. Mulch with paddy straw or plastic mulch.", inputs: "Stakes, Mulch, Twine" },
      { week: 6, activity: "First Weeding", description: "Manual weeding and inter-cultivation. Remove suckers below first flower cluster.", inputs: "Hoe" },
      { week: 7, activity: "First Top Dressing", description: "Apply Urea 25kg + MOP 15kg/acre. Tie plants to stakes as they grow.", inputs: "Urea, MOP" },
      { week: 9, activity: "Pest Management", description: "Monitor for fruit borer, whitefly, leaf miner. Install yellow sticky traps. Spray Neem oil 3ml/L.", inputs: "Sticky traps, Neem oil" },
      { week: 10, activity: "Flowering Care", description: "Spray 2,4-D 1ml/L for better fruit set. Ensure regular irrigation.", inputs: "2,4-D, Irrigation" },
      { week: 12, activity: "Disease Control", description: "Monitor for early blight and bacterial wilt. Spray Mancozeb 2.5g/L alternating with Copper oxychloride.", inputs: "Mancozeb, Copper oxychloride" },
      { week: 13, activity: "Second Top Dressing", description: "Apply Calcium Ammonium Nitrate 25kg/acre. Foliar spray of Ca and Mg to prevent blossom end rot.", inputs: "CAN, CaCl2" },
      { week: 15, activity: "First Harvest", description: "Pick at breaker stage (pink tinge) for distant markets. Fully ripe for local market.", inputs: "Crates, Picking" },
      { week: 18, activity: "Continued Harvests", description: "Harvest every 4-5 days. Grade by size and color. Pack in ventilated crates.", inputs: "Crates" },
      { week: 20, activity: "Final Harvest", description: "Pick all remaining fruits. Clear field. Incorporate residues into soil.", inputs: "None" },
    ]
  }],

  onion: [{
    region: "telangana_rabi",
    activities: [
      { week: 1, activity: "Nursery Sowing", description: "Prepare raised beds 1m wide. Sow seeds at 10g/sq.m. Cover lightly with FYM and irrigate.", inputs: "Seeds, FYM" },
      { week: 4, activity: "Nursery Management", description: "Thin seedlings if dense. Apply Urea 5g/L foliar spray. Harden seedlings 7 days before transplanting.", inputs: "Urea" },
      { week: 6, activity: "Field Preparation & Transplanting", description: "Apply FYM 5t/acre + basal fertilizer. Transplant 45-50 day seedlings at 15x10cm on flat beds.", inputs: "FYM, DAP 50kg, MOP 30kg, Seedlings" },
      { week: 7, activity: "First Irrigation & Gap Filling", description: "Irrigate immediately after transplanting. Fill gaps within 1 week. Irrigate every 7-10 days.", inputs: "Irrigation, Seedlings" },
      { week: 9, activity: "Weed Control", description: "Apply Oxyfluorfen 200ml/acre pre-emergence or manual weeding at 30 DAS.", inputs: "Oxyfluorfen" },
      { week: 10, activity: "First Top Dressing", description: "Apply Urea 25kg/acre at 30 DAT. Earth up lightly around bulbs.", inputs: "Urea" },
      { week: 12, activity: "Second Top Dressing", description: "Apply Urea 20kg/acre at 45 DAT. Spray micronutrients (Zn, B, Mn) foliar.", inputs: "Urea, Micronutrients" },
      { week: 14, activity: "Bulb Enlargement", description: "Maintain regular irrigation. Apply MOP 15kg/acre. Monitor for thrips — spray Fipronil if needed.", inputs: "MOP, Fipronil, Irrigation" },
      { week: 16, activity: "Disease Control", description: "Monitor for purple blotch and Stemphylium blight. Spray Mancozeb 2.5g/L + Carbendazim 1g/L.", inputs: "Mancozeb, Carbendazim" },
      { week: 18, activity: "Pre-Harvest", description: "Stop irrigation when 50% tops fall over. Neck falling indicates maturity.", inputs: "None" },
      { week: 19, activity: "Harvesting", description: "Pull bulbs when 75-80% tops fall. Cure in shade for 3-5 days. Cut tops leaving 2cm neck.", inputs: "Labor, Curing area" },
      { week: 20, activity: "Storage", description: "Store cured onions in well-ventilated structures. Dip in Maleic Hydrazide before storage for better shelf life.", inputs: "Storage structure, Maleic Hydrazide" },
    ]
  }],

  potato: [{
    region: "telangana_rabi",
    activities: [
      { week: 1, activity: "Land Preparation", description: "Deep ploughing + 2 harrowings. Form ridges at 60cm spacing. Apply FYM 5t/acre.", inputs: "FYM, Tractor, Ridger" },
      { week: 2, activity: "Seed Tuber Treatment", description: "Cut large tubers into 30-40g pieces with 2-3 eyes each. Treat with Mancozeb 3g/L dip.", inputs: "Seed tubers, Mancozeb" },
      { week: 3, activity: "Planting", description: "Plant tuber pieces at 20cm spacing in ridges at 5-7cm depth. Apply basal DAP 75kg + MOP 50kg/acre.", inputs: "Tubers, DAP, MOP" },
      { week: 4, activity: "First Irrigation", description: "Light irrigation after planting. Avoid waterlogging. Irrigate at 7-10 day intervals.", inputs: "Irrigation" },
      { week: 5, activity: "Emergence & Weeding", description: "Sprouts emerge in 15-20 days. Manual weeding. Apply Metribuzin 150g/acre pre-emergence.", inputs: "Metribuzin" },
      { week: 7, activity: "First Earthing Up", description: "Earth up soil around plants to 15cm height. Apply Urea 35kg/acre.", inputs: "Urea, Labor" },
      { week: 8, activity: "Pest Management", description: "Monitor for potato tuber moth and aphids. Spray Imidacloprid 0.5ml/L for aphids.", inputs: "Imidacloprid" },
      { week: 10, activity: "Second Earthing Up", description: "Second earthing up. Apply Urea 25kg/acre. Ensure tubers are well covered to prevent greening.", inputs: "Urea" },
      { week: 12, activity: "Late Blight Watch", description: "Monitor for late blight in cool, humid weather. Preventive spray of Mancozeb 2.5g/L.", inputs: "Mancozeb" },
      { week: 14, activity: "Haulm Cutting", description: "Cut haulms (above-ground growth) 10 days before harvest to toughen skin.", inputs: "Sickle" },
      { week: 15, activity: "Harvesting", description: "Dig tubers carefully. Avoid cuts and bruises. Cure in shade for 2-3 days before storage.", inputs: "Spade, Storage" },
    ]
  }],

  sorghum: [{
    region: "telangana_kharif",
    activities: [
      { week: 1, activity: "Land Preparation", description: "Plough and harrow. Form ridges at 45cm spacing. Apply FYM 3t/acre.", inputs: "FYM, Tractor" },
      { week: 2, activity: "Seed Treatment & Sowing", description: "Treat seeds with Thiram 3g/kg. Sow CSH-16 or local variety at 4kg/acre at 45x15cm.", inputs: "Seeds, Thiram" },
      { week: 3, activity: "Gap Filling", description: "Fill gaps within 10 DAS using seedlings from thick patches. Thin to 1 plant per hill.", inputs: "Seedlings" },
      { week: 4, activity: "First Weeding", description: "Inter-cultivation with blade harrow. Manual weeding in rows. Apply Atrazine pre-emergence.", inputs: "Atrazine, Blade harrow" },
      { week: 6, activity: "Fertilizer Application", description: "Apply Urea 35kg + DAP 25kg/acre. Earth up around plants.", inputs: "Urea, DAP" },
      { week: 8, activity: "Pest Monitoring", description: "Scout for shoot fly and stem borer. Remove dead hearts. Spray Chlorpyrifos for stem borer.", inputs: "Chlorpyrifos" },
      { week: 10, activity: "Second Top Dressing", description: "Apply Urea 20kg/acre at boot leaf stage. Ensure adequate moisture.", inputs: "Urea, Irrigation" },
      { week: 12, activity: "Grain Filling", description: "Protect earheads from birds using nets or scarecrows. Monitor for grain mold.", inputs: "Bird nets" },
      { week: 14, activity: "Maturity Check", description: "Check grain hardness by pressing with thumbnail. Harvest at physiological maturity.", inputs: "None" },
      { week: 15, activity: "Harvesting", description: "Cut earheads and dry in sun for 3-4 days. Thresh and clean. Dry grain to 12% moisture.", inputs: "Thresher, Storage" },
    ]
  }],

  chickpea: [{
    region: "telangana_rabi",
    activities: [
      { week: 1, activity: "Land Preparation", description: "Plough after kharif harvest. Harrow twice for fine tilth. Apply FYM 2t/acre.", inputs: "FYM, Tractor" },
      { week: 2, activity: "Seed Inoculation & Sowing", description: "Inoculate with Rhizobium + PSB. Treat with Trichoderma 4g/kg. Sow at 30x10cm, 40kg/acre.", inputs: "Rhizobium, PSB, Trichoderma, Seeds" },
      { week: 3, activity: "Pre-Emergence Weed Control", description: "Apply Pendimethalin 1L/acre within 2 DAS. Give light irrigation if soil is dry.", inputs: "Pendimethalin" },
      { week: 5, activity: "First Weeding", description: "Manual weeding at 25-30 DAS. Do not disturb root nodules during hoeing.", inputs: "Hoe" },
      { week: 6, activity: "Fertilizer & Nipping", description: "Apply DAP 40kg + MOP 20kg/acre basal. Nip terminal portion of main shoot at 30 DAS for branching.", inputs: "DAP, MOP" },
      { week: 8, activity: "Irrigation", description: "Give light irrigation at branching stage if no rain. Avoid excess water. Chickpea is drought-tolerant.", inputs: "Irrigation" },
      { week: 10, activity: "Pest Management", description: "Monitor for pod borer (Helicoverpa). Install pheromone traps. Apply HaNPV or Neem seed kernel extract.", inputs: "Pheromone traps, HaNPV, NSKE" },
      { week: 12, activity: "Flowering Care", description: "Ensure adequate soil moisture during flowering. Spray DAP 2% foliar for better pod setting.", inputs: "DAP" },
      { week: 14, activity: "Disease Control", description: "Monitor for wilt (Fusarium). Uproot and destroy wilted plants. Spray Carbendazim 1g/L.", inputs: "Carbendazim" },
      { week: 16, activity: "Pod Maturity", description: "Pods turn brown and leaves start yellowing. Stop irrigation.", inputs: "None" },
      { week: 17, activity: "Harvesting", description: "Pull whole plants when 80% pods turn brown. Sun-dry for 3-4 days. Thresh carefully.", inputs: "Thresher, Storage" },
    ]
  }],

  lentil: [{
    region: "telangana_rabi",
    activities: [
      { week: 1, activity: "Land Preparation", description: "Plough once and harrow twice for fine tilth. Lentil needs well-drained soil.", inputs: "Tractor" },
      { week: 2, activity: "Seed Treatment & Sowing", description: "Inoculate with Rhizobium. Treat with Thiram 3g/kg. Sow at 25cm row spacing, 15kg/acre.", inputs: "Rhizobium, Thiram, Seeds" },
      { week: 3, activity: "Pre-Emergence Herbicide", description: "Apply Pendimethalin 1L/acre or Fluchloralin 1L/acre within 2 DAS.", inputs: "Pendimethalin" },
      { week: 5, activity: "First Weeding", description: "Hand weeding at 25-30 DAS. Lentil is poor weed competitor in early stages.", inputs: "Labor" },
      { week: 6, activity: "Basal Fertilizer", description: "Apply DAP 40kg + MOP 10kg/acre. Lentil fixes its own nitrogen, so minimal N needed.", inputs: "DAP, MOP" },
      { week: 8, activity: "Irrigation", description: "Give one light irrigation at branching (35-40 DAS). Avoid waterlogging.", inputs: "Irrigation" },
      { week: 10, activity: "Pest Watch", description: "Monitor for aphids and pod borer. Spray Dimethoate 1.5ml/L for aphids.", inputs: "Dimethoate" },
      { week: 12, activity: "Flowering Irrigation", description: "Light irrigation at flowering if dry. Excessive moisture leads to vegetative growth.", inputs: "Irrigation" },
      { week: 14, activity: "Disease Management", description: "Monitor for rust and wilt. Spray Mancozeb 2.5g/L for rust prevention.", inputs: "Mancozeb" },
      { week: 16, activity: "Maturity", description: "Plants turn yellow, pods turn light brown. Stop all irrigation.", inputs: "None" },
      { week: 17, activity: "Harvesting", description: "Pull plants manually or cut with sickle. Sun-dry for 4-5 days, then thresh.", inputs: "Sickle, Thresher" },
    ]
  }],

  groundnut: [{
    region: "telangana_kharif",
    activities: [
      { week: 1, activity: "Land Preparation", description: "Deep ploughing + 2 harrowings. Apply FYM 4t/acre + Gypsum 200kg/acre.", inputs: "FYM, Gypsum, Tractor" },
      { week: 2, activity: "Seed Treatment & Sowing", description: "Treat kernels with Thiram + Carbendazim 3g/kg. Sow at 30x10cm, 50kg kernels/acre.", inputs: "Kernels, Thiram, Carbendazim" },
      { week: 3, activity: "Pre-Emergence Weed Control", description: "Apply Pendimethalin 1.3L/acre within 3 DAS. Irrigate lightly if no rain.", inputs: "Pendimethalin" },
      { week: 5, activity: "First Weeding & Hoeing", description: "Inter-cultivation at 25 DAS. Manual weeding between plants.", inputs: "Hoe" },
      { week: 6, activity: "Fertilizer Application", description: "Apply DAP 50kg + MOP 25kg/acre basal. Foliar spray of Borax 0.2% at 30 DAS.", inputs: "DAP, MOP, Borax" },
      { week: 8, activity: "Gypsum Application", description: "Apply Gypsum 200kg/acre at pegging stage. Critical for pod development and calcium supply.", inputs: "Gypsum" },
      { week: 9, activity: "Pest Monitoring", description: "Scout for leaf miner, red hairy caterpillar, white grub. Install pheromone traps.", inputs: "Pheromone traps" },
      { week: 10, activity: "Earthing Up", description: "Earth up around plants to encourage pegging. Avoid disturbing pegs.", inputs: "Labor" },
      { week: 12, activity: "Disease Management", description: "Monitor for tikka disease (leaf spot). Spray Chlorothalonil 2g/L or Mancozeb 2.5g/L.", inputs: "Chlorothalonil, Mancozeb" },
      { week: 14, activity: "Pod Development", description: "Maintain soil moisture. Foliar spray of KH2PO4 0.5% for better pod filling.", inputs: "KH2PO4, Irrigation" },
      { week: 16, activity: "Maturity Check", description: "Pull sample plants. 75% pods show dark inner shell color. Shells separate from kernel.", inputs: "None" },
      { week: 17, activity: "Harvesting", description: "Harvest by pulling or digging. Strip pods. Sun-dry to 8% kernel moisture. Store in jute bags.", inputs: "Labor, Storage bags" },
    ]
  }],

  turmeric: [{
    region: "telangana_kharif",
    activities: [
      { week: 1, activity: "Land Preparation", description: "Deep ploughing, 2 harrowings. Form raised beds or ridges at 45cm. Apply FYM 10t/acre + Neem cake 200kg.", inputs: "FYM, Neem cake, Tractor" },
      { week: 2, activity: "Rhizome Treatment & Planting", description: "Treat mother/finger rhizomes with Mancozeb 3g/L for 30 mins. Plant at 45x15cm, 800kg/acre.", inputs: "Rhizomes, Mancozeb" },
      { week: 3, activity: "Mulching", description: "Apply green leaf mulch 5t/acre immediately after planting. Irrigate lightly.", inputs: "Green leaves, Irrigation" },
      { week: 6, activity: "First Weeding", description: "Manual weeding at 40-50 DAS. Do not disturb rhizomes. Second mulching with green leaves.", inputs: "Green leaves, Labor" },
      { week: 8, activity: "First Fertilizer", description: "Apply Urea 25kg + MOP 20kg/acre. Incorporate into soil while weeding.", inputs: "Urea, MOP" },
      { week: 10, activity: "Second Weeding", description: "Manual weeding. Earth up around plants. Apply third round of mulch.", inputs: "Green leaves, Labor" },
      { week: 12, activity: "Second Fertilizer", description: "Apply Urea 25kg/acre. Foliar spray of micronutrients (Zn, Fe, Mn).", inputs: "Urea, Micronutrients" },
      { week: 14, activity: "Pest & Disease Management", description: "Monitor for rhizome rot and leaf spot. Drench with Metalaxyl for rhizome rot. Spray Mancozeb for leaf spot.", inputs: "Metalaxyl, Mancozeb" },
      { week: 18, activity: "Third Fertilizer", description: "Apply MOP 15kg/acre for rhizome bulking. Maintain irrigation every 7-10 days.", inputs: "MOP, Irrigation" },
      { week: 24, activity: "Pre-Harvest", description: "Leaves start drying and turning yellow. Stop irrigation 15 days before harvest.", inputs: "None" },
      { week: 28, activity: "Harvesting", description: "Dig rhizomes carefully 9-10 months after planting. Separate mother and finger rhizomes.", inputs: "Spade, Labor" },
      { week: 29, activity: "Post-Harvest Processing", description: "Boil rhizomes in water for 45-60 min. Sun-dry for 10-15 days. Polish in drum.", inputs: "Boiling vessel, Drying yard" },
    ]
  }],

  coriander: [{
    region: "telangana_rabi",
    activities: [
      { week: 1, activity: "Land Preparation", description: "Plough and harrow for fine tilth. Apply FYM 3t/acre. Form flat beds.", inputs: "FYM, Tractor" },
      { week: 2, activity: "Seed Preparation & Sowing", description: "Split seeds gently and soak for 12 hours. Sow in rows at 25cm spacing, 6-8kg/acre. Cover lightly.", inputs: "Seeds" },
      { week: 3, activity: "Irrigation & Germination", description: "Light irrigation every 4-5 days until germination. Takes 10-15 days to emerge.", inputs: "Irrigation" },
      { week: 5, activity: "Thinning & First Weeding", description: "Thin seedlings to 5cm apart within rows. Manual weeding. Apply Pendimethalin pre-emergence.", inputs: "Pendimethalin" },
      { week: 6, activity: "Fertilizer Application", description: "Apply Urea 20kg + DAP 30kg + MOP 10kg/acre. Side dress along rows.", inputs: "Urea, DAP, MOP" },
      { week: 8, activity: "Second Weeding", description: "Manual weeding. Inter-cultivation with hand hoe. Ensure good air circulation.", inputs: "Hoe" },
      { week: 9, activity: "Top Dressing", description: "Apply Urea 15kg/acre. Foliar spray of DAP 2% for better branching.", inputs: "Urea, DAP" },
      { week: 10, activity: "Pest & Disease Watch", description: "Monitor for aphids and powdery mildew. Spray Dimethoate for aphids, Wettable Sulphur for mildew.", inputs: "Dimethoate, Wettable Sulphur" },
      { week: 12, activity: "Flowering", description: "Maintain irrigation at 7-10 day intervals. Bee activity helps pollination.", inputs: "Irrigation" },
      { week: 14, activity: "Grain Development", description: "Reduce irrigation as seeds mature. Seeds turn from green to brownish.", inputs: "None" },
      { week: 15, activity: "Harvesting", description: "Harvest when 50% fruits turn yellowish-brown. Cut plants, dry in shade for 5 days, then thresh.", inputs: "Sickle, Thresher" },
    ]
  }],

  millet: [{
    region: "telangana_kharif",
    activities: [
      { week: 1, activity: "Land Preparation", description: "Plough once and harrow twice. Form ridges at 45cm spacing. Apply FYM 2t/acre.", inputs: "FYM, Tractor" },
      { week: 2, activity: "Seed Treatment & Sowing", description: "Treat seeds with Thiram 3g/kg. Sow at 45x15cm, 2kg/acre. Shallow sowing at 2-3cm depth.", inputs: "Seeds, Thiram" },
      { week: 3, activity: "Gap Filling & Thinning", description: "Fill gaps within 10 DAS. Thin to 1 plant per hill at 15 DAS.", inputs: "Seedlings" },
      { week: 4, activity: "First Weeding", description: "Inter-cultivation at 15-20 DAS. Manual weeding in rows.", inputs: "Hoe" },
      { week: 5, activity: "Fertilizer Application", description: "Apply Urea 20kg + DAP 25kg/acre. Millet needs less fertilizer than other cereals.", inputs: "Urea, DAP" },
      { week: 7, activity: "Second Weeding", description: "Earth up around plants. Remove weeds. Millet becomes competitive after 30 DAS.", inputs: "Labor" },
      { week: 8, activity: "Pest Management", description: "Monitor for shoot fly and stem borer. Apply Carbofuran granules in whorl.", inputs: "Carbofuran" },
      { week: 9, activity: "Top Dressing", description: "Apply Urea 15kg/acre at panicle initiation. Irrigate if dry spell extends beyond 15 days.", inputs: "Urea" },
      { week: 11, activity: "Grain Filling", description: "Protect from bird damage. Use bird scarers or nets. Monitor for ear head pests.", inputs: "Bird nets" },
      { week: 12, activity: "Harvesting", description: "Cut earheads when grains are hard. Sun-dry for 3-4 days. Thresh and store at 12% moisture.", inputs: "Sickle, Thresher" },
    ]
  }],

  sunflower: [{
    region: "telangana_kharif",
    activities: [
      { week: 1, activity: "Land Preparation", description: "Deep ploughing + 2 harrowings. Form ridges at 60cm. Apply FYM 3t/acre.", inputs: "FYM, Tractor" },
      { week: 2, activity: "Seed Treatment & Sowing", description: "Treat seeds with Imidacloprid 5g/kg. Sow hybrid seeds at 60x30cm, 2.5kg/acre.", inputs: "Hybrid seeds, Imidacloprid" },
      { week: 3, activity: "Gap Filling", description: "Fill gaps within 10 DAS. Thin to 1 plant per hill.", inputs: "Seeds" },
      { week: 4, activity: "First Weeding", description: "Inter-cultivation at 20 DAS. Apply Pendimethalin pre-emergence if not done.", inputs: "Pendimethalin, Hoe" },
      { week: 5, activity: "Fertilizer Application", description: "Apply Urea 35kg + DAP 50kg + MOP 25kg/acre. Sunflower is heavy feeder.", inputs: "Urea, DAP, MOP" },
      { week: 7, activity: "Second Weeding & Earthing", description: "Inter-cultivation and earthing up. Apply Urea 25kg/acre as top dressing.", inputs: "Urea" },
      { week: 8, activity: "Boron Application", description: "Foliar spray of Borax 0.2% at star bud stage. Critical for seed setting.", inputs: "Borax" },
      { week: 9, activity: "Pest Management", description: "Monitor for head borer and capitulum borer. Spray Quinalphos 2ml/L.", inputs: "Quinalphos" },
      { week: 10, activity: "Pollination Support", description: "Place bee boxes near field. Hand-pollinate by rubbing heads together at 50% flowering.", inputs: "Bee boxes (if available)" },
      { week: 12, activity: "Disease Watch", description: "Monitor for Alternaria blight and downy mildew. Spray Mancozeb 2.5g/L.", inputs: "Mancozeb" },
      { week: 13, activity: "Seed Development", description: "Maintain irrigation every 10 days. Birds are major threat — use nets.", inputs: "Irrigation, Bird nets" },
      { week: 15, activity: "Harvesting", description: "Harvest when back of head turns yellow and seeds are firm. Cut heads, dry for 4-5 days, thresh.", inputs: "Sickle, Thresher" },
    ]
  }],

  sugarcane: [{
    region: "telangana_kharif",
    activities: [
      { week: 1, activity: "Land Preparation", description: "Deep ploughing 2-3 times. Form furrows at 90-120cm spacing, 20-25cm deep. Apply FYM 10t/acre.", inputs: "FYM, Tractor, Furrower" },
      { week: 2, activity: "Sett Treatment & Planting", description: "Treat setts in Carbendazim 1g/L for 15 min. Plant 2-3 budded setts end-to-end in furrows.", inputs: "Setts (30,000/acre), Carbendazim" },
      { week: 4, activity: "Gap Filling", description: "Fill gaps with pre-sprouted setts within 30 DAS. Irrigate at 7-10 day intervals.", inputs: "Pre-sprouted setts, Irrigation" },
      { week: 6, activity: "First Weeding", description: "Inter-cultivation with blade harrow. Apply Atrazine 800g/acre pre-emergence.", inputs: "Atrazine, Blade harrow" },
      { week: 8, activity: "First Top Dressing", description: "Apply Urea 35kg/acre at 45 DAS. Earth up slightly.", inputs: "Urea" },
      { week: 10, activity: "Second Weeding & Earthing", description: "Major earthing up at 75 DAS. Fills furrows and supports canes.", inputs: "Labor, Tractor" },
      { week: 12, activity: "Second Top Dressing", description: "Apply Urea 35kg + MOP 25kg/acre. Irrigate immediately after fertilizer.", inputs: "Urea, MOP" },
      { week: 14, activity: "Propping & Wrapping", description: "Prop tall canes to prevent lodging. Remove dry leaves (trash) for aeration.", inputs: "Bamboo/twine" },
      { week: 16, activity: "Pest Management", description: "Monitor for early shoot borer and internode borer. Install pheromone traps. Release Trichogramma.", inputs: "Pheromone traps, Trichogramma" },
      { week: 20, activity: "Grand Growth Phase", description: "Apply Urea 25kg/acre. This is the maximum growth phase — ensure regular irrigation.", inputs: "Urea, Irrigation" },
      { week: 28, activity: "Ripening Phase", description: "Stop nitrogen fertilizer. Apply Ethephon 200ppm foliar spray to enhance sucrose.", inputs: "Ethephon" },
      { week: 36, activity: "Pre-Harvest", description: "Stop irrigation 15-20 days before harvest. Measure Brix with refractometer (>18%).", inputs: "Refractometer" },
      { week: 40, activity: "Harvesting", description: "Cut canes at ground level. Remove tops and trash. Transport to mill within 24 hours.", inputs: "Sickle/Cutter, Transport" },
    ]
  }],

  cauliflower: [{
    region: "telangana_rabi",
    activities: [
      { week: 1, activity: "Nursery Raising", description: "Prepare raised nursery beds. Sow seeds 1cm deep at 5cm spacing. Cover with mulch.", inputs: "Seeds, FYM, Mulch" },
      { week: 3, activity: "Nursery Management", description: "Water daily. Apply NPK 19:19:19 foliar spray. Harden seedlings a week before transplanting.", inputs: "NPK 19:19:19" },
      { week: 4, activity: "Field Preparation & Transplanting", description: "Apply FYM 5t/acre + basal NPK. Transplant 25-30 day seedlings at 45x45cm. Irrigate immediately.", inputs: "FYM, DAP 50kg, MOP 25kg, Seedlings" },
      { week: 5, activity: "Establishment Irrigation", description: "Irrigate every 3-4 days for first 2 weeks. Provide shade if hot. Gap fill within 7 days.", inputs: "Irrigation" },
      { week: 6, activity: "First Weeding", description: "Manual weeding at 20 DAT. Shallow hoeing to avoid root damage.", inputs: "Hoe" },
      { week: 7, activity: "First Top Dressing", description: "Apply Urea 25kg + MOP 15kg/acre. Earth up slightly around plants.", inputs: "Urea, MOP" },
      { week: 9, activity: "Pest Management", description: "Monitor for diamond back moth, cabbage butterfly. Spray Bt (Bacillus thuringiensis) or Spinosad.", inputs: "Bt spray, Spinosad" },
      { week: 10, activity: "Second Top Dressing", description: "Apply Urea 20kg/acre. Foliar spray of Boron 0.2% for curd development.", inputs: "Urea, Borax" },
      { week: 11, activity: "Curd Formation", description: "Blanch curds by tying outer leaves over them to keep white. Ensure regular irrigation.", inputs: "Irrigation" },
      { week: 12, activity: "Disease Control", description: "Monitor for black rot and downy mildew. Spray Copper oxychloride 3g/L.", inputs: "Copper oxychloride" },
      { week: 13, activity: "Harvesting", description: "Harvest when curds are compact, white, and 15-20cm diameter. Cut with stalk and 2-3 wrapper leaves.", inputs: "Knife, Crates" },
    ]
  }],

  brinjal: [{
    region: "telangana_kharif",
    activities: [
      { week: 1, activity: "Nursery Raising", description: "Prepare raised beds. Treat seeds with Trichoderma 5g/kg. Sow at 1cm depth, cover with FYM.", inputs: "Seeds, Trichoderma, FYM" },
      { week: 3, activity: "Nursery Hardening", description: "Reduce watering 7 days before transplanting. Spray DAP 5g/L foliar.", inputs: "DAP" },
      { week: 4, activity: "Field Preparation & Transplanting", description: "Apply FYM 5t/acre + Neem cake 200kg. Transplant 35-40 day seedlings at 60x60cm. Irrigate.", inputs: "FYM, Neem cake, Seedlings" },
      { week: 5, activity: "Gap Filling & Mulching", description: "Fill gaps within 10 days. Apply paddy straw mulch between rows.", inputs: "Seedlings, Mulch" },
      { week: 7, activity: "First Fertilizer", description: "Apply Urea 25kg + MOP 15kg/acre. Earth up around plants.", inputs: "Urea, MOP" },
      { week: 8, activity: "Pest Management (FSB)", description: "Monitor for fruit and shoot borer (FSB). Install pheromone traps. Clip affected shoots.", inputs: "Pheromone traps, Pruning scissors" },
      { week: 9, activity: "Staking", description: "Stake tall plants to prevent lodging. Prune lower branches for air circulation.", inputs: "Stakes, Twine" },
      { week: 10, activity: "Disease Control", description: "Monitor for bacterial wilt and Phomopsis blight. Drench with Copper oxychloride for wilt.", inputs: "Copper oxychloride" },
      { week: 11, activity: "Second Top Dressing", description: "Apply Urea 20kg/acre. Foliar spray of micronutrients.", inputs: "Urea, Micronutrients" },
      { week: 12, activity: "First Harvest", description: "Pick fruits when glossy and firm. Dull skin indicates over-maturity.", inputs: "Picking bags" },
      { week: 14, activity: "Continued Harvests", description: "Harvest every 5-7 days. 8-10 pickings total over the season.", inputs: "Picking bags" },
      { week: 16, activity: "Rejuvenation Pruning", description: "Cut back plants to 30cm. Apply Urea 20kg/acre. New flush gives second crop.", inputs: "Urea, Pruning tools" },
      { week: 20, activity: "Final Harvest", description: "Complete all pickings. Remove plants. Incorporate residues into soil.", inputs: "None" },
    ]
  }],
};
