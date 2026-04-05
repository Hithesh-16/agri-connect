"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  type: "question" | "success_story" | "tip" | "pest_help";
  title: string;
  content: string;
  images: string[];
  cropName?: string;
  location?: string;
  tags: string[];
  upvotes: number;
  commentCount: number;
  createdAt: string;
}

export interface CommunityComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  images: string[];
  isAnswer: boolean;
  upvotes: number;
  createdAt: string;
}

export interface CreatePostPayload {
  type: CommunityPost["type"];
  title: string;
  content: string;
  cropName?: string;
  tags: string[];
  images: string[];
}

export interface AddCommentPayload {
  content: string;
  images: string[];
}

const FALLBACK_POSTS: CommunityPost[] = [
  {
    id: "cp1",
    userId: "u1",
    userName: "Ramesh Reddy",
    userRole: "farmer",
    type: "question",
    title: "Which pesticide works for cotton leaf curl?",
    content: "My cotton crop in Warangal district is showing leaf curl symptoms since last week. The leaves are curling upward and becoming thick. I have tried Imidacloprid but it doesn't seem to work. What else can I use? Any experienced farmers please help.",
    images: [],
    cropName: "Cotton",
    location: "వరంగల్, తెలంగాణ",
    tags: ["cotton", "leaf-curl", "pesticide", "warangal"],
    upvotes: 12,
    commentCount: 4,
    createdAt: "2026-04-02T08:30:00Z",
  },
  {
    id: "cp2",
    userId: "u2",
    userName: "Lakshmi Devi",
    userRole: "farmer",
    type: "success_story",
    title: "Got 30 quintals per acre with new paddy variety!",
    content: "I planted the new BPT-5204 paddy variety this Kharif season and got amazing results. With proper SRI method of planting and timely fertilizer application, I harvested 30 quintals per acre. The total cost was around Rs. 18,000 per acre and I sold at Rs. 2,200 per quintal at Nizamabad mandi. Very happy with the results!",
    images: [],
    cropName: "Rice",
    location: "నిజామాబాద్, తెలంగాణ",
    tags: ["paddy", "SRI-method", "high-yield", "nizamabad"],
    upvotes: 45,
    commentCount: 8,
    createdAt: "2026-04-01T14:00:00Z",
  },
  {
    id: "cp3",
    userId: "u3",
    userName: "Suresh Kumar",
    userRole: "agricultural_officer",
    type: "tip",
    title: "Save water with mulching technique for tomato",
    content: "Sharing a proven technique for tomato growers: Use black plastic mulch or dried paddy straw between rows. This reduces water usage by 40%, controls weeds, and keeps soil temperature stable. Best time to apply is right after transplanting. I have seen farmers in Ranga Reddy district save Rs. 5,000 per acre on water costs alone.",
    images: [],
    cropName: "Tomato",
    location: "రంగారెడ్డి, తెలంగాణ",
    tags: ["tomato", "mulching", "water-saving", "technique"],
    upvotes: 28,
    commentCount: 5,
    createdAt: "2026-03-31T10:15:00Z",
  },
  {
    id: "cp4",
    userId: "u4",
    userName: "Venkat Rao",
    userRole: "farmer",
    type: "pest_help",
    title: "Pink bollworm attack on BT cotton - urgent help needed",
    content: "I am seeing pink bollworm damage in my BT cotton field near Adilabad. The larvae are boring into the bolls. Already lost about 20% of the crop. Which spray should I use at this stage? The crop is 90 days old. Please suggest immediately.",
    images: [],
    cropName: "Cotton",
    location: "ఆదిలాబాద్, తెలంగాణ",
    tags: ["cotton", "pink-bollworm", "pest-attack", "urgent"],
    upvotes: 8,
    commentCount: 6,
    createdAt: "2026-04-03T06:45:00Z",
  },
  {
    id: "cp5",
    userId: "u5",
    userName: "Anitha Kumari",
    userRole: "farmer",
    type: "question",
    title: "Best time to apply DAP for chili crop?",
    content: "I have transplanted Teja chili variety 15 days ago in Khammam. When should I apply DAP fertilizer? Should I mix it with urea? What is the recommended dosage per acre? First time growing chili, any guidance is welcome.",
    images: [],
    cropName: "Chili",
    location: "ఖమ్మం, తెలంగాణ",
    tags: ["chili", "fertilizer", "DAP", "khammam"],
    upvotes: 6,
    commentCount: 3,
    createdAt: "2026-04-02T16:20:00Z",
  },
  {
    id: "cp6",
    userId: "u6",
    userName: "Rajesh Patel",
    userRole: "dealer",
    type: "tip",
    title: "How to identify genuine seeds vs duplicate",
    content: "Many farmers are being cheated with duplicate seeds. Here are key things to check: 1) Always buy from licensed dealers 2) Check the lot number and expiry date on the packet 3) Verify the hologram sticker 4) Scan the QR code if available 5) Keep the bill safe for complaints. Report duplicates to the agriculture department immediately.",
    images: [],
    tags: ["seeds", "quality", "awareness", "duplicate"],
    upvotes: 52,
    commentCount: 11,
    createdAt: "2026-03-29T09:00:00Z",
  },
  {
    id: "cp7",
    userId: "u7",
    userName: "Madhavi Reddy",
    userRole: "farmer",
    type: "success_story",
    title: "Earned Rs 3 lakh from 2 acres of turmeric",
    content: "Sharing my turmeric success story from Nizamabad. I used the Salem variety, applied vermicompost and neem cake as base manure. Drip irrigation helped save water and gave uniform growth. Got 80 quintals from 2 acres and sold at Rs. 8,800 per quintal. After deducting all costs, my net profit was around Rs. 3 lakh. Key was proper curing and polishing before selling.",
    images: [],
    cropName: "Turmeric",
    location: "నిజామాబాద్, తెలంగాణ",
    tags: ["turmeric", "profit", "organic", "drip-irrigation"],
    upvotes: 67,
    commentCount: 14,
    createdAt: "2026-03-28T11:30:00Z",
  },
  {
    id: "cp8",
    userId: "u8",
    userName: "Krishna Murthy",
    userRole: "farmer",
    type: "pest_help",
    title: "Yellow mosaic virus in soybean - what to do?",
    content: "My soybean field in Medak is showing yellow patches on leaves with mosaic pattern. I suspect it is yellow mosaic virus transmitted by whiteflies. The crop is 45 days old. Is there any cure or should I remove affected plants? How to prevent it from spreading?",
    images: [],
    cropName: "Soybean",
    location: "మెదక్, తెలంగాణ",
    tags: ["soybean", "yellow-mosaic", "virus", "whitefly"],
    upvotes: 9,
    commentCount: 5,
    createdAt: "2026-04-01T07:00:00Z",
  },
];

const FALLBACK_COMMENTS: Record<string, CommunityComment[]> = {
  cp1: [
    { id: "cc1", userId: "u3", userName: "Suresh Kumar", content: "For leaf curl in cotton, the vector is whitefly. Use Diafenthiuron 50% WP at 1g/litre or Spiromesifen at 0.8ml/litre. Spray in the evening for best results. Also install yellow sticky traps.", images: [], isAnswer: true, upvotes: 8, createdAt: "2026-04-02T10:00:00Z" },
    { id: "cc2", userId: "u6", userName: "Rajesh Patel", content: "Try Thiamethoxam 25% WG at 0.5g/litre as an alternative. Rotate chemicals to avoid resistance.", images: [], isAnswer: false, upvotes: 3, createdAt: "2026-04-02T11:30:00Z" },
    { id: "cc3", userId: "u5", userName: "Anitha Kumari", content: "I had the same problem last year. Neem oil spray also helped reduce the whitefly population.", images: [], isAnswer: false, upvotes: 2, createdAt: "2026-04-02T14:00:00Z" },
    { id: "cc4", userId: "u1", userName: "Ramesh Reddy", content: "Thank you all! I will try Diafenthiuron first. Will update on the results.", images: [], isAnswer: false, upvotes: 1, createdAt: "2026-04-02T16:00:00Z" },
  ],
  cp4: [
    { id: "cc5", userId: "u3", userName: "Suresh Kumar", content: "For pink bollworm at 90 days, spray Profenofos 50% EC at 2ml/litre mixed with Emamectin Benzoate 5% SG at 0.4g/litre. Do 2-3 sprays at 10 day interval. Also use pheromone traps to monitor.", images: [], isAnswer: true, upvotes: 5, createdAt: "2026-04-03T08:00:00Z" },
    { id: "cc6", userId: "u2", userName: "Lakshmi Devi", content: "Remove and destroy all affected bolls immediately. This prevents further spread.", images: [], isAnswer: false, upvotes: 3, createdAt: "2026-04-03T09:30:00Z" },
  ],
};

export function useCommunityPosts(type?: string, cropId?: string) {
  return useQuery({
    queryKey: ["communityPosts", type, cropId],
    queryFn: async (): Promise<CommunityPost[]> => {
      try {
        const params: Record<string, string> = {};
        if (type) params.type = type;
        if (cropId) params.cropId = cropId;
        const res = await api.get<{ success: boolean; data: CommunityPost[] }>("/api/community/posts", { params });
        return res.data || FALLBACK_POSTS;
      } catch {
        let data = FALLBACK_POSTS;
        if (type) data = data.filter((p) => p.type === type);
        if (cropId) data = data.filter((p) => p.cropName?.toLowerCase() === cropId.toLowerCase());
        return data;
      }
    },
    staleTime: 60000,
  });
}

export function useCommunityPost(id: string) {
  return useQuery({
    queryKey: ["communityPost", id],
    queryFn: async (): Promise<{ post: CommunityPost; comments: CommunityComment[] }> => {
      try {
        const res = await api.get<{ success: boolean; data: { post: CommunityPost; comments: CommunityComment[] } }>(`/api/community/posts/${id}`);
        return res.data;
      } catch {
        const post = FALLBACK_POSTS.find((p) => p.id === id);
        const comments = FALLBACK_COMMENTS[id] || [];
        return { post: post || FALLBACK_POSTS[0], comments };
      }
    },
    staleTime: 30000,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePostPayload): Promise<CommunityPost> => {
      try {
        const res = await api.post<{ success: boolean; data: CommunityPost }>("/api/community/posts", payload);
        return res.data;
      } catch {
        return {
          id: `local_${Date.now()}`,
          userId: "current_user",
          userName: "You",
          userRole: "farmer",
          ...payload,
          upvotes: 0,
          commentCount: 0,
          createdAt: new Date().toISOString(),
        };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
    },
  });
}

export function useAddComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddCommentPayload): Promise<CommunityComment> => {
      try {
        const res = await api.post<{ success: boolean; data: CommunityComment }>(`/api/community/posts/${postId}/comments`, payload);
        return res.data;
      } catch {
        return {
          id: `local_${Date.now()}`,
          userId: "current_user",
          userName: "You",
          ...payload,
          isAnswer: false,
          upvotes: 0,
          createdAt: new Date().toISOString(),
        };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPost", postId] });
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
    },
  });
}

export function useUpvotePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string): Promise<{ success: boolean }> => {
      try {
        const res = await api.post<{ success: boolean }>(`/api/community/posts/${postId}/upvote`);
        return res;
      } catch {
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
    },
  });
}
