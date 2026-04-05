"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface CalendarActivity {
  id: string;
  weekNumber: number;
  name: string;
  description: string;
  inputs: string[];
  dueDate?: string;
}

export interface CalendarTemplate {
  cropId: string;
  cropName: string;
  totalWeeks: number;
  activities: CalendarActivity[];
}

export interface CalendarTask {
  id: string;
  cropId: string;
  cropName: string;
  weekNumber: number;
  name: string;
  description: string;
  inputs: string[];
  sowingDate: string;
  dueDate: string;
  completed: boolean;
}

const FALLBACK_TEMPLATES: Record<string, CalendarTemplate> = {
  cotton: {
    cropId: "cotton",
    cropName: "Cotton",
    totalWeeks: 28,
    activities: [
      { id: "c1", weekNumber: 1, name: "Land Preparation", description: "Deep plough the field 2-3 times. Add well-decomposed FYM @ 10 tonnes/acre.", inputs: ["FYM (10 tonnes/acre)", "Tractor for ploughing"] },
      { id: "c2", weekNumber: 2, name: "Seed Treatment & Sowing", description: "Treat seeds with Imidacloprid. Sow Bt cotton seeds at 90x60 cm spacing.", inputs: ["Bt cotton seeds (1 kg/acre)", "Imidacloprid 48FS (5ml/kg seed)"] },
      { id: "c3", weekNumber: 3, name: "Gap Filling", description: "Fill gaps where seeds did not germinate. Re-sow within 10 days of initial sowing.", inputs: ["Reserve seeds"] },
      { id: "c4", weekNumber: 4, name: "First Weeding", description: "Remove weeds manually or apply pre-emergence herbicide. Thin plants to one per hill.", inputs: ["Pendimethalin 30EC (1L/acre)", "Labour for weeding"] },
      { id: "c5", weekNumber: 6, name: "First Fertilizer Application", description: "Apply Urea and DAP as basal dose. Irrigate after application.", inputs: ["Urea (25 kg/acre)", "DAP (50 kg/acre)"] },
      { id: "c6", weekNumber: 8, name: "Pest Scouting", description: "Check for sucking pests (aphids, jassids, whiteflies). Spray if threshold exceeded.", inputs: ["Neem oil (5 ml/L)", "Yellow sticky traps"] },
      { id: "c7", weekNumber: 10, name: "Second Fertilizer Dose", description: "Apply second dose of Urea for vegetative growth. Earth up the plants.", inputs: ["Urea (25 kg/acre)", "MOP (25 kg/acre)"] },
      { id: "c8", weekNumber: 12, name: "Flowering Stage Care", description: "Monitor for bollworm. Install pheromone traps. Ensure adequate irrigation.", inputs: ["Pheromone traps (5/acre)", "Irrigation"] },
      { id: "c9", weekNumber: 16, name: "Boll Development", description: "Apply foliar spray of micronutrients. Watch for pink bollworm infestation.", inputs: ["Micronutrient spray", "Chlorantraniliprole (if needed)"] },
      { id: "c10", weekNumber: 20, name: "First Picking", description: "Pick fully opened bolls. Avoid picking wet cotton. Grade and store separately.", inputs: ["Picking bags", "Labour"] },
      { id: "c11", weekNumber: 24, name: "Second Picking", description: "Continue picking remaining opened bolls. Remove any damaged bolls.", inputs: ["Picking bags", "Labour"] },
      { id: "c12", weekNumber: 28, name: "Final Harvest & Cleanup", description: "Complete final picking. Remove crop residue. Prepare field for next season.", inputs: ["Labour", "Transport to mandi"] },
    ],
  },
  wheat: {
    cropId: "wheat",
    cropName: "Wheat",
    totalWeeks: 20,
    activities: [
      { id: "w1", weekNumber: 1, name: "Land Preparation", description: "Plough field 2-3 times for fine tilth. Level the field for uniform irrigation.", inputs: ["Tractor", "Leveler"] },
      { id: "w2", weekNumber: 2, name: "Seed Treatment & Sowing", description: "Treat seeds with Vitavax. Sow at 100 kg/ha using seed drill at 20 cm row spacing.", inputs: ["Wheat seed (100 kg/ha)", "Vitavax (2.5 g/kg)", "Seed drill"] },
      { id: "w3", weekNumber: 3, name: "First Irrigation", description: "Apply first irrigation 20-25 days after sowing (Crown Root Initiation stage).", inputs: ["Irrigation water"] },
      { id: "w4", weekNumber: 4, name: "First Top Dressing", description: "Apply Urea as first top dressing after first irrigation.", inputs: ["Urea (55 kg/ha)"] },
      { id: "w5", weekNumber: 6, name: "Second Irrigation & Weeding", description: "Apply second irrigation at tillering stage. Remove weeds manually or apply herbicide.", inputs: ["Irrigation", "2,4-D herbicide (if needed)"] },
      { id: "w6", weekNumber: 8, name: "Second Top Dressing", description: "Apply second dose of Urea at late tillering/jointing stage.", inputs: ["Urea (55 kg/ha)"] },
      { id: "w7", weekNumber: 10, name: "Third Irrigation", description: "Irrigate at boot/heading stage. Critical for grain formation.", inputs: ["Irrigation water"] },
      { id: "w8", weekNumber: 12, name: "Disease Monitoring", description: "Check for rust and blight. Spray Propiconazole if symptoms appear.", inputs: ["Propiconazole 25EC (1 ml/L)", "Sprayer"] },
      { id: "w9", weekNumber: 14, name: "Fourth Irrigation", description: "Apply irrigation at milking stage for grain filling.", inputs: ["Irrigation water"] },
      { id: "w10", weekNumber: 18, name: "Harvesting", description: "Harvest when grain moisture is 20-25%. Use combine or manual harvesting.", inputs: ["Combine harvester", "Labour"] },
      { id: "w11", weekNumber: 20, name: "Threshing & Storage", description: "Thresh and dry grain to 12% moisture. Store in clean, dry place.", inputs: ["Thresher", "Storage bags/bins"] },
    ],
  },
  rice: {
    cropId: "rice",
    cropName: "Rice",
    totalWeeks: 22,
    activities: [
      { id: "r1", weekNumber: 1, name: "Nursery Preparation", description: "Prepare raised nursery bed. Sow pre-soaked seeds on puddled nursery.", inputs: ["Rice seed (25 kg/acre)", "Nursery area (400 sq ft/acre)"] },
      { id: "r2", weekNumber: 2, name: "Nursery Management", description: "Maintain thin layer of water in nursery. Apply light dose of Urea.", inputs: ["Urea (2 kg/nursery)", "Water management"] },
      { id: "r3", weekNumber: 4, name: "Main Field Preparation", description: "Puddle the main field 2-3 times. Level and apply basal fertilizer.", inputs: ["DAP (50 kg/acre)", "MOP (25 kg/acre)", "Zinc sulphate (10 kg/acre)"] },
      { id: "r4", weekNumber: 5, name: "Transplanting", description: "Transplant 25-30 day old seedlings at 20x15 cm spacing. 2-3 seedlings per hill.", inputs: ["Seedlings", "Labour for transplanting"] },
      { id: "r5", weekNumber: 6, name: "Gap Filling & Weed Management", description: "Fill gaps within a week. Apply Butachlor for weed control.", inputs: ["Butachlor 50EC (1.5 L/acre)", "Extra seedlings"] },
      { id: "r6", weekNumber: 8, name: "First Top Dressing", description: "Apply first dose of Urea at active tillering stage.", inputs: ["Urea (35 kg/acre)"] },
      { id: "r7", weekNumber: 10, name: "Pest Management", description: "Scout for stem borer and leaf folder. Apply Cartap hydrochloride if needed.", inputs: ["Cartap hydrochloride 4G (10 kg/acre)", "Sprayer"] },
      { id: "r8", weekNumber: 12, name: "Second Top Dressing", description: "Apply second Urea dose at panicle initiation. Maintain 5 cm water.", inputs: ["Urea (35 kg/acre)"] },
      { id: "r9", weekNumber: 14, name: "Flowering Stage", description: "Maintain water level. Apply fungicide if blast symptoms appear.", inputs: ["Tricyclazole 75WP (0.6 g/L)", "Water management"] },
      { id: "r10", weekNumber: 18, name: "Drain Field", description: "Drain water 10-15 days before harvest for uniform maturity.", inputs: [] },
      { id: "r11", weekNumber: 20, name: "Harvesting", description: "Harvest when 80% grains are golden yellow. Cut close to ground.", inputs: ["Sickle/Combine", "Labour"] },
      { id: "r12", weekNumber: 22, name: "Drying & Storage", description: "Sun-dry grain to 14% moisture. Clean and store in jute bags.", inputs: ["Drying floor", "Jute bags"] },
    ],
  },
  tomato: {
    cropId: "tomato",
    cropName: "Tomato",
    totalWeeks: 18,
    activities: [
      { id: "t1", weekNumber: 1, name: "Nursery Sowing", description: "Sow seeds in raised nursery bed or pro-trays. Use shade net initially.", inputs: ["Tomato seeds (150 g/acre)", "Pro-trays or nursery bed", "Shade net"] },
      { id: "t2", weekNumber: 2, name: "Nursery Care", description: "Water regularly. Apply fungicide drench for damping off prevention.", inputs: ["Copper oxychloride (3 g/L)", "Water"] },
      { id: "t3", weekNumber: 4, name: "Field Preparation & Transplanting", description: "Prepare beds/ridges. Transplant 25-30 day seedlings at 60x45 cm spacing.", inputs: ["FYM (8 tonnes/acre)", "Seedlings", "DAP (50 kg/acre)"] },
      { id: "t4", weekNumber: 5, name: "Staking", description: "Install stakes or trellis for plant support. Tie plants loosely.", inputs: ["Bamboo stakes", "Jute twine"] },
      { id: "t5", weekNumber: 6, name: "First Weeding & Fertilizer", description: "Weed around plants. Apply Urea and MOP through fertigation or soil application.", inputs: ["Urea (25 kg/acre)", "MOP (20 kg/acre)"] },
      { id: "t6", weekNumber: 8, name: "Pest & Disease Watch", description: "Monitor for fruit borer, whitefly, and leaf curl virus. Spray Neem oil preventively.", inputs: ["Neem oil (5 ml/L)", "Yellow sticky traps (20/acre)"] },
      { id: "t7", weekNumber: 10, name: "Flowering & Fruit Set", description: "Ensure proper pollination. Apply micronutrient spray (Boron + Calcium).", inputs: ["Boron 20% (1 g/L)", "Calcium nitrate (5 g/L)"] },
      { id: "t8", weekNumber: 12, name: "First Harvest", description: "Pick fruits at breaker to turning stage for distant markets. Handle carefully.", inputs: ["Harvest crates", "Labour"] },
      { id: "t9", weekNumber: 14, name: "Continued Harvesting", description: "Harvest every 4-5 days. Grade by size and color. Remove diseased fruits.", inputs: ["Crates", "Grading area"] },
      { id: "t10", weekNumber: 18, name: "Final Harvest & Cleanup", description: "Complete final picking. Remove plant debris. Prepare for next crop.", inputs: ["Labour", "Transport"] },
    ],
  },
  chili: {
    cropId: "chili",
    cropName: "Chili",
    totalWeeks: 24,
    activities: [
      { id: "ch1", weekNumber: 1, name: "Nursery Preparation", description: "Sow chili seeds in raised nursery beds. Treat seeds with Trichoderma.", inputs: ["Chili seeds (200 g/acre)", "Trichoderma (5 g/kg seed)", "Nursery bed"] },
      { id: "ch2", weekNumber: 3, name: "Nursery Management", description: "Water with rose can daily. Spray for damping off if needed.", inputs: ["Copper oxychloride", "Water"] },
      { id: "ch3", weekNumber: 5, name: "Transplanting", description: "Transplant 35-40 day old seedlings at 60x45 cm spacing on ridges.", inputs: ["Seedlings", "FYM (10 tonnes/acre)", "DAP (50 kg/acre)"] },
      { id: "ch4", weekNumber: 6, name: "Gap Filling", description: "Replace dead or weak seedlings within 10 days of transplanting.", inputs: ["Extra seedlings"] },
      { id: "ch5", weekNumber: 7, name: "First Weeding & Fertilizer", description: "Hand weed and apply first dose of Urea. Irrigate after application.", inputs: ["Urea (25 kg/acre)", "Labour"] },
      { id: "ch6", weekNumber: 9, name: "Pest Scouting", description: "Check for thrips, mites, and aphids. Apply Fipronil if needed.", inputs: ["Fipronil 5SC (2 ml/L)", "Sprayer"] },
      { id: "ch7", weekNumber: 11, name: "Second Fertilizer Dose", description: "Apply second top dressing of Urea and MOP at flowering initiation.", inputs: ["Urea (25 kg/acre)", "MOP (25 kg/acre)"] },
      { id: "ch8", weekNumber: 13, name: "Flowering & Fruit Set", description: "Ensure adequate water. Spray Planofix for better fruit setting.", inputs: ["Planofix (2 ml/4.5L water)", "Irrigation"] },
      { id: "ch9", weekNumber: 16, name: "First Harvest (Green)", description: "Pick green chilies if selling for fresh market. Handle gently.", inputs: ["Harvest bags", "Labour"] },
      { id: "ch10", weekNumber: 18, name: "Disease Management", description: "Watch for leaf curl, anthracnose. Spray Mancozeb + Carbendazim.", inputs: ["Mancozeb (2.5 g/L)", "Carbendazim (1 g/L)"] },
      { id: "ch11", weekNumber: 20, name: "Red Chili Harvest", description: "Pick fully red chilies for dry chili market. Dry on clean floor.", inputs: ["Drying floor/tarpaulin", "Labour"] },
      { id: "ch12", weekNumber: 24, name: "Final Harvest & Field Cleanup", description: "Complete all picking. Sun dry to 10% moisture. Store or sell.", inputs: ["Storage bags", "Transport to mandi"] },
    ],
  },
};

export function useCalendarTemplate(cropId: string | null) {
  return useQuery({
    queryKey: ["calendarTemplate", cropId],
    queryFn: async (): Promise<CalendarTemplate | null> => {
      if (!cropId) return null;
      try {
        const res = await api.get<{ success: boolean; data: CalendarTemplate }>(
          `/api/calendar/templates/${cropId}`
        );
        return res.data || FALLBACK_TEMPLATES[cropId] || null;
      } catch {
        return FALLBACK_TEMPLATES[cropId] || null;
      }
    },
    enabled: !!cropId,
    staleTime: 600000,
  });
}

export function useCalendarTasks(cropId?: string) {
  return useQuery({
    queryKey: ["calendarTasks", cropId],
    queryFn: async (): Promise<CalendarTask[]> => {
      try {
        const params: Record<string, string> = {};
        if (cropId) params.cropId = cropId;
        const res = await api.get<{ success: boolean; data: CalendarTask[] }>("/api/calendar/tasks", { params });
        return res.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 60000,
  });
}

export function useGenerateCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { cropId: string; sowingDate: string }): Promise<CalendarTask[]> => {
      try {
        const res = await api.post<{ success: boolean; data: CalendarTask[] }>("/api/calendar/tasks", payload);
        return res.data || generateLocalTasks(payload.cropId, payload.sowingDate);
      } catch {
        return generateLocalTasks(payload.cropId, payload.sowingDate);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarTasks"] });
    },
  });
}

export function useToggleCalendarTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { taskId: string; completed: boolean }): Promise<void> => {
      try {
        await api.patch(`/api/calendar/tasks/${payload.taskId}`, { completed: payload.completed });
      } catch {
        // handled locally
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarTasks"] });
    },
  });
}

function generateLocalTasks(cropId: string, sowingDate: string): CalendarTask[] {
  const template = FALLBACK_TEMPLATES[cropId];
  if (!template) return [];
  const sowing = new Date(sowingDate);
  return template.activities.map((activity) => {
    const due = new Date(sowing);
    due.setDate(due.getDate() + activity.weekNumber * 7);
    return {
      id: `local_${cropId}_${activity.id}`,
      cropId,
      cropName: template.cropName,
      weekNumber: activity.weekNumber,
      name: activity.name,
      description: activity.description,
      inputs: activity.inputs,
      sowingDate,
      dueDate: due.toISOString().split("T")[0],
      completed: false,
    };
  });
}

export { FALLBACK_TEMPLATES };
